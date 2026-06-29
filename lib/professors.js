import { normalizeText } from "./retrieval/format.js";

export function professorToSlug(name) {
  return normalizeText(name).replace(/\s+/g, "-");
}

export function findProfessorBySlug(slug, reviews) {
  const normalizedSlug = String(slug || "").toLowerCase();
  return reviews.find((review) => professorToSlug(review.professor) === normalizedSlug) ?? null;
}

export function getRelatedProfessors(professor, reviews, limit = 3) {
  const subjectRoot = professor.subject.split(/\s+/)[0].toLowerCase();

  return reviews
    .filter(
      (review) =>
        review.professor !== professor.professor &&
        (review.subject.toLowerCase().includes(subjectRoot) ||
          review.subject.split(/\s+/)[0].toLowerCase() === subjectRoot)
    )
    .sort((a, b) => b.stars - a.stars)
    .slice(0, limit);
}
