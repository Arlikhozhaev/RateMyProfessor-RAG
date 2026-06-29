/**
 * Normalizes raw retrieval scores to a 0–100 match percentage for UI display.
 */
export function toMatchScore(rawScore, method) {
  if (method === "keyword") {
    const capped = Math.min(rawScore, 20);
    return Math.round((capped / 20) * 100);
  }

  // Cosine similarity from OpenAI / Pinecone is typically 0–1
  return Math.round(Math.max(0, Math.min(1, rawScore)) * 100);
}

export function annotateMatches(matches, method) {
  return matches.map((match) => ({
    ...match,
    matchMethod: method,
    matchScore: toMatchScore(match.rawScore ?? match.score ?? 0, method),
  }));
}
