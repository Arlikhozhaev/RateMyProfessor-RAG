import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadReviews } from "../../lib/retrieval/loadReviews.js";
import { searchKeyword } from "../../lib/retrieval/keyword.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(
  readFileSync(path.join(__dirname, "golden-queries.json"), "utf8")
);

describe("RAG golden queries (keyword retrieval baseline)", () => {
  it("loads the full review dataset", async () => {
    const reviews = await loadReviews();
    expect(reviews.length).toBe(41);
  });

  for (const testCase of golden.cases) {
    it(`[${testCase.id}] "${testCase.query}"`, async () => {
      const reviews = await loadReviews();
      const results = searchKeyword(reviews, testCase.query, golden.topK);
      const returned = results.map((item) => item.professor);

      const matched = testCase.expectedProfessors.some((name) =>
        returned.includes(name)
      );

      expect(
        matched,
        `Expected one of [${testCase.expectedProfessors.join(", ")}] in top ${golden.topK}, got [${returned.join(", ")}]`
      ).toBe(true);
    });
  }
});
