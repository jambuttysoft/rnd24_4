import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(req: Request) {
    const timestamp = new Date().toISOString()
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/stripe/webhook - Request received`)
        console.log('Headers:', Object.fromEntries(req.headers.entries()))
        console.log('URL:', req.url)
    }
    
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;
    let event: Stripe.Event;

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/stripe/webhook - Body length:`, body.length)
        console.log(`[${timestamp}] /api/stripe/webhook - Signature:`, signature)
    }

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Event constructed successfully`)
        }
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${timestamp}] /api/stripe/webhook - Webhook construction error:`, error)
        }
        return new NextResponse("webhook error", { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/stripe/webhook - Event type:`, event.type)
        console.log(`[${timestamp}] /api/stripe/webhook - Event data:`, JSON.stringify(event.data.object, null, 2))
    }
    
    console.log(event.type)

    // new subscription created
    if (event.type === "checkout.session.completed") {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Processing checkout.session.completed`)
        }
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Retrieving subscription:`, session.subscription)
        }
        
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            {
                expand: ['items.data.price.product'],
            }
        );
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Subscription retrieved:`, subscription.id)
            console.log(`[${timestamp}] /api/stripe/webhook - Client reference ID:`, session?.client_reference_id)
        }
        
        if (!session?.client_reference_id) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[${timestamp}] /api/stripe/webhook - No client reference ID found`)
            }
            return new NextResponse("no userid", { status: 400 });
        }
        const plan = subscription.items.data[0]?.price;

        if (!plan) {
            throw new Error('No plan found for this subscription.');
        }

        const productId = (plan.product as Stripe.Product).id;

        if (!productId) {
            throw new Error('No product ID found for this subscription.');
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Creating subscription record:`, {
                subscriptionId: subscription.id,
                productId: productId,
                priceId: plan.id,
                customerId: subscription.customer,
                userId: session.client_reference_id
            })
        }
        
        const stripeSubscription = await db.stripeSubscription.create({
            data: {
                subscriptionId: subscription.id,
                productId: productId,
                priceId: plan.id,
                customerId: subscription.customer as string,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                userId: session.client_reference_id
            }
        })
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Subscription created successfully:`, stripeSubscription.id)
        }

        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (event.type === "invoice.payment_succeeded") {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Processing invoice.payment_succeeded`)
        }
        
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            {
                expand: ['items.data.price.product'],
            }
        );
        const plan = subscription.items.data[0]?.price;

        if (!plan) {
            throw new Error('No plan found for this subscription.');
        }

        const productId = (plan.product as Stripe.Product).id;

        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Updating subscription:`, subscription.id)
        }
        
        await db.stripeSubscription.update({
            where: {
                subscriptionId: subscription.id
            },
            data: {
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                productId: productId,
                priceId: plan.id,
            }
        })
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Subscription updated successfully`)
        }
        
        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (event.type === 'customer.subscription.updated') {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Processing customer.subscription.updated`)
            console.log(`[${timestamp}] /api/stripe/webhook - Session data:`, session)
        }
        
        console.log('subscription updated', session)
        const subscription = await stripe.subscriptions.retrieve(session.id as string);
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Updating subscription record:`, session.id)
        }
        
        await db.stripeSubscription.update({
            where: {
                subscriptionId: session.id as string
            },
            data: {
                updatedAt: new Date(),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            }
        })
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/stripe/webhook - Subscription updated successfully`)
        }
        
        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/stripe/webhook - Unhandled event type:`, event.type)
    }

    return NextResponse.json({ message: "success" }, { status: 200 });

}