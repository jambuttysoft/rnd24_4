import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300

export const POST = async (req: NextRequest) => {
    const timestamp = new Date().toISOString()
    const body = await req.json()
    const { accountId, userId } = body
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/initial-sync - Request received:`, { accountId, userId })
    }
    
    if (!accountId || !userId) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/initial-sync - Invalid request: missing accountId or userId`)
        }
        return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/initial-sync - Looking up account:`, { accountId, userId })
    }

    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId,
        }
    })
    
    if (!dbAccount) {
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${timestamp}] /api/initial-sync - Account not found:`, { accountId, userId })
            // Let's also check if the account exists with different criteria
            const allUserAccounts = await db.account.findMany({
                where: { userId },
                select: { id: true, emailAddress: true, name: true }
            })
            console.log(`[${timestamp}] /api/initial-sync - Available accounts for user:`, allUserAccounts)
        }
        return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/initial-sync - Account found:`, {
            id: dbAccount.id,
            email: dbAccount.emailAddress,
            hasToken: !!dbAccount.token
        })
    }

    const account = new Account(dbAccount.token)
    await account.createSubscription()
    const response = await account.performInitialSync()
    if (!response) return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });

    const { deltaToken, emails } = response

    await syncEmailsToDatabase(emails, accountId)

    await db.account.update({
        where: {
            token: dbAccount.token,
        },
        data: {
            nextDeltaToken: deltaToken,
        },
    });
    console.log('sync complete', deltaToken)
    return NextResponse.json({ success: true, deltaToken }, { status: 200 });

}