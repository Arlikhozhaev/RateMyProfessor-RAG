import { describe, expect, it } from "vitest";
import {
  professorToSlug,
  findProfessorBySlug,
  getRelatedProfessors,
} from "../../Lib/professors.js";

const reviews = [
  {
    professor: "Dr. Emily Carter",
    subject: "Introduction to Computer Science",
    stars: 5,
    review: "Great intro course.",
  },
  {
    professor: "Dr. Emily Watson",
    subject: "Statistics for Engineers",
    stars: 4,
    review: "Strong stats course.",
  },
  {
    professor: "David Nguyen",
    subject: "Software Engineering",
    stars: 4,
    review: "Project-heavy class.",
  },
];

describe("professor slugs", () => {
  it("creates stable URL slugs", () => {
    expect(professorToSlug("Dr. Emily Carter")).toBe("dr-emily-carter");
  });

  it("finds professors by slug", () => {
    const match = findProfessorBySlug("dr-emily-carter", reviews);
    expect(match?.professor).toBe("Dr. Emily Carter");
  });

  it("returns null for unknown slugs", () => {
    expect(findProfessorBySlug("unknown-professor", reviews)).toBeNull();
  });

  it("finds related professors without name collisions", () => {
    const related = getRelatedProfessors(reviews[0], reviews, 2);
    expect(related.every((item) => item.professor !== "Dr. Emily Carter")).toBe(true);
  });
});
