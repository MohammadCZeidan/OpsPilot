import request from "supertest";
import { describe, expect, test } from "vitest";
import { createApp } from "./app.js";

describe("OpsPilot API", () => {
  test("creates a workspace, ingests text, answers with citations, records feedback, and returns logs", async () => {
    const app = createApp();

    const workspaceResponse = await request(app)
      .post("/api/workspaces")
      .send({ name: "Demo Workspace", email: "founder@example.com" })
      .expect(201);

    const workspaceId = workspaceResponse.body.workspace.id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .send({
        filename: "runbook.md",
        mimeType: "text/markdown",
        text: "Refund requests are delayed because agents manually inspect invoices before approval.",
      })
      .expect(201);

    const queryResponse = await request(app)
      .post(`/api/workspaces/${workspaceId}/query`)
      .send({ question: "Why are refund requests delayed?" })
      .expect(200);

    expect(queryResponse.body.answer).toContain("Refund requests are delayed");
    expect(queryResponse.body.citations[0].citation).toBe("runbook.md#chunk-1");

    await request(app)
      .post(`/api/workspaces/${workspaceId}/feedback`)
      .send({ queryId: queryResponse.body.id, rating: "missing_context" })
      .expect(201);

    const logsResponse = await request(app).get(`/api/workspaces/${workspaceId}/logs`).expect(200);
    expect(logsResponse.body.logs.some((log) => log.event === "query")).toBe(true);
  });
});
