import { NextResponse } from "next/server";
import db from "../../../../lib/db.js";
import {
  getSessionTokenFromRequest,
  sessionUserFromToken,
  verifySessionToken,
} from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function GET(req) {
  const token = getSessionTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const decoded = verifySessionToken(token);
    const user = db
      .prepare("SELECT id, email, name FROM users WHERE id = ?")
      .get(decoded.userId);

    if (user) {
      return NextResponse.json({ user }, { status: 200 });
    }

    // Cookie is valid but the SQLite row may be on another serverless instance.
    return NextResponse.json({ user: sessionUserFromToken(decoded) }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
