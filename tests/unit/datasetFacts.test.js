import { describe, expect, it } from "vitest";
import {
  answerDatasetQueryFromReviews,
  buildDatasetSummary,
  detectDatasetQueryIntent,
  extractSubjectFilter,
  filterReviewsBySubject,
} from "../../lib/datasetFacts.js";

const sampleReviews = [
  { professor: "Dr. Emily Carter", subject: "CS Intro", stars: 5, review: "Great." },
  { professor: "Dr. Emily Watson", subject: "Statistics", stars: 4, review: "Solid." },
  { professor: "Liam Carter", subject: "Physics", stars: 4, review: "Good." },
  { professor: "David Nguyen", subject: "Software Engineering", stars: 4, review: "Projects." },
  { professor: "Prof. James Lee", subject: "Software Engineering", stars: 3, review: "Tough." },
  { professor: "Dr. Alan Thompson", subject: "AI", stars: 5, review: "Excellent." },
];

describe("detectDatasetQueryIntent", () => {
  it("detects total count questions", () => {
    expect(
      detectDatasetQueryIntent("How many professors in total in the database there are?")
    ).toBe("count");
  });

  it("detects subject-filtered count questions", () => {
    expect(
      detectDatasetQueryIntent("How many professors have a class of software engineering?")
    ).toBe("count_by_subject");
  });

  it("detects duplicate subject questions", () => {
    expect(
      detectDatasetQueryIntent("Are there professors who teach the same subject/class?")
    ).toBe("duplicate_subjects");
  });

  it("detects duplicate name questions", () => {
    expect(detectDatasetQueryIntent("Are there any professors with identical names?")).toBe(
      "duplicates"
    );
    expect(detectDatasetQueryIntent("Are there any professors with similar names?")).toBe(
      "duplicates"
    );
  });

  it("detects shared last name questions", () => {
    expect(
      detectDatasetQueryIntent("Are there any professors with the same last name?")
    ).toBe("shared_last_names");
  });

  it("detects best-by-subject questions", () => {
    expect(detectDatasetQueryIntent("Best professors for software engineering")).toBe(
      "best_by_subject"
    );
  });
});

describe("subject filtering", () => {
  it("extracts a subject phrase from class-of questions", () => {
    expect(extractSubjectFilter("How many professors have a class of software engineering?")).toBe(
      "software engineering"
    );
  });

  it("filters reviews by subject phrase", () => {
    const matches = filterReviewsBySubject(sampleReviews, "software engineering");
    expect(matches).toHaveLength(2);
    expect(matches.map((review) => review.professor)).toEqual([
      "David Nguyen",
      "Prof. James Lee",
    ]);
  });
});

describe("answerDatasetQueryFromReviews", () => {
  it("returns the exact professor count", () => {
    const answer = answerDatasetQueryFromReviews(
      "How many professors are in the dataset?",
      sampleReviews
    );

    expect(answer).toContain("**6 professors**");
  });

  it("returns the exact count for a specific subject", () => {
    const answer = answerDatasetQueryFromReviews(
      "How many professors have a class of software engineering?",
      sampleReviews
    );

    expect(answer).toContain("**2 professors**");
    expect(answer).toContain("David Nguyen");
    expect(answer).toContain("Prof. James Lee");
    expect(answer).not.toContain("**6 professors**");
  });

  it("lists duplicate subjects accurately", () => {
    const answer = answerDatasetQueryFromReviews(
      "Are there professors who teach the same subject/class?",
      sampleReviews
    );

    expect(answer).toContain("**Yes**");
    expect(answer).toContain("Software Engineering");
    expect(answer).toContain("David Nguyen");
    expect(answer).toContain("Prof. James Lee");
  });

  it("lists shared last names accurately", () => {
    const answer = answerDatasetQueryFromReviews(
      "Are there any professors with the same last name?",
      sampleReviews
    );

    expect(answer).toContain("**Yes**");
    expect(answer).toContain("Carter");
    expect(answer).toContain("Dr. Emily Carter");
    expect(answer).toContain("Liam Carter");
    expect(answer).not.toContain("Dr. Henry Diaz");
  });

  it("ranks best professors for a subject deterministically", () => {
    const answer = answerDatasetQueryFromReviews(
      "Best professors for software engineering",
      sampleReviews
    );

    expect(answer).toContain("David Nguyen");
    expect(answer).toContain("Prof. James Lee");
    expect(answer.indexOf("David Nguyen")).toBeLessThan(answer.indexOf("Prof. James Lee"));
  });

  it("explains there are no exact duplicate names but notes similar names", () => {
    const answer = answerDatasetQueryFromReviews(
      "Are there any professors with identical names?",
      sampleReviews
    );

    expect(answer).toContain("unique full name");
    expect(answer).toContain("Emily");
  });

  it("returns null for normal recommendation questions", () => {
    expect(
      answerDatasetQueryFromReviews("Who teaches intro computer science well?", sampleReviews)
    ).toBeNull();
  });
});

describe("buildDatasetSummary", () => {
  it("computes aggregate stats from the full dataset", () => {
    const summary = buildDatasetSummary(sampleReviews);

    expect(summary.totalProfessors).toBe(6);
    expect(summary.exactDuplicateNames).toHaveLength(0);
    expect(summary.duplicateSubjects).toHaveLength(1);
    expect(summary.duplicateSubjects[0].displaySubject).toBe("Software Engineering");
  });
});
