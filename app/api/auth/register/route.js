import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import db from "../../../../Lib/db.js";
import { createSessionToken, sessionCookieOptions } from "../../../../Lib/auth.js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
      )
      .run(email.trim().toLowerCase(), passwordHash, name?.trim() || "Student");

    const user = db
      .prepare("SELECT id, email, name FROM users WHERE id = ?")
      .get(result.lastInsertRowid);
    const token = createSessionToken(user);

    const response = NextResponse.json({ user });
    response.cookies.set("professor_session", token, {
      ...sessionCookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Unable to create your account right now." },
      { status: 500 }
    );
  }
}
