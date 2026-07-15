import { describe, expect, test } from "vitest";
import {
  createWorkspace,
  ingestDocument,
  queryWorkspace,
  recordFeedback,
  getAdminLogs,
} from "./rag.js";

describe("OpsPilot RAG core", () => {
  test("ingests a document into cited chunks", () => {
    const workspace = createWorkspace("Acme");

    const document = ingestDocument(workspace, {
      filename: "ops.md",
      mimeType: "text/markdown",
      text: "Eligibility checks are slow.\n\nDocument routing blocks first response.",
    });

    expect(document.chunks.length).toBeGreaterThan(0);
    expect(document.chunks[0]).toMatchObject({
      documentId: document.id,
      filename: "ops.md",
      citation: "ops.md#chunk-1",
    });
  });

  test("answers from the most relevant chunks with citations and highlighted evidence", () => {
    const workspace = createWorkspace("Northstar");
    ingestDocument(workspace, {
      filename: "intake.txt",
      mimeType: "text/plain",
      text: "Insurance eligibility checks take 18 minutes per patient and delay intake.",
    });
    ingestDocument(workspace, {
      filename: "brand.txt",
      mimeType: "text/plain",
      text: "The homepage uses green and copper colors for the brand system.",
    });

    const result = queryWorkspace(workspace, "What delays patient intake?");

    expect(result.answer).toContain("Insurance eligibility checks");
    expect(result.citations[0]).toMatchObject({
      filename: "intake.txt",
      citation: "intake.txt#chunk-1",
    });
    expect(result.citations[0].highlight).toContain("<mark>");
  });

  test("stores conversation memory, feedback, and admin logs", () => {
    const workspace = createWorkspace("LedgerLeaf");
    ingestDocument(workspace, {
      filename: "workflow.txt",
      mimeType: "text/plain",
      text: "Bookkeeping onboarding is delayed by receipt collection and account reconciliation.",
    });

    const result = queryWorkspace(workspace, "Where is onboarding delayed?");
    recordFeedback(workspace, result.id, "correct");

    expect(workspace.conversations).toHaveLength(1);
    expect(workspace.feedback).toEqual([{ queryId: result.id, rating: "correct" }]);
    const queryLog = getAdminLogs(workspace).find((log) => log.event === "query");
    expect(queryLog).toMatchObject({
      event: "query",
      model: "local-deterministic",
    });
    expect(queryLog.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
