import { NextResponse } from "next/server";
import db from "../../../Lib/db.js";
import { verifySessionToken } from "../../../Lib/auth.js";

export const runtime = "nodejs";

function getUserFromRequest(req) {
  const token = req.cookies.get("professor_session")?.value;
  if (!token) return null;

  try {
    const decoded = verifySessionToken(token);
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const user = getUserFromRequest(req);

    db.prepare(
      "INSERT INTO analytics_events (user_id, event_type, event_value) VALUES (?, ?, ?)"
    ).run(
      user ? user.userId : null,
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

    if (!user) {
      return NextResponse.json(
        {
          totalEvents: db.prepare("SELECT COUNT(*) AS count FROM analytics_events").get().count,
          userEvents: 0,
        },
        { status: 200 }
      );
    }

    const userEvents = db
      .prepare(
        "SELECT COUNT(*) AS count FROM analytics_events WHERE user_id = ?"
      )
      .get(user.userId).count;

    const queryEvents = db
      .prepare(
        "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'query' AND user_id = ?"
      )
      .get(user.userId).count;

    return NextResponse.json(
      {
        totalEvents: db.prepare("SELECT COUNT(*) AS count FROM analytics_events").get().count,
        userEvents,
        queryEvents,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ totalEvents: 0, userEvents: 0, queryEvents: 0 }, { status: 200 });
  }
}
