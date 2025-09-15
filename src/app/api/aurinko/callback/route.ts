import { getAccountDetails, exchangeCodeForAccessToken } from "@/lib/aurinko";
import { waitUntil } from '@vercel/functions'
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";
import { withAurinkoRetry } from "@/lib/retry";
import { handleAurinkoError, AurinkoAPIError } from "@/lib/errors";

// Helper function for consistent logging
const logDebug = (timestamp: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - ${message}`, data || '');
    }
};

const logError = (timestamp: string, message: string, error: any, data?: any) => {
    console.error(`[${timestamp}] /api/aurinko/callback - ${message}`, {
        error: error instanceof Error ? error.message : error,
        ...data
    });
};

export const GET = async (req: NextRequest) => {
    const timestamp = new Date().toISOString()
    
    logDebug(timestamp, 'Request received', {
        headers: Object.fromEntries(req.headers.entries()),
        url: req.url,
        searchParams: Object.fromEntries(req.nextUrl.searchParams.entries())
    });

    const { userId } = await auth()
    if (!userId) {
        logDebug(timestamp, 'Unauthorized: No userId');
        return NextResponse.json({ 
            error: "UNAUTHORIZED", 
            details: "User authentication required" 
        }, { status: 401 });
    }
    
    logDebug(timestamp, 'Authenticated user:', userId);

    const params = req.nextUrl.searchParams
    const status = params.get('status');

    logDebug(timestamp, 'OAuth status:', status);

    if (status !== 'success') {
        logDebug(timestamp, 'Failed to link account, status:', status);
        return NextResponse.json({ 
            error: "Account connection failed", 
            details: `OAuth flow completed with status: ${status}` 
        }, { status: 400 });
    }

    const code = params.get('code');
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    // Handle OAuth errors
    if (error) {
        console.error(`[${timestamp}] /api/aurinko/callback - OAuth error:`, {
            error,
            description: errorDescription,
            userId
        });
        return NextResponse.json({ 
            error: 'OAuth authorization failed', 
            details: errorDescription || error,
            code: error
        }, { status: 400 });
    }
    
    // Validate authorization code
     if (!code) {
         logDebug(timestamp, 'No authorization code provided');
         return NextResponse.json({ 
             error: 'Missing authorization code', 
             details: 'No authorization code was provided in the callback' 
         }, { status: 400 });
     }
     
     // Validate code format (basic validation)
     if (typeof code !== 'string' || code.length < 10) {
         logDebug(timestamp, 'Invalid authorization code format');
         return NextResponse.json({ 
             error: 'Invalid authorization code', 
             details: 'The provided authorization code appears to be invalid' 
         }, { status: 400 });
     }
     
     logDebug(timestamp, 'Authorization code received:', code.substring(0, 10) + '...');

    logDebug(timestamp, 'Exchanging code for token...');
    
    let token;
    try {
        token = await exchangeCodeForAccessToken(code as string);
        logDebug(timestamp, 'Token received successfully');
    } catch (error) {
        logError(timestamp, 'Token exchange failed', error);
        if (error instanceof AurinkoAPIError) {
             return NextResponse.json({ 
                 error: "Failed to exchange authorization code", 
                 details: error.message 
             }, { status: error.status || 400 });
        }
        return NextResponse.json({ error: "Failed to fetch token" }, { status: 500 });
    }

    logDebug(timestamp, 'Getting account details...');
    
    let accountDetails;
    try {
        accountDetails = await getAccountDetails(token.accessToken);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/callback - Account details:`, {
                email: accountDetails.email,
                name: accountDetails.name,
                accountId: token.accountId
            })
        }
    } catch (error) {
        logError(timestamp, 'Failed to get account details', error);
        if (error instanceof AurinkoAPIError) {
            return NextResponse.json({ 
                error: "Failed to fetch account details", 
                details: error.message 
            }, { status: error.status || 400 });
        }
        return NextResponse.json({ error: "Failed to fetch account details" }, { status: 500 });
    }

    // Validate account data
    if (!accountDetails.email || !accountDetails.name) {
        console.error(`[${timestamp}] /api/aurinko/callback - Invalid account details:`, {
            hasEmail: !!accountDetails.email,
            hasName: !!accountDetails.name,
            accountId: token.accountId
        });
        return NextResponse.json({ 
            error: "Invalid account details", 
            details: "Missing required account information from provider" 
        }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountDetails.email)) {
        console.error(`[${timestamp}] /api/aurinko/callback - Invalid email format:`, {
            email: accountDetails.email,
            accountId: token.accountId
        });
        return NextResponse.json({ 
            error: "Invalid email format", 
            details: "The email address from the provider is not valid" 
        }, { status: 400 });
    }
    
    const accountData = {
        id: token.accountId.toString(),
        userId,
        token: token.accessToken,
        provider: 'Aurinko',
        emailAddress: accountDetails.email,
        name: accountDetails.name
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Upserting account:`, {
            accountId: accountData.id,
            userId: accountData.userId,
            email: accountData.emailAddress,
            name: accountData.name,
            hasToken: !!accountData.token
        })
    }
    
    let upsertedAccount;
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/callback - Attempting to upsert account:`, {
                accountId: accountData.id,
                userId: accountData.userId,
                email: accountData.emailAddress,
                provider: accountData.provider
            })
        }
        
        upsertedAccount = await db.account.upsert({
            where: { id: token.accountId.toString() },
            create: accountData,
            update: {
                token: token.accessToken,
            }
        })
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/callback - Account upserted successfully:`, {
                 id: upsertedAccount.id,
                 userId: upsertedAccount.userId,
                 email: upsertedAccount.emailAddress
             })
        }
    } catch (error) {
        console.error(`[${timestamp}] /api/aurinko/callback - Database operation failed:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            accountData: {
                id: accountData.id,
                userId: accountData.userId,
                email: accountData.emailAddress,
                provider: accountData.provider
            },
            stack: error instanceof Error ? error.stack : undefined
        });
        
        // Check for specific database errors
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return NextResponse.json({ 
                    error: "Account already exists with different user", 
                    details: "This email account is already connected to another user" 
                }, { status: 409 });
            }
            if (error.message.includes('Foreign key constraint')) {
                return NextResponse.json({ 
                    error: "Invalid user reference", 
                    details: "User not found in database" 
                }, { status: 400 });
            }
        }
        
        return NextResponse.json({ 
            error: "Failed to save account", 
            details: "Database operation failed" 
        }, { status: 500 });
    }
    
    logDebug(timestamp, 'Account upserted successfully');
    logDebug(timestamp, 'Triggering initial sync...');
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_URL) {
        console.error(`[${timestamp}] /api/aurinko/callback - Missing NEXT_PUBLIC_URL environment variable`);
        return NextResponse.json({ 
            error: "Configuration error", 
            details: "Server configuration is incomplete" 
        }, { status: 500 });
    }
    
    waitUntil(
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, { 
            accountId: token.accountId.toString(), 
            userId 
        }, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            logDebug(timestamp, 'Initial sync triggered successfully', res.data);
        }).catch((err) => {
            logError(timestamp, 'Initial sync failed', err, {
                accountId: token.accountId.toString(),
                userId,
                responseData: err.response?.data,
                status: err.response?.status
            });
        })
    )

    logDebug(timestamp, 'Redirecting to /mail');
    
    return NextResponse.redirect(new URL('/mail', process.env.NEXT_PUBLIC_URL))
    
}