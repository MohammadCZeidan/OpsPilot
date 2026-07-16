import { describe, expect, test } from "vitest";
import { createEmbeddingProvider } from "./embeddingProvider.js";

describe("embedding provider", () => {
  test("uses local deterministic embeddings by default", async () => {
    const provider = createEmbeddingProvider({});
    const result = await provider.embed("refund delays");

    expect(result.model).toBe("local-deterministic");
    expect(result.vector.length).toBeGreaterThan(0);
    expect(result.estimatedCostUsd).toBe(0);
  });

  test("selects OpenAI provider when configured", () => {
    const provider = createEmbeddingProvider({ provider: "openai", apiKey: "test-key" });

    expect(provider.model).toBe("text-embedding-3-small");
  });

  test("selects Anthropic-compatible provider when configured", () => {
    const provider = createEmbeddingProvider({ provider: "anthropic", apiKey: "test-key" });

    expect(provider.model).toBe("anthropic-embedding-placeholder");
  });
});
