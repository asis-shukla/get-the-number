import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);
const schema = await readFile(join(process.cwd(), "db", "schema.sql"), "utf8");
const statements = schema
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} database statements.`);