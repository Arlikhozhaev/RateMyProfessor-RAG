import { loadReviews } from "./loadReviews.js";
import { searchKeyword } from "./keyword.js";
import { searchSemantic } from "./semantic.js";
import { searchPinecone } from "./pinecone.js";

export async function searchReviews(query, { limit = 6 } = {}) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return { matches: [], method: "none" };

  if (process.env.PINECONE_API_KEY && process.env.OPENAI_API_KEY) {
    try {
      const matches = await searchPinecone(normalizedQuery, limit);
      if (matches.length) return { matches, method: "pinecone" };
    } catch (error) {
      console.warn("Pinecone retrieval failed, falling back:", error.message);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const matches = await searchSemantic(normalizedQuery, limit);
      if (matches.length) return { matches, method: "semantic" };
    } catch (error) {
      console.warn("Semantic retrieval failed, falling back:", error.message);
    }
  }

  const reviews = await loadReviews();
  const matches = searchKeyword(reviews, normalizedQuery, limit);
  return { matches, method: "keyword" };
}

export { loadReviews } from "./loadReviews.js";
export { formatContext } from "./format.js";
export { buildStructuredResponse } from "./fallback.js";
