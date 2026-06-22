import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

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
`;

async function loadReviews() {
  const filePath = path.join(process.cwd(), "reviews.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.reviews) ? parsed.reviews : [];
}

function rankReviews(reviews, query) {
  const normalizedQuery = query.toLowerCase();
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return reviews
    .map((review) => {
      const text = `${review.professor} ${review.subject} ${review.review}`.toLowerCase();
      let score = 0;

      if (text.includes(normalizedQuery)) score += 6;
      terms.forEach((term) => {
        if (text.includes(term)) score += 1;
      });

      score += review.stars;
      return { ...review, score };
    })
    .sort((a, b) => b.score - a.score || b.stars - a.stars)
    .slice(0, 5);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatContext(reviews) {
  return reviews
    .map(
      (review) =>
        `Professor: ${review.professor}\nSubject: ${review.subject}\nRating: ${review.stars}/5\nReview: ${review.review}`
    )
    .join("\n\n");
}

function extractNameQuery(query) {
  const patterns = [
    /\b(?:professor|teacher|instructor)\b[^a-z0-9]{0,20}(?:named|called)\s+([a-z][a-z .'-]{1,40})/i,
    /\b(?:is|are|do|does|did)\s+there\s+(?:a|an)?\s*(?:professor|teacher|instructor)?\s*(?:named|called)?\s+([a-z][a-z .'-]{1,40})/i,
    /\b(?:name|named|called)\s+([a-z][a-z .'-]{1,40})/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function findExactNameMatches(reviews, nameQuery) {
  const normalizedName = normalizeText(nameQuery);

  return reviews.filter((review) => {
    const normalizedProfessor = normalizeText(review.professor);
    return (
      normalizedProfessor === normalizedName ||
      normalizedProfessor.includes(normalizedName) ||
      normalizedName.includes(normalizedProfessor)
    );
  });
}

function buildStructuredResponse(query, reviews) {
  if (!reviews.length) {
    return "I couldn't find enough professor information right now. Try asking about a specific subject, course difficulty, or teaching style.";
  }

  const explicitName = extractNameQuery(query);
  if (explicitName) {
    const matches = findExactNameMatches(reviews, explicitName);
    if (matches.length > 0) {
      const match = matches[0];
      return [
        `Yes — there is a professor matching "${explicitName}" in the dataset.`,
        ``,
        `- Professor: ${match.professor}`,
        `- Subject: ${match.subject}`,
        `- Rating: ${match.stars}/5`,
        `- Evidence: ${match.review}`,
      ].join("\n");
    }

    return `I couldn't find a professor matching "${explicitName}" in the current dataset, but I can help search by subject or teaching style instead.`;
  }

  const bullets = reviews
    .slice(0, 3)
    .map(
      (review) =>
        `• ${review.professor} (${review.subject}) — ${review.stars}/5 stars: ${review.review}`
    )
    .join("\n");

  return `Based on your question about "${query}", here are the strongest matches:\n\n${bullets}\n\nIf you want, I can narrow this down further by difficulty, workload, or class format.`;
}

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

    const history = data.slice(0, -1);
    const reviews = await loadReviews();
    const rankedReviews = rankReviews(reviews, userQuery);
    const contextText = formatContext(rankedReviews);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

          if (!hasApiKey) {
            const fallback = buildStructuredResponse(userQuery, reviews);
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
                content: `${userQuery}\n\nProfessor context:\n${contextText}`,
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
