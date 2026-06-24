import { NextResponse } from "next/server";
import db from "../../../Lib/db.js";
import { getUserFromRequest } from "../../../Lib/auth.js";
import { searchReviews } from "../../../Lib/retrieval/search.js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const payload = await req.json();
    const query = (payload.query || "").trim();
    if (!query) {
      return NextResponse.json({ error: "A search query is required." }, { status: 400 });
    }

    const { matches, method } = await searchReviews(query, { limit: 6 });
    const user = getUserFromRequest(req);

    if (user) {
      for (const match of matches) {
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

    return NextResponse.json({ query, matches, method });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json({ error: "Unable to fetch recommendations." }, { status: 500 });
  }
}
