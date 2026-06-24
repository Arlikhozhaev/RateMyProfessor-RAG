import db from "./db.js";

export function recordEvent(userId, eventType, eventValue) {
  db.prepare(
    "INSERT INTO analytics_events (user_id, event_type, event_value) VALUES (?, ?, ?)"
  ).run(userId ?? null, eventType, eventValue ?? null);
}

export function getAnalyticsSummary(userId) {
  const totalEvents = db
    .prepare("SELECT COUNT(*) AS count FROM analytics_events")
    .get().count;

  if (!userId) {
    return { totalEvents, userEvents: 0, queryEvents: 0 };
  }

  const userEvents = db
    .prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE user_id = ?")
    .get(userId).count;

  const queryEvents = db
    .prepare(
      "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'query' AND user_id = ?"
    )
    .get(userId).count;

  return { totalEvents, userEvents, queryEvents };
}
