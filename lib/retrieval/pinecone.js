import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { PINECONE_INDEX, PINECONE_NAMESPACE } from "./constants.js";
import { annotateMatches } from "./scoring.js";
import { embedQuery } from "./embeddings.js";

export async function searchPinecone(query, limit = 6) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);

  const queryEmbedding = await embedQuery(openai, query);
  const response = await index.namespace(PINECONE_NAMESPACE).query({
    vector: queryEmbedding,
    topK: limit,
    includeMetadata: true,
  });

  const matches = (response.matches || [])
    .filter((match) => match.metadata)
    .map((match) => ({
      professor: match.id,
      subject: match.metadata.subject,
      stars: Number(match.metadata.stars) || 5,
      review: match.metadata.review,
      rawScore: match.score ?? 0,
    }));

  return annotateMatches(matches, "pinecone");
}
