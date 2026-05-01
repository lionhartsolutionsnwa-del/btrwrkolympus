/**
 * One-time migration: copy data/scrolls.json into Postgres.
 *
 * Run after you have linked Vercel and pulled env vars:
 *   vercel link
 *   vercel env pull .env.local
 *   npx tsx scripts/migrate-local-to-cloud.ts
 *
 * Files referenced by scrolls (in /public/uploads/) are NOT auto-migrated.
 * If you have files you want preserved, manually re-upload them through the
 * UI after migration, or use `vercel blob put` for each one.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  console.error("POSTGRES_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const SCROLLS_FILE = path.join(process.cwd(), "data", "scrolls.json");

async function main() {
  const raw = await fs.readFile(SCROLLS_FILE, "utf8").catch(() => "[]");
  const scrolls = JSON.parse(raw);
  if (!Array.isArray(scrolls) || scrolls.length === 0) {
    console.log("No scrolls to migrate.");
    return;
  }

  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pool.query(
    `CREATE TABLE IF NOT EXISTS scrolls (
       id          UUID PRIMARY KEY,
       author      TEXT NOT NULL,
       message     TEXT NOT NULL,
       task_id     TEXT,
       task_name   TEXT,
       new_status  TEXT,
       links       JSONB,
       files       JSONB,
       created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
     );
     CREATE INDEX IF NOT EXISTS scrolls_created_at_idx ON scrolls (created_at DESC);`
  );

  let inserted = 0;
  for (const s of scrolls) {
    await pool.query(
      `INSERT INTO scrolls (id, author, message, task_id, task_name, new_status, links, files, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        s.id,
        s.author,
        s.message,
        s.taskId ?? null,
        s.taskName ?? null,
        s.newStatus ?? null,
        s.links ? JSON.stringify(s.links) : null,
        s.files ? JSON.stringify(s.files) : null,
        s.createdAt,
      ]
    );
    inserted++;
  }

  console.log(`Migrated ${inserted} scrolls to Postgres.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
