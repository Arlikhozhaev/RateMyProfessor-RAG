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
- **AI chat assistant** with markdown responses and streaming
- **User authentication** with session cookies and secure password hashing
- **Analytics tracking** for queries and engagement events
- **SQLite-backed persistence** for user and recommendation data

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
- `app/api/` — chat, auth, analytics, and recommendation endpoints
- `Lib/` — database, auth, analytics, and retrieval modules
- `Lib/retrieval/` — hybrid RAG search (Pinecone, semantic, keyword)
- `components/` — UI components (chat, auth, recommendations, layout)
- `hooks/` — client hooks (`useChat`, `useAuth`, `useChatAutoScroll`)
- `theme/` — MUI design tokens
- `Scripts/` — database initialization utilities
- `data/` — local database storage
- `reviews.json` — professor review dataset

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

## Environment Notes

For production deployment, configure the following environment variables as needed:
- `AUTH_SECRET` for JWT signing
- `DB_PATH` for database location (optional)
- `OPENAI_API_KEY` for GPT streaming and semantic retrieval (optional)
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_NAMESPACE` for vector search (optional)

## Deployment

This project is ready to be deployed to any platform that supports Next.js applications, such as Vercel, Azure App Service, or similar hosting providers.

## License

This project is for educational and demonstration purposes.

