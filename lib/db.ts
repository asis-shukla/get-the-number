import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const defaultDatabasePath = join(process.cwd(), "data", "getme.db");
let database: DatabaseSync | undefined;

export function createDatabase(databasePath: string): DatabaseSync {
  mkdirSync(dirname(databasePath), { recursive: true });
  const connection = new DatabaseSync(databasePath);
  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  connection.exec(schema);
  return connection;
}

export function getDatabase(): DatabaseSync {
  database ??= createDatabase(defaultDatabasePath);
  return database;
}
