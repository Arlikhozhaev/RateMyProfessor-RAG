import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

function resolveDbPath() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  const candidatePaths = [
    process.env.TMPDIR,
    "/tmp",
    path.join(process.cwd(), "data"),
  ].filter(Boolean);

  const fallbackDir = candidatePaths.find((candidate) => {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      return true;
    } catch {
      return false;
    }
  });

  return fallbackDir
    ? path.join(fallbackDir, "app.db")
    : path.join(process.cwd(), "data", "app.db");
}

const dbPath = resolveDbPath();
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

try {
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
} catch (error) {
  console.error("Failed to initialize database:", error);
  db = new Database(":memory:");
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL,
  event_value TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  query TEXT NOT NULL,
  professor TEXT NOT NULL,
  subject TEXT,
  rating INTEGER,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`;

db.exec(schema);

export default db;
