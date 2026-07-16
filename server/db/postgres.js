import pg from "pg";

export function createPostgresPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) return null;
  return new pg.Pool({ connectionString });
}

export async function assertPgvectorReady(pool) {
  if (!pool) return { ready: false, reason: "DATABASE_URL is not set." };
  const result = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
  return {
    ready: result.rowCount > 0,
    reason: result.rowCount > 0 ? "pgvector is installed." : "pgvector extension is missing.",
  };
}
