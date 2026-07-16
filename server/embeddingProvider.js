const EMBEDDING_DIMENSIONS = 64;

export function createEmbeddingProvider(config = process.env) {
  const provider = normalizeProvider(config.provider || config.OPSPILOT_EMBEDDING_PROVIDER);
  const apiKey = config.apiKey || config.OPENAI_API_KEY || config.ANTHROPIC_API_KEY;

  if (provider === "openai" && apiKey) {
    return {
      model: config.model || config.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      async embed(text) {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            input: text,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error?.message || "OpenAI embedding request failed.");
        }
        return {
          model: this.model,
          vector: payload.data[0].embedding,
          estimatedCostUsd: estimateOpenAiEmbeddingCost(text),
        };
      },
    };
  }

  if (provider === "anthropic" && apiKey) {
    return {
      model: "anthropic-embedding-placeholder",
      async embed() {
        throw new Error(
          "Anthropic embeddings are not exposed as a native public embeddings API here. Use OpenAI embeddings or local mode."
        );
      },
    };
  }

  return {
    model: "local-deterministic",
    async embed(text) {
      return {
        model: "local-deterministic",
        vector: localEmbedding(text),
        estimatedCostUsd: 0,
      };
    },
  };
}

export function localEmbedding(text) {
  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  for (const token of tokenize(text)) {
    const index = hashToken(token) % EMBEDDING_DIMENSIONS;
    vector[index] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export function tokenize(text) {
  return (
    String(text)
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((token) => token.length > 2) ?? []
  );
}

function normalizeProvider(provider) {
  return String(provider || "local").trim().toLowerCase();
}

function estimateOpenAiEmbeddingCost(text) {
  const estimatedTokens = Math.ceil(String(text || "").length / 4);
  return Number(((estimatedTokens / 1_000_000) * 0.02).toFixed(8));
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
