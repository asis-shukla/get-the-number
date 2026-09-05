import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | undefined;

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

export function createSqlClient(databaseUrl = getDatabaseUrl()): SqlClient {
  return neon(databaseUrl);
}

export function getSql(): SqlClient {
  sqlClient ??= createSqlClient();
  return sqlClient;
}

export async function migrateDatabase(client = getSql()): Promise<void> {
  const schema = await readFile(
    join(process.cwd(), "db", "schema.sql"),
    "utf8",
  );
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.query(statement);
  }
}
