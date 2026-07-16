# OpsPilot

OpsPilot is a full-stack AI workspace for building and testing retrieval-augmented generation workflows. It lets a user create a workspace, ingest real text or Markdown documents, ask grounded questions, inspect cited evidence, record feedback, and review backend logs for latency, model calls, and cost placeholders.

The goal is to demonstrate a production-shaped RAG system, not a fake chatbot UI. The current version uses a local deterministic embedding/retrieval engine so it can run without paid API keys, while keeping the backend structure ready for OpenAI, Anthropic, pgvector, Qdrant, or another vector store later.

## What This System Is For

OpsPilot is designed to show full-stack AI engineering skills:

- document ingestion
- chunking
- local embeddings
- hybrid semantic and keyword retrieval
- reranking
- citation-grounded answers
- highlighted source evidence
- conversation memory
- answer feedback
- admin logs
- persistent local workspace storage
- React frontend connected to a real backend API

It is useful as a portfolio project for roles involving RAG systems, AI agents, full-stack AI apps, LLM product engineering, and backend API design.

## Current Features

| Area | Status |
| --- | --- |
| React frontend | Working |
| Express backend API | Working |
| Workspaces | Working |
| TXT / Markdown ingestion | Working |
| Chunking pipeline | Working |
| Local deterministic embeddings | Working |
| Hybrid semantic + keyword retrieval | Working |
| Citation-grounded answers | Working |
| Highlighted evidence viewer | Working |
| Conversation memory | Working |
| Feedback: correct / wrong / missing context | Working |
| Admin logs | Working |
| Local JSON persistence | Working |
| PDF / DOCX parsing | Not implemented yet |
| User auth | Not implemented yet |
| PostgreSQL / pgvector | Not implemented yet |
| OpenAI / Anthropic embeddings | Not implemented yet |
| Deployment | Not implemented yet |

## Tech Stack

- React
- Vite
- Express
- Node.js
- Multer
- Vitest
- Supertest
- Local JSON storage
- Local deterministic embedding and retrieval engine

## Project Structure

```text
.
├── public/
│   └── favicon.svg
├── server/
│   ├── app.js          # Express API routes
│   ├── app.test.js     # API tests
│   ├── index.js        # Backend server entry point
│   ├── rag.js          # RAG core: chunking, embeddings, retrieval, answers
│   ├── rag.test.js     # RAG core tests
│   └── store.js        # Local JSON persistence
├── src/
│   ├── main.jsx        # React app
│   └── styles.css      # App styling
├── index.html
├── package.json
└── README.md
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

## Optional Local Persistence

By default, the backend can run in memory. To persist workspaces/documents/conversations across backend restarts, set `OPSPILOT_DATA_FILE` before starting the backend.

PowerShell example:

```powershell
$env:OPSPILOT_DATA_FILE="C:\Users\user\OneDrive\Documents\system\.data\workspaces.json"
npm run server
```

The `.data/` folder is ignored by Git.

## How To Use The App

1. Create a workspace.
2. Paste text or upload a `.txt`, `.md`, or `.markdown` file.
3. Click `Ingest document`.
4. Ask a question about the ingested content.
5. Review the grounded answer and citations.
6. Use the feedback buttons to mark the answer as correct, wrong, or missing context.
7. Check admin logs for query events, latency, model name, and cost placeholder.

## API Endpoints

```text
GET  /api/health
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

## Run Tests

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

## Important Limitations

OpsPilot currently supports real text and Markdown ingestion only. PDF and DOCX uploads are intentionally rejected until real parsing is wired in.

The retrieval engine is local and deterministic. This is useful for testing and demos without API keys, but production deployment should replace it with a real embedding model and vector database such as OpenAI embeddings with PostgreSQL/pgvector or Qdrant.

There is no user authentication yet. Workspaces are backend objects, but not protected by login.

## Next Roadmap

- Add PDF and DOCX parsing.
- Add authentication and user-owned workspaces.
- Replace local JSON storage with PostgreSQL.
- Add pgvector or Qdrant for vector search.
- Add OpenAI or Anthropic model integration.
- Add eval dashboards for retrieval and answer quality.
- Add Docker and deployment setup.
