import request from "supertest";
import { describe, expect, test } from "vitest";
import { createApp } from "./app.js";

describe("auth", () => {
  test("registers, logs in, and requires a bearer token for workspaces", async () => {
    const app = createApp();

    await request(app).get("/api/workspaces").expect(401);

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({ email: "founder@example.com", password: "secret123" })
      .expect(201);

    expect(registerResponse.body.token).toEqual(expect.any(String));

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "founder@example.com", password: "secret123" })
      .expect(200);

    const token = loginResponse.body.token;
    await request(app).get("/api/workspaces").set("Authorization", `Bearer ${token}`).expect(200);
  });

  test("returns a conflict for duplicate registration", async () => {
    const app = createApp();
    const credentials = { email: "duplicate@example.com", password: "secret123" };

    await request(app).post("/api/auth/register").send(credentials).expect(201);
    const duplicateResponse = await request(app).post("/api/auth/register").send(credentials).expect(409);

    expect(duplicateResponse.body.error).toBe("User already exists. Log in instead.");
  });
});
