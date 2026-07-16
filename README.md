# OpsPilot

OpsPilot is a full-stack AI workspace for building and testing retrieval-augmented generation workflows. It lets a user register, log in, create workspaces, ingest documents, ask grounded questions, inspect cited evidence, record feedback, and review backend logs.

The goal is to demonstrate a production-shaped RAG system, not a fake chatbot UI. The app now has a protected dashboard, real backend state, document parsing for text/Markdown/PDF/DOCX, local deterministic retrieval, optional OpenAI embedding support, and Docker/Postgres/pgvector infrastructure.

## What This System Is For

OpsPilot is designed to show full-stack AI engineering skills:

- JWT-based user authentication
- user-owned workspaces
- document ingestion
- TXT, Markdown, PDF, and DOCX parsing
- chunking
- embeddings
- hybrid semantic and keyword retrieval
- reranking
- citation-grounded answers
- highlighted source evidence
- conversation memory
- answer feedback
- admin logs
- local JSON persistence
- pgvector database schema and Docker setup
- React frontend connected to a real backend API

It is useful as a portfolio project for roles involving RAG systems, AI agents, full-stack AI apps, LLM product engineering, and backend API design.

## Current Features

| Area | Status |
| --- | --- |
| React frontend | Working |
| Express backend API | Working |
| Login/register page | Working |
| JWT auth | Working |
| User-owned workspaces | Working |
| TXT / Markdown ingestion | Working |
| PDF / DOCX parsing | Working |
| Chunking pipeline | Working |
| Local deterministic embeddings | Working |
| OpenAI embedding provider | Configurable with `OPENAI_API_KEY` |
| Anthropic embeddings | Not native; documented placeholder |
| Hybrid semantic + keyword retrieval | Working |
| Citation-grounded answers | Working |
| Highlighted evidence viewer | Working |
| Conversation memory | Working |
| Feedback: correct / wrong / missing context | Working |
| Admin logs | Working |
| Local JSON persistence | Working |
| PostgreSQL / pgvector schema | Added |
| Docker / Docker Compose | Added |
| Full Postgres persistence adapter | Still pending |
| Production cloud deployment | Still pending |

## Tech Stack

- React
- Vite
- Express
- Node.js
- JWT
- bcrypt
- Multer
- pdf-parse
- mammoth
- Vitest
- Supertest
- Local JSON storage
- PostgreSQL / pgvector schema
- Docker Compose

## Project Structure

```text
.
|-- public/
|   `-- favicon.svg
|-- server/
|   |-- app.js
|   |-- auth.js
|   |-- documentParser.js
|   |-- embeddingProvider.js
|   |-- index.js
|   |-- rag.js
|   |-- store.js
|   |-- db/
|   |   |-- postgres.js
|   |   `-- schema.sql
|   `-- *.test.js
|-- src/
|   |-- main.jsx
|   `-- styles.css
|-- .env.example
|-- Dockerfile
|-- docker-compose.yml
|-- index.html
|-- package.json
`-- README.md
```

## Environment

Copy `.env.example` and set values for your machine.

The most important production variable is:

```text
OPSPILOT_JWT_SECRET=replace-with-a-long-random-secret
```

This key signs login tokens. In production, do not use the development fallback. Use a long random secret and keep it private.

Optional local persistence:

```text
OPSPILOT_DATA_FILE=.data/workspaces.json
```

Optional OpenAI embeddings:

```text
OPSPILOT_EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## How To Run Locally

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run server
```

The backend runs at:

```text
http://127.0.0.1:8787
```

Start the frontend in another terminal:

```bash
npm run dev -- --port 5173
```

Open the app:

```text
http://127.0.0.1:5173
```

## Run With Local Persistence

PowerShell example:

```powershell
$env:OPSPILOT_JWT_SECRET="replace-with-a-long-random-secret"
$env:OPSPILOT_DATA_FILE="C:\Users\user\OneDrive\Documents\system\.data\workspaces.json"
npm run server
```

The `.data/` folder is ignored by Git.

## Run Postgres / pgvector

Start the database and API container:

```bash
docker compose up --build
```

This starts:

- Postgres with pgvector on port `5432`
- OpsPilot API on port `8787`

The schema is in `server/db/schema.sql`.

Note: the pgvector schema and Docker infrastructure are present, but the main app still uses local JSON persistence until the full Postgres repository adapter is completed.

## How To Use The App

1. Register or log in on the first screen.
2. Create a workspace.
3. Paste text or upload a `.txt`, `.md`, `.markdown`, `.pdf`, or `.docx` file.
4. Click `Ingest document`.
5. Ask a question about the ingested content.
6. Review the grounded answer and citations.
7. Use the feedback buttons to mark the answer as correct, wrong, or missing context.
8. Check admin logs for query events, latency, model name, and cost placeholder.

## API Endpoints

```text
GET  /api/health
POST /api/auth/register
POST /api/auth/login
GET  /api/workspaces
POST /api/workspaces
GET  /api/workspaces/:workspaceId
GET  /api/workspaces/:workspaceId/documents
POST /api/workspaces/:workspaceId/documents
GET  /api/workspaces/:workspaceId/conversations
POST /api/workspaces/:workspaceId/query
POST /api/workspaces/:workspaceId/feedback
GET  /api/workspaces/:workspaceId/logs
```

Workspace endpoints require:

```text
Authorization: Bearer <jwt>
```

## Run Tests

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

## Important Notes

Anthropic does not provide the same native public embeddings flow used here for OpenAI embeddings, so the Anthropic provider is intentionally explicit as a placeholder rather than fake support.

The current production-ready next step is replacing local JSON persistence with the Postgres repository adapter using the schema already included.
