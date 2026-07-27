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
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    email_verified BOOLEAN NOT NULL DEFAULT TRUE
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

  CREATE TABLE IF NOT EXISTS saved_trip_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_key TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    places_json TEXT NOT NULL,
    flight_json TEXT NOT NULL,
    hotel_json TEXT NOT NULL,
    departure_city TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    travelers INTEGER NOT NULL DEFAULT 1,
    budget INTEGER NOT NULL,
    total_cost INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    trip_budget INTEGER NOT NULL DEFAULT 0 CHECK (trip_budget >= 0),
    trip_days INTEGER NOT NULL DEFAULT 3 CHECK (trip_days BETWEEN 1 AND 30),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS booking_inquiries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_key TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    booking_json TEXT NOT NULL,
    traveler_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    inquiry TEXT,
    overall_total INTEGER NOT NULL CHECK (overall_total >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS email_otp_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS password_reset_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS booking_inquiry_messages (
    id BIGSERIAL PRIMARY KEY,
    booking_inquiry_id BIGINT NOT NULL REFERENCES booking_inquiries(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS saved_plans_user_id_idx ON saved_plans(user_id);
  CREATE INDEX IF NOT EXISTS booking_inquiries_user_id_idx ON booking_inquiries(user_id);

  CREATE TABLE IF NOT EXISTS catalog_destinations (
    id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, capital TEXT NOT NULL,
    best_for TEXT, about TEXT, climate TEXT, history TEXT, best_time TEXT, food TEXT,
    daily_expenses INTEGER NOT NULL DEFAULT 1800, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS catalog_places (
    id BIGSERIAL PRIMARY KEY, destination_id TEXT NOT NULL REFERENCES catalog_destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, city TEXT, info TEXT, map_url TEXT, UNIQUE(destination_id, name)
  );
  CREATE TABLE IF NOT EXISTS catalog_hotels (
    id BIGSERIAL PRIMARY KEY, destination_id TEXT NOT NULL REFERENCES catalog_destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'Hotel', area TEXT, price_per_night INTEGER NOT NULL,
    rooms_available INTEGER NOT NULL DEFAULT 0, rating NUMERIC(2,1), UNIQUE(destination_id, name)
  );
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
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, email_verified INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS saved_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, destination_key TEXT NOT NULL, destination_name TEXT NOT NULL, place_name TEXT NOT NULL, place_location TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (user_id, destination_key, place_name));
    CREATE TABLE IF NOT EXISTS saved_trip_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, destination_key TEXT NOT NULL, destination_name TEXT NOT NULL, places_json TEXT NOT NULL, flight_json TEXT NOT NULL, hotel_json TEXT NOT NULL, departure_city TEXT NOT NULL, departure_date TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL, travelers INTEGER NOT NULL DEFAULT 1, budget INTEGER NOT NULL, total_cost INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS user_preferences (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, trip_budget INTEGER NOT NULL DEFAULT 0 CHECK (trip_budget >= 0), trip_days INTEGER NOT NULL DEFAULT 3 CHECK (trip_days BETWEEN 1 AND 30), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS booking_inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, destination_key TEXT NOT NULL, destination_name TEXT NOT NULL, booking_json TEXT NOT NULL, traveler_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, postal_code TEXT NOT NULL, inquiry TEXT, overall_total INTEGER NOT NULL CHECK (overall_total >= 0), status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS email_otp_challenges (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS password_reset_challenges (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS booking_inquiry_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, booking_inquiry_id INTEGER NOT NULL REFERENCES booking_inquiries(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')), message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS saved_plans_user_id_idx ON saved_plans(user_id);
    CREATE INDEX IF NOT EXISTS booking_inquiries_user_id_idx ON booking_inquiries(user_id);
    CREATE TABLE IF NOT EXISTS catalog_destinations (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, capital TEXT NOT NULL, best_for TEXT, about TEXT, climate TEXT, history TEXT, best_time TEXT, food TEXT, daily_expenses INTEGER NOT NULL DEFAULT 1800, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS catalog_places (id INTEGER PRIMARY KEY AUTOINCREMENT, destination_id TEXT NOT NULL REFERENCES catalog_destinations(id) ON DELETE CASCADE, name TEXT NOT NULL, city TEXT, info TEXT, map_url TEXT, UNIQUE(destination_id, name));
    CREATE TABLE IF NOT EXISTS catalog_hotels (id INTEGER PRIMARY KEY AUTOINCREMENT, destination_id TEXT NOT NULL REFERENCES catalog_destinations(id) ON DELETE CASCADE, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'Hotel', area TEXT, price_per_night INTEGER NOT NULL, rooms_available INTEGER NOT NULL DEFAULT 0, rating NUMERIC, UNIQUE(destination_id, name));
  `);
  const userColumns = database.prepare("PRAGMA table_info(users)").all();
  if (!userColumns.some((column) => column.name === "role")) database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  if (!userColumns.some((column) => column.name === "email_verified")) database.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1");
  const messageColumns = database.prepare("PRAGMA table_info(booking_inquiry_messages)").all();
  if (!messageColumns.some((column) => column.name === "read_at")) database.exec("ALTER TABLE booking_inquiry_messages ADD COLUMN read_at TEXT");

  console.log(`SQLite database ready at ${databasePath}`);
  return {
    async query(sql, parameters = []) {
      const statement = database.prepare(sql.replace(/\$\d+/g, "?"));
      const returnsRows = /^\s*SELECT\b/i.test(sql) || /\bRETURNING\b/i.test(sql);
      const sqliteParameters = parameters.map((value) => typeof value === "boolean" ? Number(value) : value);
      if (returnsRows) {
        const rows = statement.all(...sqliteParameters);
        return { rows, rowCount: rows.length };
      }
      const result = statement.run(...sqliteParameters);
      return { rows: [], rowCount: result.changes };
    },
  };
}

async function createPostgresPool() {
  const postgresPool = new Pool({ connectionString: databaseUrl });
  await postgresPool.query(schema);
  await postgresPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'");
  await postgresPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE");
  await postgresPool.query("ALTER TABLE booking_inquiry_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ");
  console.log("PostgreSQL database connected and ready");
  return postgresPool;
}

export const pool = databaseUrl ? await createPostgresPool() : createSqlitePool();
