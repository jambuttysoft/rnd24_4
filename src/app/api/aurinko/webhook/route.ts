import { NextRequest } from "next/server";
import crypto from "crypto";
import axios from "axios";
import Account from "@/lib/account";
import { db } from "@/server/db";
import { waitUntil } from "@vercel/functions";

const AURINKO_SIGNING_SECRET = process.env.AURINKO_SIGNING_SECRET;

export const POST = async (req: NextRequest) => {
    const timestamp = new Date().toISOString()
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Request received`)
        console.log('Headers:', Object.fromEntries(req.headers.entries()))
        console.log('URL:', req.url)
        console.log('Search params:', Object.fromEntries(req.nextUrl.searchParams.entries()))
    }
    
    console.log("POST request received");
    const query = req.nextUrl.searchParams;
    const validationToken = query.get("validationToken");
    if (validationToken) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Validation token received:`, validationToken)
        }
        return new Response(validationToken, { status: 200 });
    }

    const aurinkoTimestamp = req.headers.get("X-Aurinko-Request-Timestamp");
    const signature = req.headers.get("X-Aurinko-Signature");
    const body = await req.text();

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Aurinko timestamp:`, aurinkoTimestamp)
        console.log(`[${timestamp}] /api/aurinko/webhook - Signature:`, signature)
        console.log(`[${timestamp}] /api/aurinko/webhook - Body length:`, body.length)
        console.log(`[${timestamp}] /api/aurinko/webhook - Raw body:`, body)
    }

    if (!aurinkoTimestamp || !signature || !body) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Missing required fields:`, {
                timestamp: !!aurinkoTimestamp,
                signature: !!signature,
                body: !!body
            })
        }
        return new Response("Bad Request", { status: 400 });
    }

    const basestring = `v0:${aurinkoTimestamp}:${body}`;
    const expectedSignature = crypto
        .createHmac("sha256", AURINKO_SIGNING_SECRET!)
        .update(basestring)
        .digest("hex");

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Signature verification:`, {
            received: signature,
            expected: expectedSignature,
            match: signature === expectedSignature
        })
    }

    if (signature !== expectedSignature) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Signature verification failed`)
        }
        return new Response("Unauthorized", { status: 401 });
    }
    type AurinkoNotification = {
        subscription: number;
        resource: string;
        accountId: number;
        error?: string;
        lifecycleEvent?: string;
        payloads: {
            id: string;
            changeType: string;
            attributes: {
                threadId: string;
            };
        }[];
    };

    const payload = JSON.parse(body) as AurinkoNotification;
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Parsed payload:`, JSON.stringify(payload, null, 2))
    }
    
    console.log("Received notification:", JSON.stringify(payload, null, 2));
    
    // Handle error notifications (like 'Active token is missing')
    if (payload.error || payload.lifecycleEvent === 'error') {
        console.error('Webhook error received:', payload.error || 'Unknown error');
        
        if (payload.error === 'Active token is missing') {
            console.log('Token missing for account:', payload.accountId);
            // Mark account as needing re-authorization
            await db.account.update({
                where: {
                    id: payload.accountId.toString()
                },
                data: {
                    nextDeltaToken: null // Reset delta token to force re-sync
                }
            }).catch(error => {
                console.error('Failed to update account after token error:', error);
            });
        }
        
        return new Response('Error notification processed', { status: 200 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Looking up account:`, payload.accountId)
    }
    
    const account = await db.account.findUnique({
        where: {
            id: payload.accountId.toString()
        }
    })
    if (!account) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Account not found:`, payload.accountId)
        }
        return new Response("Account not found", { status: 404 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Account found:`, account.id)
    }
    const acc = new Account(account.token)
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Starting email sync for account:`, account.id)
    }
    
    waitUntil(acc.syncEmails().then(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Email sync completed for account:`, account.id)
        }
        console.log("Synced emails")
    }).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${timestamp}] /api/aurinko/webhook - Email sync failed:`, error)
        }
        console.error("Email sync failed:", error)
    }))

    // Process the notification payload as needed
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Webhook processing completed successfully`)
    }

    return new Response(null, { status: 200 });
};
