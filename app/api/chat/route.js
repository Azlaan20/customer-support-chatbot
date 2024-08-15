import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
You are a customer support assistant for HeadStarter AI, a platform that conducts AI-powered interviews for software engineering jobs. Your goal is to help users with any questions or issues they might have regarding the platform, including how to set up an account, how the AI interviews work, what features are available, and any technical difficulties they might encounter. Be polite, clear, and provide concise answers. If a user asks for information beyond your knowledge, direct them to the appropriate resources or escalate the issue if necessary.
`;

export async function POST(req) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    let data;

    try {
        data = await req.json();
    } catch (error) {
        return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 });
    }

    if (!Array.isArray(data)) {
        return NextResponse.json({ error: "Data should be an array" }, { status: 400 });
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...data,
            ],
            model: 'gpt-3.5-turbo',
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
                    console.error('Error processing stream:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream);
    } catch (error) {
        console.error('Error during API request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
