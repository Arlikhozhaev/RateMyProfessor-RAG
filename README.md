# RateMyProfessor-RAG

A modern AI-powered professor recommendation platform built with Next.js, SQLite, and retrieval-based chat flows. The app helps students explore professors using review data, personalized search results, and a conversational assistant.

## Overview

RateMyProfessor-RAG combines:
- a polished student-facing interface for discovering professors,
- a retrieval-style recommendation engine grounded in local review data,
- chat-based guidance for course and professor discovery,
- lightweight user authentication and analytics tracking.

## Core Features

- **Hybrid RAG retrieval** — Pinecone vector search → OpenAI semantic embeddings → keyword fallback
- **Professor search and recommendations** with match scores grounded in review data
- **Professor profile pages** at `/professor/[slug]` with related recommendations
- **AI chat assistant** with markdown responses and streaming
- **User authentication** with session cookies and secure password hashing
- **Analytics tracking** for queries and engagement events
- **SQLite-backed persistence** for user and recommendation data
- **Automated quality gates** — unit tests, Playwright E2E, GitHub Actions CI

## Architecture

```
User query
    ↓
Lib/retrieval/search.js  (unified entry point)
    ├── Pinecone (if PINECONE_API_KEY + OPENAI_API_KEY)
    ├── Semantic embeddings (if OPENAI_API_KEY)
    └── Keyword ranking (always available fallback)
    ↓
/api/chat + /api/recommendations
```

## Project Structure

- `app/` — application pages and API routes
- `app/professor/[slug]/` — static professor profile pages
- `app/api/` — chat, auth, analytics, and recommendation endpoints
- `Lib/` — database, auth, analytics, retrieval, and professor helpers
- `Lib/retrieval/` — hybrid RAG search (Pinecone, semantic, keyword)
- `components/` — UI components (chat, auth, recommendations, layout)
- `hooks/` — client hooks (`useChat`, `useAuth`, `useChatAutoScroll`)
- `tests/` — Vitest unit tests and Playwright E2E specs
- `theme/` — MUI design tokens
- `Scripts/` — database initialization utilities
- `data/` — local database storage
- `reviews.json` — professor review dataset (41 curated records)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Initialize the database

```bash
npm run db:init
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at:
- http://localhost:3000

## Testing

```bash
npm run test:unit      # Vitest — retrieval + professor slug logic
npm run test:e2e:setup # First time only — downloads Playwright Chromium
npm run build          # Required before test:e2e
npm run test:e2e       # Starts app on port 3001 (avoids conflicts with npm run dev on 3000)
npm run lint
```

CI runs automatically via GitHub Actions on push and pull requests.

## Environment Notes

For production deployment, configure the following environment variables as needed:
- `AUTH_SECRET` for JWT signing
- `DB_PATH` for database location (optional)
- `OPENAI_API_KEY` for GPT streaming and semantic retrieval (optional)
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_NAMESPACE` for vector search (optional)

## Deployment

### Vercel (recommended)

1. Import the GitHub repository in Vercel
2. Set environment variables from `.env.example`
3. Deploy — Next.js builds automatically

Notes for production:
- Set `AUTH_SECRET` to a long random string
- SQLite via `better-sqlite3` works on Node server runtimes; for pure serverless you may later swap to a hosted DB
- Re-run `load.ipynb` after changing `reviews.json` if using Pinecone

### Other hosts

Works on any Node.js host that supports Next.js 14 (`npm run build` + `npm run start`).

## License

This project is for educational and demonstration purposes.

