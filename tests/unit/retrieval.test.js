import { describe, expect, it } from "vitest";
import { searchKeyword } from "../../lib/retrieval/keyword.js";
import { toMatchScore, annotateMatches } from "../../lib/retrieval/scoring.js";
import { extractNameQuery, normalizeText } from "../../lib/retrieval/format.js";

const sampleReviews = [
  {
    professor: "Dr. Emily Carter",
    subject: "Introduction to Computer Science",
    stars: 5,
    review: "Clear explanations and engaging lectures.",
  },
  {
    professor: "David Nguyen",
    subject: "Software Engineering",
    stars: 4,
    review: "Hands-on projects and practical software engineering skills.",
  },
  {
    professor: "Prof. Robert Chen",
    subject: "Calculus II",
    stars: 1,
    review: "Difficult to follow and little support outside class.",
  },
];

describe("searchKeyword", () => {
  it("ranks software engineering queries toward the SWE professor", () => {
    const results = searchKeyword(sampleReviews, "software engineering", 3);

    expect(results[0].professor).toBe("David Nguyen");
    expect(results[0].matchMethod).toBe("keyword");
    expect(typeof results[0].matchScore).toBe("number");
  });

  it("returns an empty list for blank queries", () => {
    const results = searchKeyword(sampleReviews, "   ", 3);
    expect(results).toEqual([]);
  });
});

describe("scoring", () => {
  it("normalizes keyword scores to 0-100", () => {
    expect(toMatchScore(10, "keyword")).toBe(50);
    expect(toMatchScore(20, "keyword")).toBe(100);
  });

  it("normalizes cosine scores to 0-100", () => {
    expect(toMatchScore(0.82, "semantic")).toBe(82);
  });

  it("annotates matches with method metadata", () => {
    const annotated = annotateMatches([{ professor: "Test", rawScore: 0.9 }], "semantic");
    expect(annotated[0].matchScore).toBe(90);
    expect(annotated[0].matchMethod).toBe("semantic");
  });
});

describe("format helpers", () => {
  it("extracts professor names from natural-language queries", () => {
    expect(extractNameQuery("Is there a professor named Emily Carter?")).toBe("Emily Carter");
  });

  it("normalizes punctuation in names", () => {
    expect(normalizeText("Dr. Emily Carter")).toBe("dr emily carter");
  });
});
