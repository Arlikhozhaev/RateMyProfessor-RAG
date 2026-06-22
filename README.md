# RateMyProfessor-RAG

A modern AI-powered professor recommendation platform built with Next.js, SQLite, and retrieval-based chat flows. The app helps students explore professors using review data, personalized search results, and a conversational assistant.

## Overview

RateMyProfessor-RAG combines:
- a polished student-facing interface for discovering professors,
- a retrieval-style recommendation engine grounded in local review data,
- chat-based guidance for course and professor discovery,
- lightweight user authentication and analytics tracking.

## Core Features

- **Professor search and recommendations** using local review data and ranking logic
- **AI chat assistant** for natural-language questions about professors and courses
- **User authentication** with session cookies and secure password hashing
- **Analytics tracking** for queries and engagement events
- **SQLite-backed persistence** for user and recommendation data

## Tech Stack

- **Frontend:** Next.js, React, Material UI
- **Backend/API:** Next.js Route Handlers
- **Database:** SQLite via `better-sqlite3`
- **Auth:** JWT + cookie sessions
- **Security:** bcrypt password hashing
- **Data source:** `reviews.json`

## Project Structure

- `app/` — application pages and API routes
- `app/api/` — chat, auth, analytics, and recommendation endpoints
- `lib/` — shared database and authentication helpers
- `scripts/` — database initialization utilities
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
- `OPENAI_API_KEY` for enhanced AI responses (optional)

## Deployment

This project is ready to be deployed to any platform that supports Next.js applications, such as Vercel, Azure App Service, or similar hosting providers.

## License

This project is for educational and demonstration purposes.

