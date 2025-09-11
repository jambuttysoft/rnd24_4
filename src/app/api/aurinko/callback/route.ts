import { getAccountDetails, getAurinkoToken } from "@/lib/aurinko";
import { waitUntil } from '@vercel/functions'
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    const timestamp = new Date().toISOString()
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Request received`)
        console.log('Headers:', Object.fromEntries(req.headers.entries()))
        console.log('URL:', req.url)
        console.log('Search params:', Object.fromEntries(req.nextUrl.searchParams.entries()))
    }

    const { userId } = await auth()
    if (!userId) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/callback - Unauthorized: No userId`)
        }
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Authenticated user:`, userId)
    }

    const params = req.nextUrl.searchParams
    const status = params.get('status');

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - OAuth status:`, status)
    }

    if (status !== 'success') {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/callback - Failed to link account, status:`, status)
        }
        return NextResponse.json({ error: "Account connection failed" }, { status: 400 });
    }

    const code = params.get('code');
    if (!code) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/callback - No authorization code provided`)
        }
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Authorization code received:`, code.substring(0, 10) + '...')
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Exchanging code for token...`)
    }
    
    const token = await getAurinkoToken(code as string)
    if (!token) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/aurinko/callback - Failed to exchange code for token`)
        }
        return NextResponse.json({ error: "Failed to fetch token" }, { status: 400 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Token received successfully`)
    }
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Getting account details...`)
    }
    
    const accountDetails = await getAccountDetails(token.accessToken)
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Account details:`, {
            email: accountDetails.email,
            name: accountDetails.name,
            accountId: token.accountId
        })
    }

    await db.account.upsert({
        where: { id: token.accountId.toString() },
        create: {
            id: token.accountId.toString(),
            userId,
            token: token.accessToken,
            provider: 'Aurinko',
            emailAddress: accountDetails.email,
            name: accountDetails.name
        },
        update: {
            token: token.accessToken,
        }
    })
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Account upserted successfully`)
    }
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Triggering initial sync...`)
    }
    
    waitUntil(
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, { accountId: token.accountId.toString(), userId }).then((res) => {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[${timestamp}] /api/aurinko/callback - Initial sync triggered successfully`)
            }
            console.log(res.data)
        }).catch((err) => {
            if (process.env.NODE_ENV === 'development') {
                console.error(`[${timestamp}] /api/aurinko/callback - Initial sync error:`, err.response?.data)
            }
            console.log(err.response.data)
        })
    )

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/aurinko/callback - Redirecting to /mail`)
    }
    
    return NextResponse.redirect(new URL('/mail', req.url))
}