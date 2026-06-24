export const quickPrompts = [
  "Best professors for software engineering",
  "Who is good at explaining difficult topics?",
  "Need a professor with a lighter workload",
  "Recommend professors for machine learning",
];

export const defaultRecommendations = [
  {
    professor: "Dr. Emily Carter",
    subject: "Intro to Computer Science",
    stars: 5,
    review: "Highly engaging and clear explanations.",
  },
  {
    professor: "Dr. Alan Thompson",
    subject: "Artificial Intelligence",
    stars: 5,
    review: "Excellent at making complex concepts approachable.",
  },
  {
    professor: "Dr. Rachel Adams",
    subject: "Machine Learning",
    stars: 5,
    review: "Great practical insight and supportive feedback.",
  },
];

export const WELCOME_MESSAGE =
  "Hi! I'm ProfessorMatch AI — I can help you find professors whose style, subject focus, and reviews match your goals.";

export const retrievalMethodLabels = {
  pinecone: "Vector search (Pinecone)",
  semantic: "Semantic search (OpenAI embeddings)",
  keyword: "Keyword matching",
};
