'server-only'
import Stripe from 'stripe'

// Validate Stripe secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key_here') {
  throw new Error('STRIPE_SECRET_KEY is not properly configured. Please set a valid Stripe secret key in your environment variables.')
}

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
})

