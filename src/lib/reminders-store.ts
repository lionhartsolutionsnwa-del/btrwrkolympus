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
import type { Reminder, ReminderRecurrence } from "@/types";

const VALID_RECURRENCE: ReminderRecurrence[] = ["none", "daily", "weekly", "monthly"];

/** Compute the next scheduled_at given the previous one and a recurrence rule.
 *  Returns null when the reminder is one-shot. */
function nextOccurrence(prev: Date, rec: ReminderRecurrence): Date | null {
  if (rec === "none") return null;
  const next = new Date(prev);
  if (rec === "daily") next.setUTCDate(next.getUTCDate() + 1);
  else if (rec === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  else if (rec === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  // If the new time is still in the past (e.g. cron was offline for a while),
  // bump forward until it's in the future so we don't fire ten daily catch-ups.
  const now = new Date();
  while (next <= now) {
    if (rec === "daily") next.setUTCDate(next.getUTCDate() + 1);
    else if (rec === "weekly") next.setUTCDate(next.getUTCDate() + 7);
    else if (rec === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

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
           ON reminders (scheduled_at, fired_at);
         -- Recurrence column added 2026-05; safe to re-run via IF NOT EXISTS.
         ALTER TABLE reminders
           ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none';`
      )
      .then(() => undefined);
  }
  await pgReady;
  return pgPool;
}

function rowToReminder(r: any): Reminder {
  const rec = VALID_RECURRENCE.includes(r.recurrence) ? r.recurrence : "none";
  return {
    id: r.id,
    title: r.title ?? null,
    scheduledAt:
      r.scheduled_at instanceof Date
        ? r.scheduled_at.toISOString()
        : String(r.scheduled_at),
    texts: Array.isArray(r.texts) ? r.texts : [],
    recurrence: rec as ReminderRecurrence,
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
  // Recurring + pending first (soonest scheduled at top), then fired one-shots
  // (most recent first). Recurring reminders never go to the "past" list because
  // they have a future scheduled_at after firing.
  const { rows } = await pool.query(
    `SELECT id, title, scheduled_at, texts, recurrence, fired_at, created_at
     FROM reminders
     ORDER BY
       (recurrence != 'none' OR fired_at IS NULL) DESC,
       CASE WHEN recurrence != 'none' OR fired_at IS NULL THEN scheduled_at END ASC,
       fired_at DESC
     LIMIT 200`
  );
  return rows.map(rowToReminder);
}

export async function createReminder(input: {
  title?: string | null;
  scheduledAt: string; // ISO
  texts: string[];
  recurrence?: ReminderRecurrence;
}): Promise<Reminder> {
  const pool = await getPool();
  const id = randomUUID();
  const cleanTexts = input.texts
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter((t) => t.length > 0);
  if (cleanTexts.length === 0) throw new Error("At least one text is required");
  const recurrence: ReminderRecurrence =
    input.recurrence && VALID_RECURRENCE.includes(input.recurrence)
      ? input.recurrence
      : "none";

  const { rows } = await pool.query(
    `INSERT INTO reminders (id, title, scheduled_at, texts, recurrence)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, scheduled_at, texts, recurrence, fired_at, created_at`,
    [
      id,
      input.title?.trim() || null,
      input.scheduledAt,
      JSON.stringify(cleanTexts),
      recurrence,
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

/** Find reminders that are due and atomically claim them.
 *  - One-shot reminders ("none"): stamp fired_at = NOW so they never refire.
 *  - Recurring reminders: stamp fired_at AND advance scheduled_at to the next
 *    occurrence so the row stays pending for the next cycle.
 *  Two-phase claim (SELECT for update, then UPDATE in a txn) prevents
 *  double-fires when multiple pollers race. */
export async function claimDueReminders(): Promise<Reminder[]> {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // SKIP LOCKED so two pollers don't block on the same rows.
    const { rows: claimed } = await client.query(
      `SELECT id, title, scheduled_at, texts, recurrence, fired_at, created_at
       FROM reminders
       WHERE scheduled_at <= NOW()
         AND (
           fired_at IS NULL
           OR (recurrence != 'none' AND fired_at < scheduled_at)
         )
       ORDER BY scheduled_at ASC
       LIMIT 50
       FOR UPDATE SKIP LOCKED`
    );

    for (const r of claimed) {
      const rec = (
        VALID_RECURRENCE.includes(r.recurrence) ? r.recurrence : "none"
      ) as ReminderRecurrence;
      if (rec === "none") {
        await client.query(
          `UPDATE reminders SET fired_at = NOW() WHERE id = $1`,
          [r.id]
        );
      } else {
        const prevScheduled = new Date(r.scheduled_at);
        const next = nextOccurrence(prevScheduled, rec);
        if (!next) {
          await client.query(
            `UPDATE reminders SET fired_at = NOW() WHERE id = $1`,
            [r.id]
          );
        } else {
          await client.query(
            `UPDATE reminders
             SET fired_at = NOW(), scheduled_at = $2
             WHERE id = $1`,
            [r.id, next.toISOString()]
          );
        }
      }
    }
    await client.query("COMMIT");
    return claimed.map(rowToReminder);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
