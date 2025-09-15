import { NextRequest } from "next/server";
import crypto from "crypto";
import axios from "axios";
import Account from "@/lib/account";
import { db } from "@/server/db";
import { waitUntil } from "@vercel/functions";
import { validateWebhookPayload, validateWebhookHeaders } from "@/lib/webhook-validation";
import { WebhookValidationError, AurinkoAPIError } from "@/lib/errors";

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
    let payload;
    try {
        // Validate webhook headers
        const headers = {
            'x-aurinko-request-timestamp': aurinkoTimestamp,
            'x-aurinko-signature': signature
        };
        validateWebhookHeaders(headers);
        
        // Parse and validate payload
        const parsedPayload = JSON.parse(body);
        payload = validateWebhookPayload(parsedPayload);
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Payload validated successfully`);
        }
    } catch (error) {
        console.error(`[${timestamp}] /api/aurinko/webhook - Validation error:`, error);
        
        if (error instanceof WebhookValidationError) {
            return new Response(`Validation Error: ${error.message}`, { status: 400 });
        }
        
        return new Response('Invalid webhook payload', { status: 400 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Parsed payload:`, JSON.stringify(payload, null, 2))
    }
    
    console.log("Received notification:", JSON.stringify(payload, null, 2));
    
    // Handle error notifications (like 'Active token is missing')
    if (payload.error || payload.lifecycleEvent === 'error') {
        const errorMessage = payload.error || 'Unknown error';
        console.error(`[${timestamp}] /api/aurinko/webhook - Webhook error received:`, {
            error: errorMessage,
            accountId: payload.accountId,
            subscription: payload.subscription,
            lifecycleEvent: payload.lifecycleEvent
        });
        
        if (payload.error === 'Active token is missing') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Token missing for account:`, payload.accountId);
            
            try {
                // Mark account as needing re-authorization
                await db.account.update({
                    where: {
                        id: payload.accountId.toString()
                    },
                    data: {
                        nextDeltaToken: null // Reset delta token to force re-sync
                    }
                });
                console.log(`[${timestamp}] /api/aurinko/webhook - Account ${payload.accountId} marked for re-authorization`);
            } catch (dbError) {
                console.error(`[${timestamp}] /api/aurinko/webhook - Failed to update account after token error:`, {
                    accountId: payload.accountId,
                    error: dbError
                });
                return new Response('Database error while processing token error', { status: 500 });
            }
        }
        
        return new Response('Error notification processed', { status: 200 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Looking up account:`, payload.accountId)
    }
    
    let account;
    try {
        account = await db.account.findUnique({
            where: {
                id: payload.accountId.toString()
            }
        });
    } catch (dbError) {
        console.error(`[${timestamp}] /api/aurinko/webhook - Database error while looking up account:`, {
            accountId: payload.accountId,
            error: dbError
        });
        return new Response("Database error", { status: 500 });
    }
    
    if (!account) {
        console.warn(`[${timestamp}] /api/aurinko/webhook - Account not found:`, {
            accountId: payload.accountId,
            subscription: payload.subscription
        });
        return new Response("Account not found", { status: 404 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Account found:`, account.id)
    }
    
    try {
        const acc = new Account(account.token);
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/webhook - Starting email sync for account:`, account.id)
        }
        
        waitUntil(acc.syncEmails().then(() => {
            console.log(`[${timestamp}] /api/aurinko/webhook - Email sync completed successfully for account:`, account.id);
        }).catch((syncError) => {
            console.error(`[${timestamp}] /api/aurinko/webhook - Email sync failed for account ${account.id}:`, {
                accountId: account.id,
                error: syncError instanceof Error ? {
                    name: syncError.name,
                    message: syncError.message,
                    stack: syncError.stack
                } : syncError
            });
        }));
    } catch (error) {
        console.error(`[${timestamp}] /api/aurinko/webhook - Failed to initialize Account or start sync:`, {
            accountId: account.id,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error
        });
        return new Response("Failed to process webhook", { status: 500 });
    }

    // Process the notification payload as needed
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/webhook - Webhook processing completed successfully`)
    }

    return new Response(null, { status: 200 });
};
