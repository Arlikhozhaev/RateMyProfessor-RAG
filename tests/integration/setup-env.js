import path from "path";
import os from "os";
import fs from "fs";

const testDbPath = path.join(os.tmpdir(), "professormatch-integration.db");

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

process.env.DB_PATH = testDbPath;
process.env.AUTH_SECRET = "integration-test-secret";
delete process.env.OPENAI_API_KEY;
delete process.env.PINECONE_API_KEY;
