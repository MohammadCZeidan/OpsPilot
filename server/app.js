import express from "express";
import multer from "multer";
import {
  createWorkspace,
  getAdminLogs,
  ingestDocument,
  queryWorkspace,
  recordFeedback,
} from "./rag.js";
import { parseDocument } from "./documentParser.js";
import { loadUsers, loadWorkspaces, saveAppState } from "./store.js";
import { authenticate, loginUser, registerUser } from "./auth.js";

const upload = multer({ storage: multer.memoryStorage() });

export function createApp(options = {}) {
  const app = express();
  const dataFile = options.dataFile || process.env.OPSPILOT_DATA_FILE;
  const workspaces = loadWorkspaces(dataFile);
  const users = loadUsers(dataFile);

  app.use((_request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    next();
  });
  app.options(/.*/, (_request, response) => response.sendStatus(204));
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      storage: process.env.DATABASE_URL ? "postgres-configured" : "local-json",
      embeddings: process.env.OPSPILOT_EMBEDDING_PROVIDER || "local",
    });
  });

  app.post("/api/auth/register", async (request, response) => {
    try {
      const result = await registerUser(users, request.body);
      saveState();
      response.status(201).json(result);
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (request, response) => {
    try {
      response.json(await loginUser(users, request.body));
    } catch (error) {
      response.status(401).json({ error: error.message });
    }
  });

  const requireAuth = (request, response, next) => authenticate(users, request, response, next);

  app.get("/api/workspaces", requireAuth, (request, response) => {
    response.json({
      workspaces: [...workspaces.values()]
        .filter((workspace) => workspace.ownerEmail === request.user.email)
        .map(publicWorkspace),
    });
  });

  app.post("/api/workspaces", requireAuth, (request, response) => {
    const workspace = createWorkspace(request.body.name || "Untitled Workspace", request.user.email);
    workspaces.set(workspace.id, workspace);
    saveState();
    response.status(201).json({ workspace: publicWorkspace(workspace) });
  });

  app.get("/api/workspaces/:workspaceId", requireAuth, (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response, request.user);
    if (!workspace) return;
    response.json({ workspace: publicWorkspace(workspace) });
  });

  app.get("/api/workspaces/:workspaceId/documents", requireAuth, (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response, request.user);
    if (!workspace) return;
    response.json({
      documents: workspace.documents.map((document) => ({
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
        chunkCount: document.chunks.length,
      })),
    });
  });

  app.get("/api/workspaces/:workspaceId/conversations", requireAuth, (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response, request.user);
    if (!workspace) return;
    response.json({ conversations: workspace.conversations });
  });

  app.post("/api/workspaces/:workspaceId/documents", requireAuth, upload.single("file"), async (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response, request.user);
    if (!workspace) return;

    let parsedDocument;
    try {
      parsedDocument = await parseDocument({
        filename: request.body.filename || request.file?.originalname || "document.txt",
        mimeType: request.body.mimeType || request.file?.mimetype || "text/plain",
        buffer: request.file?.buffer,
        text: request.body.text,
      });
    } catch (error) {
      response.status(400).json({
        error: error.message,
      });
      return;
    }

    const document = ingestDocument(workspace, {
      filename: parsedDocument.filename,
      mimeType: parsedDocument.mimeType,
      text: parsedDocument.text,
    });
    saveState();

    response.status(201).json({
      document: {
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        chunkCount: document.chunks.length,
      },
    });
  });

  app.post("/api/workspaces/:workspaceId/query", requireAuth, (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response, request.user);
    if (!workspace) return;
    const result = queryWorkspace(workspace, request.body.question || "");
    saveState();
    response.json(result);
  });

  app.post("/api/workspaces/:workspaceId/feedback", requireAuth, (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response, request.user);
    if (!workspace) return;
    const feedback = recordFeedback(workspace, request.body.queryId, request.body.rating);
    saveState();
    response.status(201).json({ feedback });
  });

  app.get("/api/workspaces/:workspaceId/logs", requireAuth, (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response, request.user);
    if (!workspace) return;
    response.json({ logs: getAdminLogs(workspace) });
  });

  return app;

  function saveState() {
    saveAppState(dataFile, { workspaces, users });
  }
}

function findWorkspace(workspaces, workspaceId, response, user) {
  const workspace = workspaces.get(workspaceId);
  if (!workspace || (user && workspace.ownerEmail !== user.email)) {
    response.status(404).json({ error: "Workspace not found" });
    return null;
  }
  return workspace;
}

function publicWorkspace(workspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    ownerEmail: workspace.ownerEmail,
    documentCount: workspace.documents.length,
    chunkCount: workspace.chunks.length,
    conversationCount: workspace.conversations.length,
    feedbackCount: workspace.feedback.length,
  };
}
