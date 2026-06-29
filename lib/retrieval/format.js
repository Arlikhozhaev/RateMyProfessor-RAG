export function formatContext(reviews) {
  return reviews
    .map(
      (review) =>
        `Professor: ${review.professor}\nSubject: ${review.subject}\nRating: ${review.stars}/5\nReview: ${review.review}`
    )
    .join("\n\n");
}

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractNameQuery(query) {
  const patterns = [
    /\b(?:professor|teacher|instructor)\b[^a-z0-9]{0,20}(?:named|called)\s+([a-z][a-z .'-]{1,40})/i,
    /\b(?:is|are|do|does|did)\s+there\s+(?:a|an)?\s*(?:professor|teacher|instructor)?\s*(?:named|called)?\s+([a-z][a-z .'-]{1,40})/i,
    /\b(?:name|named|called)\s+([a-z][a-z .'-]{1,40})/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

export function findExactNameMatches(reviews, nameQuery) {
  const normalizedName = normalizeText(nameQuery);

  return reviews.filter((review) => {
    const normalizedProfessor = normalizeText(review.professor);
    return (
      normalizedProfessor === normalizedName ||
      normalizedProfessor.includes(normalizedName) ||
      normalizedName.includes(normalizedProfessor)
    );
  });
}
