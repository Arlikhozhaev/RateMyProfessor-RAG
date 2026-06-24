import { annotateMatches } from "./scoring.js";

export function searchKeyword(reviews, query, limit = 6) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  const ranked = reviews
    .map((review) => {
      const text = `${review.professor} ${review.subject} ${review.review}`.toLowerCase();
      let score = 0;

      if (text.includes(normalizedQuery)) score += 6;
      terms.forEach((term) => {
        if (text.includes(term)) score += 1;
      });
      score += review.stars * 0.5;

      return { ...review, rawScore: score };
    })
    .sort((a, b) => b.rawScore - a.rawScore || b.stars - a.stars)
    .slice(0, limit);

  return annotateMatches(ranked, "keyword");
}
