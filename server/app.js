import express from "express";
import multer from "multer";
import {
  createWorkspace,
  getAdminLogs,
  ingestDocument,
  queryWorkspace,
  recordFeedback,
} from "./rag.js";
import { loadWorkspaces, saveWorkspaces } from "./store.js";

const upload = multer({ storage: multer.memoryStorage() });

export function createApp(options = {}) {
  const app = express();
  const dataFile = options.dataFile || process.env.OPSPILOT_DATA_FILE;
  const workspaces = loadWorkspaces(dataFile);

  app.use((_request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    next();
  });
  app.options(/.*/, (_request, response) => response.sendStatus(204));
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.post("/api/workspaces", (request, response) => {
    const workspace = createWorkspace(request.body.name || "Untitled Workspace", request.body.email);
    workspaces.set(workspace.id, workspace);
    saveWorkspaces(dataFile, workspaces);
    response.status(201).json({ workspace: publicWorkspace(workspace) });
  });

  app.get("/api/workspaces/:workspaceId", (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response);
    if (!workspace) return;
    response.json({ workspace: publicWorkspace(workspace) });
  });

  app.post("/api/workspaces/:workspaceId/documents", upload.single("file"), (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response);
    if (!workspace) return;

    const uploadedText = request.file?.buffer?.toString("utf8");
    const document = ingestDocument(workspace, {
      filename: request.body.filename || request.file?.originalname || "document.txt",
      mimeType: request.body.mimeType || request.file?.mimetype || "text/plain",
      text: request.body.text || uploadedText || "",
    });
    saveWorkspaces(dataFile, workspaces);

    response.status(201).json({
      document: {
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        chunkCount: document.chunks.length,
      },
    });
  });

  app.post("/api/workspaces/:workspaceId/query", (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response);
    if (!workspace) return;
    const result = queryWorkspace(workspace, request.body.question || "");
    saveWorkspaces(dataFile, workspaces);
    response.json(result);
  });

  app.post("/api/workspaces/:workspaceId/feedback", (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response);
    if (!workspace) return;
    const feedback = recordFeedback(workspace, request.body.queryId, request.body.rating);
    saveWorkspaces(dataFile, workspaces);
    response.status(201).json({ feedback });
  });

  app.get("/api/workspaces/:workspaceId/logs", (request, response) => {
    const workspace = findWorkspace(workspaces, request.params.workspaceId, response);
    if (!workspace) return;
    response.json({ logs: getAdminLogs(workspace) });
  });

  return app;
}

function findWorkspace(workspaces, workspaceId, response) {
  const workspace = workspaces.get(workspaceId);
  if (!workspace) {
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
