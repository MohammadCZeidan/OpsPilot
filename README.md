<img src="./readme/card-titles/title1.svg"/>
<br>

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details when a license file is added.

<br><br>
<!-- project overview -->
<img src="./readme/card-titles/title2.svg"/>

> OpsPilot is a full-stack AI workspace for building, testing, and reviewing retrieval-augmented generation workflows.<br>
> The system lets users register, create workspaces, ingest documents, ask grounded questions, inspect cited evidence, record answer feedback, and review backend logs through a real React + Express application.

<br>
<!-- System Design -->
<img src="./readme/card-titles/title3.svg"/>

### Application Architecture

| Layer | Purpose |
|------|---------|
| **React + Vite Frontend** | Protected dashboard, workspace management, ingestion UI, question flow, citations, and feedback controls |
| **Express Backend API** | Auth, workspace state, document ingestion, query handling, feedback, and admin logs |
| **RAG Pipeline** | Parsing, chunking, embeddings, hybrid retrieval, reranking, grounded answers, and highlighted evidence |
| **Persistence Layer** | Local JSON state today, with PostgreSQL / pgvector schema and Docker infrastructure included |
| **Embedding Providers** | Local deterministic embeddings by default, optional OpenAI embeddings via `OPENAI_API_KEY` |

<br>

### Repository Map

| Path | Description |
|------|-------------|
| `src/main.jsx` | React application entrypoint |
| `src/styles.css` | Frontend styling |
| `server/app.js` | Express app and API route registration |
| `server/auth.js` | JWT auth and password handling |
| `server/documentParser.js` | TXT, Markdown, PDF, and DOCX parsing |
| `server/rag.js` | Retrieval, reranking, and answer generation logic |
| `server/embeddingProvider.js` | Local and OpenAI embedding provider support |
| `server/store.js` | Local JSON persistence adapter |
| `server/db/schema.sql` | PostgreSQL / pgvector schema |
| `docker-compose.yml` | Local Postgres + API infrastructure |

<br><br>
<!-- Project Highlights -->
<img src="./readme/card-titles/title4.svg"/>

### Core Features

- **JWT authentication**: Register, log in, and access protected workspace routes.<br>
- **User-owned workspaces**: Keep documents, conversations, feedback, and logs scoped by workspace.<br>
- **Document ingestion**: Parse pasted text and `.txt`, `.md`, `.markdown`, `.pdf`, and `.docx` files.<br>
- **RAG workflow**: Chunk documents, embed content, retrieve semantically and by keyword, rerank context, and answer with citations.<br>
- **Evidence inspection**: Review cited source chunks and highlighted supporting text.<br>
- **Operational feedback**: Mark answers as correct, wrong, or missing context and inspect backend logs for latency, model name, and cost placeholders.<br>

<br>

### Current Status

| Area | Status |
|------|--------|
| React frontend | Working |
| Express backend API | Working |
| Login / register | Working |
| JWT auth | Working |
| TXT / Markdown / PDF / DOCX parsing | Working |
| Local deterministic embeddings | Working |
| OpenAI embedding provider | Configurable |
| Hybrid semantic + keyword retrieval | Working |
| Citation-grounded answers | Working |
| Feedback and admin logs | Working |
| Local JSON persistence | Working |
| PostgreSQL / pgvector schema | Added |
| Docker / Docker Compose | Added |
| Full Postgres persistence adapter | Pending |
| Production cloud deployment | Pending |

<br>
<!-- Demo -->
<img src="./readme/card-titles/title5.svg"/>

### Quick Start

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run server
```

The API runs at:

```text
http://127.0.0.1:8787
```

Start the frontend in another terminal:

```bash
npm run dev -- --port 5173
```

Open the app at:

```text
http://127.0.0.1:5173
```

<br>

### How To Use The App

1. Register or log in on the first screen.
2. Create a workspace.
3. Paste text or upload a supported document.
4. Click `Ingest document`.
5. Ask a question about the ingested content.
6. Review the grounded answer and citations.
7. Mark feedback as correct, wrong, or missing context.
8. Check admin logs for query events, latency, model name, and cost placeholder.

<br>

### API Endpoints

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

<br><br>
<!-- Development & Testing -->
<img src="./readme/card-titles/title6.svg"/>

### Environment Setup

Required in production:

```text
OPSPILOT_JWT_SECRET=replace-with-a-long-random-secret
```

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

Anthropic native public embeddings are not wired; use local or OpenAI embeddings.

<br>

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Vite frontend |
| `npm run server` | Start the Express API |
| `npm test` | Run Vitest and Supertest suites |
| `npm run build` | Build the frontend |
| `npm run preview` | Preview the built frontend |

<br>

### Docker / pgvector

Start the database and API container:

```bash
docker compose up --build
```

This starts:

- PostgreSQL with pgvector on port `5432`
- OpsPilot API on port `8787`

The schema is available in `server/db/schema.sql`. The main app still uses local JSON persistence until the full Postgres repository adapter is completed.

<br><br>
<!-- Extras -->
<img src="./readme/card-titles/title7.svg"/>

### Additional Tools & Services

| Tool | Purpose |
|------|---------|
| **React** | Workspace dashboard and RAG interaction UI |
| **Vite** | Frontend development and build tooling |
| **Express** | Backend API server |
| **JWT + bcrypt** | Authentication and password hashing |
| **Multer** | File upload handling |
| **pdf-parse** | PDF document extraction |
| **mammoth** | DOCX document extraction |
| **PostgreSQL / pgvector** | Future vector persistence and retrieval infrastructure |
| **Docker Compose** | Local database and API orchestration |
| **Vitest + Supertest** | Unit and API testing |

<br>

---

**OpsPilot** - Full-stack RAG workspace for grounded document question-answering.

*Built to prove the backend, not just decorate a chatbot.*
