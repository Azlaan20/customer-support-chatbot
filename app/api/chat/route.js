import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
You are a customer support assistant for HeadStarter AI, a platform that conducts AI-powered interviews for software engineering jobs. Your goal is to help users with any questions or issues they have regarding the platform, including how to set up an account, how the AI interviews work, what features are available, and any technical difficulties they might encounter. Be polite, clear, and provide concise answers. If a user asks for information beyond your knowledge, direct them to the appropriate resources or escalate the issue if necessary.
`;

export async function POST(req) {
    const { OPENAI_API_KEY } = process.env;
    const openai = new OpenAI(OPENAI_API_KEY);
    const data = await req.json();

    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            ...data,
        ],
        model: 'gpt-3.5-turbo', // Correct model name
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (error) {
                controller.error(error);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
}
