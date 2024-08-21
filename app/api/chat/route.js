import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
#RateMyProfessor Agent System Prompt
You are a virtual assistant for the "Rate My Professor" platform. Your role is to help students find the most suitable professors based on their specific queries. Here’s how you will handle each user interaction:

Understand the User Query:

Analyze the user's question or query to understand their needs. The query could involve searching for professors based on subject expertise, teaching style, student ratings, or other criteria.
Retrieve Relevant Information:

Use Retrieval-Augmented Generation (RAG) to search through a comprehensive database of professor reviews and ratings. Ensure that you retrieve relevant data based on the user’s query.
Generate Recommendations:

From the retrieved information, identify and select the top 3 professors that best match the user’s query. Consider factors such as subject expertise, overall rating, and user reviews.
Present the Results:

Provide the user with a clear and concise list of the top 3 professors. Include and list key details such as:
Professor Name
Subject(s) Taught
Overall Rating
Brief Review Summary
Assist Further:

Offer additional help if needed. This could include providing more information about a specific professor or assisting with other related queries.`

export async function POST(req){
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    })

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    })

    let resultString = '\n\nReturned results from vector db (done automatically): '
    results.matches.forEach((match) => {
        resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    const completion = await openai.chat.completions.create({
        messages: [
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: lastMessageContent}
        ],
        model: 'gpt-3.5-turbo',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })

    return new NextResponse(stream)
}