import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import db from "../../../Lib/db.js";
import { verifySessionToken } from "../../../Lib/auth.js";

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
    .slice(0, 6);
}

function getUserFromRequest(req) {
  const token = req.cookies.get("professor_session")?.value;
  if (!token) return null;

  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const query = (payload.query || "").trim();
    if (!query) {
      return NextResponse.json({ error: "A search query is required." }, { status: 400 });
    }

    const reviews = await loadReviews();
    const ranked = rankReviews(reviews, query);
    const user = getUserFromRequest(req);

    if (user) {
      db.prepare(
        "INSERT INTO analytics_events (user_id, event_type, event_value) VALUES (?, ?, ?)"
      ).run(user.userId, "query", query);

      for (const match of ranked) {
        db.prepare(
          "INSERT INTO recommendations (user_id, query, professor, subject, rating, reason) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(
          user.userId,
          query,
          match.professor,
          match.subject,
          match.stars,
          match.review
        );
      }
    }

    return NextResponse.json({ query, matches: ranked });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json({ error: "Unable to fetch recommendations." }, { status: 500 });
  }
}
