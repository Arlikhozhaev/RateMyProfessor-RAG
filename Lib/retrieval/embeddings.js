function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

export { cosineSimilarity };

export async function embedTexts(openai, texts) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

export async function embedQuery(openai, query) {
  const [embedding] = await embedTexts(openai, [query]);
  return embedding;
}

export function rankByEmbedding(reviews, queryEmbedding, reviewEmbeddings, limit) {
  return reviews
    .map((review, index) => ({
      ...review,
      rawScore: cosineSimilarity(queryEmbedding, reviewEmbeddings[index]),
    }))
    .sort((a, b) => b.rawScore - a.rawScore || b.stars - a.stars)
    .slice(0, limit);
}
