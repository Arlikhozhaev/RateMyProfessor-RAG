import {
  extractNameQuery,
  findExactNameMatches,
} from "./format.js";
import { loadReviews } from "./loadReviews.js";

export async function buildStructuredResponse(query, rankedReviews) {
  if (!rankedReviews.length) {
    return "I couldn't find enough professor information right now. Try asking about a specific subject, course difficulty, or teaching style.";
  }

  const explicitName = extractNameQuery(query);
  if (explicitName) {
    const allReviews = await loadReviews();
    const matches = findExactNameMatches(allReviews, explicitName);
    if (matches.length > 0) {
      const match = matches[0];
      return [
        `Yes — there is a professor matching "${explicitName}" in the dataset.`,
        "",
        `- **Professor:** ${match.professor}`,
        `- **Subject:** ${match.subject}`,
        `- **Rating:** ${match.stars}/5`,
        `- **Evidence:** ${match.review}`,
      ].join("\n");
    }

    return `I couldn't find a professor matching "${explicitName}" in the current dataset, but I can help search by subject or teaching style instead.`;
  }

  const bullets = rankedReviews
    .slice(0, 3)
    .map(
      (review) =>
        `- **${review.professor}** (${review.subject}) — ${review.stars}/5 stars: ${review.review}`
    )
    .join("\n");

  return `Based on your question about "${query}", here are the strongest matches:\n\n${bullets}\n\nIf you want, I can narrow this down further by difficulty, workload, or class format.`;
}
