'use server'
import axios from 'axios'
import type { EmailMessage } from './types';
import { auth } from '@clerk/nextjs/server';
import { getSubscriptionStatus } from './stripe-actions';
import { db } from '@/server/db';
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from '@/app/constants';
import { withAurinkoRetry } from './retry';
import { handleAurinkoError, AuthenticationError } from './errors';

export const getAurinkoAuthorizationUrl = async (serviceType: 'Google' | 'Office365') => {
    try {
        const { userId } = await auth()
        if (!userId) throw new AuthenticationError('User not authenticated')

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user) throw new AuthenticationError('User not found in database')

        const isSubscribed = await getSubscriptionStatus()
        const accounts = await db.account.count({ where: { userId } })

        if (user.role === 'user') {
            const maxAccounts = isSubscribed ? PRO_ACCOUNTS_PER_USER : FREE_ACCOUNTS_PER_USER;
            if (accounts >= maxAccounts) {
                throw new Error(`You have reached the maximum number of accounts (${maxAccounts}) for your subscription`)
            }
        }


        const params = new URLSearchParams({
            clientId: process.env.AURINKO_CLIENT_ID as string,
            serviceType,
            scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
            responseType: 'code',
            returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
        });

        return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
    } catch (error) {
        console.error('Error generating authorization URL:', error);
        throw error;
    }
};


export const exchangeCodeForAccessToken = async (code: string) => {
    return withAurinkoRetry(async () => {
        try {
            const response = await axios.post(`https://api.aurinko.io/v1/auth/token/${code}`,
                {},
                {
                    auth: {
                        username: process.env.AURINKO_CLIENT_ID as string,
                        password: process.env.AURINKO_CLIENT_SECRET as string,
                    }
                }
            );

            return response.data as {
                accountId: number,
                accessToken: string,
                userId: string,
                userSession: string
            }
        } catch (error) {
            throw handleAurinkoError(error, 'Failed to exchange code for access token');
        }
    });
}

export const getAccountDetails = async (accessToken: string) => {
    return withAurinkoRetry(async () => {
        try {
            const response = await axios.get('https://api.aurinko.io/v1/account', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data as {
                email: string,
                name: string
            }
        } catch (error) {
            throw handleAurinkoError(error, 'Failed to fetch account details');
        }
    });
}

export const getEmailDetails = async (accessToken: string, emailId: string) => {
    try {
        const response = await axios.get<EmailMessage>(`https://api.aurinko.io/v1/email/messages/${emailId}`, {
            params: {
                loadInlines: true
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching email details:', error.response?.data);
        } else {
            console.error('Unexpected error fetching email details:', error);
        }
        throw error;
    }
}