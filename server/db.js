import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL
  || Object.entries(process.env).find(([name, value]) => name.endsWith("_DATABASE_URL") && value)?.[1];

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_key TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    place_name TEXT NOT NULL,
    place_location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, destination_key, place_name)
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    trip_budget INTEGER NOT NULL DEFAULT 0 CHECK (trip_budget >= 0),
    trip_days INTEGER NOT NULL DEFAULT 3 CHECK (trip_days BETWEEN 1 AND 30),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS saved_plans_user_id_idx ON saved_plans(user_id);
`;

function createSqlitePool() {
  const dataDirectory = path.join(serverDirectory, "data");
  fs.mkdirSync(dataDirectory, { recursive: true });
  const databasePath = process.env.SQLITE_DATABASE_PATH
    ? path.resolve(process.env.SQLITE_DATABASE_PATH)
    : path.join(dataDirectory, "tourgoater.db");
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS saved_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, destination_key TEXT NOT NULL, destination_name TEXT NOT NULL, place_name TEXT NOT NULL, place_location TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (user_id, destination_key, place_name));
    CREATE TABLE IF NOT EXISTS user_preferences (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, trip_budget INTEGER NOT NULL DEFAULT 0 CHECK (trip_budget >= 0), trip_days INTEGER NOT NULL DEFAULT 3 CHECK (trip_days BETWEEN 1 AND 30), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS saved_plans_user_id_idx ON saved_plans(user_id);
  `);

  console.log(`SQLite database ready at ${databasePath}`);
  return {
    async query(sql, parameters = []) {
      const statement = database.prepare(sql.replace(/\$\d+/g, "?"));
      const returnsRows = /^\s*SELECT\b/i.test(sql) || /\bRETURNING\b/i.test(sql);
      if (returnsRows) {
        const rows = statement.all(...parameters);
        return { rows, rowCount: rows.length };
      }
      const result = statement.run(...parameters);
      return { rows: [], rowCount: result.changes };
    },
  };
}

async function createPostgresPool() {
  const postgresPool = new Pool({ connectionString: databaseUrl });
  await postgresPool.query(schema);
  console.log("PostgreSQL database connected and ready");
  return postgresPool;
}

export const pool = databaseUrl ? await createPostgresPool() : createSqlitePool();
