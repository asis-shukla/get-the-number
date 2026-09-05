import { loadEnvConfig } from "@next/env";
import { createSqlClient, migrateDatabase } from "../../lib/db";

export default async function globalSetup() {
  loadEnvConfig(process.cwd());
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for e2e tests");

  const sql = createSqlClient(databaseUrl);
  await migrateDatabase(sql);
  await sql.query("TRUNCATE TABLE scores RESTART IDENTITY");
}
