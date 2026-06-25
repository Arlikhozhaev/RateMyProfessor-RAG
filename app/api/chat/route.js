import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserFromRequest } from "../../../Lib/auth.js";
import { recordEvent } from "../../../Lib/analytics.js";
import { checkRateLimit, getClientKey } from "../../../Lib/rateLimit.js";
import {
  searchReviews,
  formatContext,
  buildStructuredResponse,
} from "../../../Lib/retrieval/search.js";
import {
  answerDatasetQuery,
  formatDatasetSummaryForPrompt,
  buildDatasetSummary,
} from "../../../Lib/datasetFacts.js";
import { loadReviews } from "../../../Lib/retrieval/loadReviews.js";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are ProfessorMatch AI, an expert academic advisor for students choosing courses and professors.
Your job is to help students understand how a professor fits their goals, learning style, and course needs.
When answering:
- If the user asks whether a specific professor exists, answer directly with a clear yes/no and cite the matching evidence.
- If the user asks for a recommendation, recommend the most relevant professors using evidence from available review context.
- Mention strengths, teaching style, workload, and likely fit.
- Keep the tone supportive, clear, and practical.
- Prefer concise answers with actionable guidance.
- For exact-name questions, use a short structured explanation: match, subject, rating, and a one-sentence takeaway.
- Use markdown for lists and emphasis when helpful.
- When **dataset metadata** is provided, treat it as authoritative for counts, lists, ratings, and name-collision questions. Never infer totals from retrieved professor snippets alone.
`;

export async function POST(req) {
  try {
    const data = await req.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const lastMessage = data[data.length - 1];
    const userQuery = lastMessage?.content?.trim() || "";

    if (!userQuery) {
      return NextResponse.json(
        { message: "Please provide a question first." },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(`chat:${getClientKey(req)}`, {
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { message: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const user = getUserFromRequest(req);
    recordEvent(user?.userId ?? null, "query", userQuery);

    const history = data.slice(0, -1);
    const datasetAnswer = await answerDatasetQuery(userQuery);

    if (datasetAnswer) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const chunks = datasetAnswer.match(/.{1,140}/g) || [datasetAnswer];

          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
            await new Promise((resolve) => setTimeout(resolve, 12));
          }

          controller.close();
        },
      });

      return new NextResponse(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const reviews = await loadReviews();
    const datasetSummary = formatDatasetSummaryForPrompt(buildDatasetSummary(reviews));
    const { matches: rankedReviews } = await searchReviews(userQuery, { limit: 5 });
    const contextText = formatContext(rankedReviews);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

          if (!hasApiKey) {
            const fallback = await buildStructuredResponse(userQuery, rankedReviews);
            const chunks = fallback.match(/.{1,140}/g) || [fallback];

            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(chunk));
              await new Promise((resolve) => setTimeout(resolve, 12));
            }
            return;
          }

          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...history,
              {
                role: "user",
                content: `${userQuery}\n\nDataset metadata (authoritative):\n${datasetSummary}\n\nRetrieved professor context:\n${contextText}`,
              },
            ],
          });

          for await (const chunk of completion) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          const fallback =
            error instanceof Error
              ? `I hit a temporary issue while preparing your answer. ${error.message}`
              : "I hit a temporary issue while preparing your answer.";
          controller.enqueue(encoder.encode(fallback));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { message: "Something went wrong while processing your request." },
      { status: 500 }
    );
  }
}
