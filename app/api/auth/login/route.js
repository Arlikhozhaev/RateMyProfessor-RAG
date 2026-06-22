import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import db from "../../../../lib/db.js";
import { createSessionToken, sessionCookieOptions } from "../../../../lib/auth.js";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = db
      .prepare(
        "SELECT id, email, name, password_hash FROM users WHERE email = ?"
      )
      .get(email.trim().toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const safeUser = { id: user.id, email: user.email, name: user.name };
    const token = createSessionToken(safeUser);
    const response = NextResponse.json({ user: safeUser });

    response.cookies.set("professor_session", token, {
      ...sessionCookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Unable to sign you in right now." },
      { status: 500 }
    );
  }
}
