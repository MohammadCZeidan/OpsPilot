import { randomUUID } from "node:crypto";

const EMBEDDING_DIMENSIONS = 64;
const VALID_FEEDBACK = new Set(["correct", "wrong", "missing_context"]);

export function createWorkspace(name, ownerEmail = "demo@opspilot.local") {
  return {
    id: randomUUID(),
    name,
    ownerEmail,
    documents: [],
    chunks: [],
    conversations: [],
    feedback: [],
    logs: [],
  };
}

export function ingestDocument(workspace, file) {
  const document = {
    id: randomUUID(),
    filename: file.filename,
    mimeType: file.mimeType,
    text: normalizeText(file.text),
    uploadedAt: new Date().toISOString(),
    chunks: [],
  };

  document.chunks = chunkText(document.text).map((chunk, index) => {
    const chunkNumber = index + 1;
    return {
      id: randomUUID(),
      documentId: document.id,
      filename: document.filename,
      chunkNumber,
      citation: `${document.filename}#chunk-${chunkNumber}`,
      text: chunk,
      embedding: embedText(chunk),
      keywords: tokenize(chunk),
    };
  });

  workspace.documents.push(document);
  workspace.chunks.push(...document.chunks);
  workspace.logs.push({
    id: randomUUID(),
    event: "ingest",
    filename: document.filename,
    chunkCount: document.chunks.length,
    createdAt: new Date().toISOString(),
  });

  return document;
}

export function queryWorkspace(workspace, question) {
  const started = performance.now();
  const queryEmbedding = embedText(question);
  const queryTerms = tokenize(question);

  const ranked = workspace.chunks
    .map((chunk) => ({
      ...chunk,
      score: hybridScore(queryEmbedding, queryTerms, chunk),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const answer = buildGroundedAnswer(question, ranked);
  const citations = ranked.map((chunk) => ({
    chunkId: chunk.id,
    filename: chunk.filename,
    citation: chunk.citation,
    text: chunk.text,
    highlight: highlightEvidence(chunk.text, queryTerms),
    score: Number(chunk.score.toFixed(4)),
  }));

  const result = {
    id: randomUUID(),
    question,
    answer,
    citations,
    createdAt: new Date().toISOString(),
  };

  workspace.conversations.push(result);
  workspace.logs.unshift({
    id: randomUUID(),
    event: "query",
    model: "local-deterministic",
    latencyMs: Math.max(0, Math.round(performance.now() - started)),
    estimatedCostUsd: 0,
    citationCount: citations.length,
    createdAt: new Date().toISOString(),
  });

  return result;
}

export function recordFeedback(workspace, queryId, rating) {
  if (!VALID_FEEDBACK.has(rating)) {
    throw new Error(`Unsupported feedback rating: ${rating}`);
  }

  const feedback = { queryId, rating };
  workspace.feedback.push(feedback);
  workspace.logs.unshift({
    id: randomUUID(),
    event: "feedback",
    queryId,
    rating,
    createdAt: new Date().toISOString(),
  });
  return feedback;
}

export function getAdminLogs(workspace) {
  return workspace.logs;
}

function normalizeText(text) {
  return String(text ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function chunkText(text, maxWords = 80) {
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks = [];

  for (const paragraph of paragraphs.length ? paragraphs : [text]) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    for (let index = 0; index < words.length; index += maxWords) {
      chunks.push(words.slice(index, index + maxWords).join(" "));
    }
  }

  return chunks.length ? chunks : ["Empty document"];
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 2) ?? [];
}

function embedText(text) {
  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  for (const token of tokenize(text)) {
    const index = hashToken(token) % EMBEDDING_DIMENSIONS;
    vector[index] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cosineSimilarity(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function hybridScore(queryEmbedding, queryTerms, chunk) {
  const semantic = cosineSimilarity(queryEmbedding, chunk.embedding);
  const keywordMatches = queryTerms.filter((term) => chunk.keywords.includes(term)).length;
  const keyword = queryTerms.length ? keywordMatches / queryTerms.length : 0;
  return semantic * 0.68 + keyword * 0.32;
}

function buildGroundedAnswer(question, chunks) {
  if (!chunks.length) {
    return `I could not find grounded evidence for "${question}" in this workspace.`;
  }

  const evidence = chunks[0].text;
  return `${sentenceCase(evidence)} Source: ${chunks[0].citation}.`;
}

function sentenceCase(text) {
  const trimmed = text.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function highlightEvidence(text, queryTerms) {
  let highlighted = text;
  const uniqueTerms = [...new Set(queryTerms)].sort((a, b) => b.length - a.length);

  for (const term of uniqueTerms) {
    highlighted = highlighted.replace(new RegExp(`\\b(${escapeRegExp(term)})\\b`, "gi"), "<mark>$1</mark>");
  }

  return highlighted;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
