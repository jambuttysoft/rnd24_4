import type { EmailHeader, EmailMessage, SyncResponse, SyncUpdatedResponse } from '@/lib/types';
import { db } from '@/server/db';
import axios from 'axios';
import { withAurinkoRetry } from './retry';
import { handleAurinkoError } from './errors';
import { syncEmailsToDatabase } from './sync-to-db';

const API_BASE_URL = 'https://api.aurinko.io/v1';

class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync(daysWithin: number): Promise<SyncResponse> {
        const response = await axios.post<SyncResponse>(
            `${API_BASE_URL}/email/sync`,
            {},
            {
                headers: { Authorization: `Bearer ${this.token}` }, params: {
                    daysWithin,
                    bodyType: 'html'
                }
            }
        );
        return response.data;
    }

    async createSubscription() {
        const webhookUrl = process.env.NEXT_PUBLIC_URL
        const res = await axios.post('https://api.aurinko.io/v1/subscriptions',
            {
                resource: '/email/messages',
                notificationUrl: webhookUrl + '/api/aurinko/webhook'
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            }
        )
        return res.data
    }

    async syncEmails() {
        return withAurinkoRetry(async () => {
            try {
                const account = await db.account.findUnique({
                    where: {
                        token: this.token
                    },
                })
                if (!account) throw new Error("Invalid token")
                
                // If no delta token exists, perform initial sync
                if (!account.nextDeltaToken) {
                    console.log('No delta token found, performing initial sync...')
                    const initialSyncResult = await this.performInitialSync()
                    if (!initialSyncResult) throw new Error("Failed to perform initial sync")
                    
                    try {
                        await syncEmailsToDatabase(initialSyncResult.emails, account.id)
                    } catch (error) {
                        console.log('error during initial sync to database', error)
                    }
                    
                    await db.account.update({
                        where: {
                            id: account.id,
                        },
                        data: {
                            nextDeltaToken: initialSyncResult.deltaToken,
                        }
                    })
                    return
                }
                
                // Perform incremental sync with existing delta token
                let response = await this.getUpdatedEmails({ deltaToken: account.nextDeltaToken })
                let allEmails: EmailMessage[] = response.records
                let storedDeltaToken = account.nextDeltaToken
                if (response.nextDeltaToken) {
                    storedDeltaToken = response.nextDeltaToken
                }
                while (response.nextPageToken) {
                    response = await this.getUpdatedEmails({ pageToken: response.nextPageToken });
                    allEmails = allEmails.concat(response.records);
                    if (response.nextDeltaToken) {
                        storedDeltaToken = response.nextDeltaToken
                    }
                }

                if (!response) throw new Error("Failed to sync emails")

                try {
                    await syncEmailsToDatabase(allEmails, account.id)
                } catch (error) {
                    console.log('error', error)
                }

                // console.log('syncEmails', response)
                await db.account.update({
                    where: {
                        id: account.id,
                    },
                    data: {
                        nextDeltaToken: storedDeltaToken,
                    }
                })
            } catch (error) {
                throw handleAurinkoError(error, 'Failed to sync emails');
            }
        });
    }

    async getUpdatedEmails({ deltaToken, pageToken }: { deltaToken?: string, pageToken?: string }): Promise<SyncUpdatedResponse> {
        return withAurinkoRetry(async () => {
            try {
                // console.log('getUpdatedEmails', { deltaToken, pageToken });
                let params: Record<string, string> = {};
                if (deltaToken) {
                    params.deltaToken = deltaToken;
                }
                if (pageToken) {
                    params.pageToken = pageToken;
                }
                const response = await axios.get<SyncUpdatedResponse>(
                    `${API_BASE_URL}/email/sync/updated`,
                    {
                        params,
                        headers: { Authorization: `Bearer ${this.token}` }
                    }
                );
                return response.data;
            } catch (error) {
                throw handleAurinkoError(error, 'Failed to get updated emails');
            }
        });
    }

    async performInitialSync() {
        return withAurinkoRetry(async () => {
            try {
                // Start the sync process
                const daysWithin = 2
                let syncResponse = await this.startSync(daysWithin);

                // Wait until the sync is ready
                while (!syncResponse.ready) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
                    syncResponse = await this.startSync(daysWithin);
                }

                // Perform initial sync of updated emails
                let storedDeltaToken: string = syncResponse.syncUpdatedToken
                let updatedResponse = await this.getUpdatedEmails({ deltaToken: syncResponse.syncUpdatedToken });
                if (updatedResponse.nextDeltaToken) {
                    storedDeltaToken = updatedResponse.nextDeltaToken
                }
                let allEmails: EmailMessage[] = updatedResponse.records;

                // Fetch all pages if there are more
                while (updatedResponse.nextPageToken) {
                    updatedResponse = await this.getUpdatedEmails({ pageToken: updatedResponse.nextPageToken });
                    allEmails = allEmails.concat(updatedResponse.records);
                    if (updatedResponse.nextDeltaToken) {
                        storedDeltaToken = updatedResponse.nextDeltaToken
                    }
                }

                return {
                    emails: allEmails,
                    deltaToken: storedDeltaToken,
                }

            } catch (error) {
                throw handleAurinkoError(error, 'Failed to perform initial sync');
            }
        });
    }


    async sendEmail({
        from,
        subject,
        body,
        inReplyTo,
        references,
        threadId,
        to,
        cc,
        bcc,
        replyTo,
    }: {
        from: EmailAddress;
        subject: string;
        body: string;
        inReplyTo?: string;
        references?: string;
        threadId?: string;
        to: EmailAddress[];
        cc?: EmailAddress[];
        bcc?: EmailAddress[];
        replyTo?: EmailAddress;
    }) {
        return withAurinkoRetry(async () => {
            try {
                const response = await axios.post(
                    `${API_BASE_URL}/email/messages`,
                    {
                        from,
                        subject,
                        body,
                        inReplyTo,
                        references,
                        threadId,
                        to,
                        cc,
                        bcc,
                        replyTo: [replyTo],
                    },
                    {
                        params: {
                            returnIds: true
                        },
                        headers: { Authorization: `Bearer ${this.token}` }
                    }
                );

                console.log('sendEmail response', response.data);
                return response.data;
            } catch (error) {
                throw handleAurinkoError(error, 'Failed to send email');
            }
        });
    }


    async getWebhooks() {
        return withAurinkoRetry(async () => {
            try {
                type Response = {
                    records: {
                        id: number;
                        resource: string;
                        notificationUrl: string;
                        active: boolean;
                        failSince: string;
                        failDescription: string;
                    }[];
                    totalSize: number;
                    offset: number;
                    done: boolean;
                }
                const res = await axios.get<Response>(`${API_BASE_URL}/subscriptions`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                })
                return res.data
            } catch (error) {
                throw handleAurinkoError(error, 'Failed to get webhooks');
            }
        });
    }

    async createWebhook(resource: string, notificationUrl: string) {
        return withAurinkoRetry(async () => {
            try {
                const res = await axios.post(`${API_BASE_URL}/subscriptions`, {
                    resource,
                    notificationUrl
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                })
                return res.data
            } catch (error) {
                throw handleAurinkoError(error, 'Failed to create webhook');
            }
        });
    }

    async deleteWebhook(subscriptionId: string) {
        return withAurinkoRetry(async () => {
            try {
                const res = await axios.delete(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                })
                return res.data
            } catch (error) {
                throw handleAurinkoError(error, 'Failed to delete webhook');
            }
        });
    }
}
type EmailAddress = {
    name: string;
    address: string;
}

export default Account;
