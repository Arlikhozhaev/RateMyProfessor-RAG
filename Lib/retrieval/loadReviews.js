import fs from "fs/promises";
import path from "path";

let cachedReviews = null;

export async function loadReviews() {
  if (cachedReviews) return cachedReviews;

  const filePath = path.join(process.cwd(), "reviews.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  cachedReviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];

  return cachedReviews;
}

export function reviewDocument(review) {
  return `${review.professor}. ${review.subject}. ${review.review}`;
}
