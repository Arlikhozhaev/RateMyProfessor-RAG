import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("professor_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
