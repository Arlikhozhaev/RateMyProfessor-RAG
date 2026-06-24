import OpenAI from "openai";
import { annotateMatches } from "./scoring.js";
import { embedQuery, embedTexts, rankByEmbedding } from "./embeddings.js";
import { loadReviews, reviewDocument } from "./loadReviews.js";

let cachedReviewEmbeddings = null;

async function getReviewEmbeddings(openai, reviews) {
  if (cachedReviewEmbeddings) return cachedReviewEmbeddings;

  const texts = reviews.map(reviewDocument);
  cachedReviewEmbeddings = await embedTexts(openai, texts);

  return cachedReviewEmbeddings;
}

export async function searchSemantic(query, limit = 6) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const reviews = await loadReviews();
  const [queryEmbedding, reviewEmbeddings] = await Promise.all([
    embedQuery(openai, query),
    getReviewEmbeddings(openai, reviews),
  ]);

  const ranked = rankByEmbedding(reviews, queryEmbedding, reviewEmbeddings, limit);
  return annotateMatches(ranked, "semantic");
}
