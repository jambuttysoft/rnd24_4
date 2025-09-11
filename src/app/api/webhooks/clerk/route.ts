import { db } from "@/server/db";

export const POST = async (req: Request) => {
    const timestamp = new Date().toISOString()
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/webhooks/clerk - Request received`)
        console.log('Headers:', Object.fromEntries(req.headers.entries()))
        console.log('URL:', req.url)
    }
    
    const requestBody = await req.json();
    const { data } = requestBody;
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/webhooks/clerk - Full request body:`, JSON.stringify(requestBody, null, 2))
        console.log(`[${timestamp}] /api/webhooks/clerk - User data:`, JSON.stringify(data, null, 2))
    }
    
    const emailAddress = data.email_addresses[0].email_address;
    const firstName = data.first_name;
    const lastName = data.last_name;
    const imageUrl = data.image_url;
    const id = data.id;
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] /api/webhooks/clerk - Extracted user info:`, {
            id,
            emailAddress,
            firstName,
            lastName,
            imageUrl
        })
    }

    try {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/webhooks/clerk - Checking existing user by email:`, emailAddress)
        }
        
        // First check if user exists by email
        const existingUserByEmail = await db.user.findUnique({
            where: { emailAddress }
        });
        
        if (existingUserByEmail && existingUserByEmail.id !== id) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[${timestamp}] /api/webhooks/clerk - Email already exists for different user:`, existingUserByEmail.id)
            }
            // Update the existing user with new Clerk ID and data
            await db.user.update({
                where: { emailAddress },
                data: { id, firstName, lastName, imageUrl }
            });
        } else {
            // Safe to upsert by ID
            if (process.env.NODE_ENV === 'development') {
                console.log(`[${timestamp}] /api/webhooks/clerk - Upserting user:`, id)
            }
            
            await db.user.upsert({
                where: { id },
                update: { emailAddress, firstName, lastName, imageUrl },
                create: { id, emailAddress, firstName, lastName, imageUrl },
            });
        }
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] /api/webhooks/clerk - User processed successfully:`, id)
        }
        
        return new Response('Webhook received', { status: 200 });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${timestamp}] /api/webhooks/clerk - Error processing user:`, error)
        }
        console.error('Error in clerk webhook:', error)
        return new Response('Internal server error', { status: 500 });
    }
}