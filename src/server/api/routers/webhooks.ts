import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { authoriseAccountAccess } from "./mail";
import Account from "@/lib/account";

export const webhooksRouter = createTRPCRouter({
    getWebhooks: protectedProcedure.input(z.object({
        accountId: z.string().min(1, "Account ID cannot be empty")
    })).query(async ({ ctx, input }) => {
        const acc = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const account = new Account(acc.token)
        return await account.getWebhooks()
    }),
    createWebhook: protectedProcedure.input(z.object({
        accountId: z.string().min(1, "Account ID cannot be empty"),
        notificationUrl: z.string()
    })).mutation(async ({ ctx, input }) => {
        const acc = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const account = new Account(acc.token)
        return await account.createWebhook('/email/messages', input.notificationUrl)
    }),
    deleteWebhook: protectedProcedure.input(z.object({
        accountId: z.string().min(1, "Account ID cannot be empty"),
        webhookId: z.string()
    })).mutation(async ({ ctx, input }) => {
        const acc = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const account = new Account(acc.token)
        return await account.deleteWebhook(input.webhookId)
    })
})