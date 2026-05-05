/**
 * Reminders storage — Postgres-only.
 *
 * Unlike scrolls (which fall back to local JSON for dev convenience),
 * reminders need to be queryable and ordered, and the cron poll must
 * see the same data the UI sees. So we always go to Postgres. If
 * POSTGRES_URL isn't set the helpers throw, which makes failures loud
 * instead of silently storing in a place the cron can't see.
 */

import { randomUUID } from "node:crypto";
import type { Reminder } from "@/types";

let pgPool: any = null;
let pgReady: Promise<void> | null = null;

async function getPool() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not set — reminders require Postgres");
  }
  if (pgPool) return pgPool;
  const { Pool } = await import("pg");
  pgPool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  if (!pgReady) {
    pgReady = pgPool
      .query(
        `CREATE TABLE IF NOT EXISTS reminders (
           id            UUID PRIMARY KEY,
           title         TEXT,
           scheduled_at  TIMESTAMPTZ NOT NULL,
           texts         JSONB NOT NULL,
           fired_at      TIMESTAMPTZ,
           created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
         );
         CREATE INDEX IF NOT EXISTS reminders_scheduled_idx
           ON reminders (scheduled_at, fired_at);`
      )
      .then(() => undefined);
  }
  await pgReady;
  return pgPool;
}

function rowToReminder(r: any): Reminder {
  return {
    id: r.id,
    title: r.title ?? null,
    scheduledAt:
      r.scheduled_at instanceof Date
        ? r.scheduled_at.toISOString()
        : String(r.scheduled_at),
    texts: Array.isArray(r.texts) ? r.texts : [],
    firedAt: r.fired_at
      ? r.fired_at instanceof Date
        ? r.fired_at.toISOString()
        : String(r.fired_at)
      : null,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  };
}

export async function listReminders(): Promise<Reminder[]> {
  const pool = await getPool();
  // Pending first (soonest scheduled at top), then fired (most recent first).
  const { rows } = await pool.query(
    `SELECT id, title, scheduled_at, texts, fired_at, created_at
     FROM reminders
     ORDER BY
       (fired_at IS NULL) DESC,
       CASE WHEN fired_at IS NULL THEN scheduled_at END ASC,
       fired_at DESC
     LIMIT 200`
  );
  return rows.map(rowToReminder);
}

export async function createReminder(input: {
  title?: string | null;
  scheduledAt: string; // ISO
  texts: string[];
}): Promise<Reminder> {
  const pool = await getPool();
  const id = randomUUID();
  const cleanTexts = input.texts
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter((t) => t.length > 0);
  if (cleanTexts.length === 0) throw new Error("At least one text is required");

  const { rows } = await pool.query(
    `INSERT INTO reminders (id, title, scheduled_at, texts)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, scheduled_at, texts, fired_at, created_at`,
    [
      id,
      input.title?.trim() || null,
      input.scheduledAt,
      JSON.stringify(cleanTexts),
    ]
  );
  return rowToReminder(rows[0]);
}

export async function deleteReminder(id: string): Promise<boolean> {
  const pool = await getPool();
  const { rowCount } = await pool.query(
    `DELETE FROM reminders WHERE id = $1`,
    [id]
  );
  return rowCount > 0;
}

/** Find reminders that are due (scheduled_at <= now AND not yet fired)
 *  and atomically claim them by stamping fired_at. Returns the claimed
 *  rows so the caller can post to Discord without risking double-fire. */
export async function claimDueReminders(): Promise<Reminder[]> {
  const pool = await getPool();
  const { rows } = await pool.query(
    `UPDATE reminders
     SET fired_at = NOW()
     WHERE id IN (
       SELECT id FROM reminders
       WHERE fired_at IS NULL
         AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC
       LIMIT 50
     )
     RETURNING id, title, scheduled_at, texts, fired_at, created_at`
  );
  return rows.map(rowToReminder);
}
