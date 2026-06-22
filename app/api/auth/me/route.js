import { NextResponse } from "next/server";
import db from "../../../../Lib/db.js";
import { verifySessionToken } from "../../../../Lib/auth.js";

export const runtime = "nodejs";

export async function GET(req) {
  const token = req.cookies.get("professor_session")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const decoded = verifySessionToken(token);
    const user = db
      .prepare("SELECT id, email, name FROM users WHERE id = ?")
      .get(decoded.userId);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
