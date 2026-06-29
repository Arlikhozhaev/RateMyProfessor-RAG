import { NextResponse } from "next/server";
import db from "../../../lib/db.js";
import { getUserFromRequest } from "../../../lib/auth.js";
import { getAnalyticsSummary, recordEvent } from "../../../lib/analytics.js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const payload = await req.json();
    const user = getUserFromRequest(req);

    recordEvent(
      user?.userId ?? null,
      payload.eventType || "custom_event",
      payload.eventValue || JSON.stringify(payload)
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    return NextResponse.json(getAnalyticsSummary(user?.userId ?? null));
  } catch (error) {
    return NextResponse.json(
      { totalEvents: 0, userEvents: 0, queryEvents: 0 },
      { status: 200 }
    );
  }
}
