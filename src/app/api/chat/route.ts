import { Configuration, OpenAIApi } from "openai-edge";
import { Message, OpenAIStream, StreamingTextResponse } from "ai";

import { NextResponse } from "next/server";
import { OramaManager } from "@/lib/orama";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { FREE_CREDITS_PER_DAY } from "@/app/constants";

// export const runtime = "edge";

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
    console.log('🟡 [API] Chat endpoint called');
    
    try {
        const { userId } = await auth()
        console.log('🟡 [API] User ID:', userId);
        
        if (!userId) {
            console.log('🔴 [API] Unauthorized - no user ID');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const isSubscribed = await getSubscriptionStatus()
        console.log('🟡 [API] Subscription status:', isSubscribed);
        
        if (!isSubscribed) {
            const chatbotInteraction = await db.chatbotInteraction.findUnique({
                where: {
                    day: new Date().toDateString(),
                    userId
                }
            })
            console.log('🟡 [API] Chatbot interaction:', chatbotInteraction);
            
            if (!chatbotInteraction) {
                console.log('🟡 [API] Creating new chatbot interaction');
                await db.chatbotInteraction.create({
                    data: {
                        day: new Date().toDateString(),
                        count: 1,
                        userId
                    }
                })
            } else if (chatbotInteraction.count >= FREE_CREDITS_PER_DAY) {
                console.log('🔴 [API] Limit reached:', chatbotInteraction.count);
                return NextResponse.json({ error: "Limit reached" }, { status: 429 });
            }
        }
        
        const { messages, accountId } = await req.json();
        console.log('🟡 [API] Request data:', { messagesCount: messages?.length, accountId });
        console.log('🟡 [API] Messages:', messages);
        
        const oramaManager = new OramaManager(accountId)
        console.log('🟡 [API] Initializing OramaManager...');
        await oramaManager.initialize()

        const lastMessage = messages[messages.length - 1]
        console.log('🟡 [API] Last message:', lastMessage);

        console.log('🟡 [API] Performing vector search...');
        const context = await oramaManager.vectorSearch({ prompt: lastMessage.content })
        console.log('🟡 [API] Vector search results:', context.hits.length + ' hits found')
        // console.log(context.hits.map(hit => hit.document))

        const prompt = {
            role: "system",
            content: `You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.
            THE TIME NOW IS ${new Date().toLocaleString()}
      
      START CONTEXT BLOCK
      ${context.hits.map((hit) => JSON.stringify(hit.document)).join('\n')}
      END OF CONTEXT BLOCK
      
      When responding, please keep in mind:
      - Be helpful, clever, and articulate.
      - Rely on the provided email context to inform your responses.
      - If the context does not contain enough information to answer a question, politely say you don't have enough information.
      - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
      - Do not invent or speculate about anything that is not directly supported by the email context.
      - Keep your responses concise and relevant to the user's questions or the email being composed.`
        };

        console.log('🟡 [API] Calling OpenAI API...');
        const response = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [
                prompt,
                ...messages.filter((message: Message) => message.role === "user"),
            ],
            stream: true,
        });
        
        console.log('🟢 [API] OpenAI response received');
        
        const stream = OpenAIStream(response, {
            onStart: async () => {
                console.log('🟢 [API] Stream started');
            },
            onCompletion: async (completion) => {
                console.log('🟢 [API] Stream completed:', completion);
                const today = new Date().toDateString()
                await db.chatbotInteraction.update({
                    where: {
                        userId,
                        day: today
                    },
                    data: {
                        count: {
                            increment: 1
                        }
                    }
                })
                console.log('🟢 [API] Chatbot interaction count updated');
            },
        });
        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error('🔴 [API] Error in chat endpoint:', error)
        return NextResponse.json({ error: "error" }, { status: 500 });
    }
}
