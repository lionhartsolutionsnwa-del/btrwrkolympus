/**
 * Dual-mode storage for Scrolls.
 *
 * - When POSTGRES_URL is set, scroll metadata reads/writes go to Postgres.
 * - When BLOB_READ_WRITE_TOKEN is set, file uploads go to Vercel Blob.
 * - Otherwise we fall back to local JSON + filesystem (dev only).
 *
 * This lets the app run on a developer's Mac with zero config and seamlessly
 * promote to a shared deployment by adding the env vars.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Scroll, ScrollFile } from "@/types";

// ---------- Config ----------
const HAS_PG = !!process.env.POSTGRES_URL;
const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

const DATA_DIR = path.join(process.cwd(), "data");
const SCROLLS_FILE = path.join(DATA_DIR, "scrolls.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// ---------- Postgres lazy bootstrap ----------
let pgPool: any = null;
let pgReady: Promise<void> | null = null;

async function getPgPool() {
  if (!HAS_PG) return null;
  if (pgPool) return pgPool;
  // Dynamic import so the local-only path doesn't try to load pg.
  const { Pool } = await import("pg");
  pgPool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    // Vercel Postgres / Neon both require SSL.
    ssl: { rejectUnauthorized: false },
  });
  if (!pgReady) {
    pgReady = pgPool
      .query(
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
      )
      .then(() => undefined);
  }
  await pgReady;
  return pgPool;
}

// ---------- Public API ----------

export function storageMode(): { metadata: "postgres" | "json"; files: "blob" | "local" } {
  return {
    metadata: HAS_PG ? "postgres" : "json",
    files: HAS_BLOB ? "blob" : "local",
  };
}

export async function readScrolls(): Promise<Scroll[]> {
  const pool = await getPgPool();
  if (pool) {
    const { rows } = await pool.query(
      `SELECT id, author, message, task_id, task_name, new_status, links, files, created_at
       FROM scrolls
       ORDER BY created_at DESC
       LIMIT 500`
    );
    return rows.map(
      (r: any): Scroll => ({
        id: r.id,
        author: r.author,
        message: r.message,
        taskId: r.task_id ?? undefined,
        taskName: r.task_name ?? undefined,
        newStatus: r.new_status ?? undefined,
        links: r.links ?? undefined,
        files: r.files ?? undefined,
        createdAt:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      })
    );
  }
  try {
    const raw = await fs.readFile(SCROLLS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeScroll(scroll: Scroll): Promise<void> {
  const pool = await getPgPool();
  if (pool) {
    await pool.query(
      `INSERT INTO scrolls (id, author, message, task_id, task_name, new_status, links, files, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        scroll.id,
        scroll.author,
        scroll.message,
        scroll.taskId ?? null,
        scroll.taskName ?? null,
        scroll.newStatus ?? null,
        scroll.links ? JSON.stringify(scroll.links) : null,
        scroll.files ? JSON.stringify(scroll.files) : null,
        scroll.createdAt,
      ]
    );
    return;
  }
  // local fallback
  await fs.mkdir(DATA_DIR, { recursive: true });
  let scrolls: Scroll[] = [];
  try {
    const raw = await fs.readFile(SCROLLS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) scrolls = parsed;
  } catch {
    /* empty file */
  }
  scrolls.unshift(scroll);
  await fs.writeFile(SCROLLS_FILE, JSON.stringify(scrolls, null, 2));
}

export async function saveUpload(file: File): Promise<ScrollFile> {
  const ext = path.extname(file.name);
  const safeBase = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  const uniqueName = `${randomUUID().slice(0, 8)}-${safeBase}${ext}`;

  if (HAS_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`scrolls/${uniqueName}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
    return { url: blob.url, name: file.name, size: file.size };
  }

  // Local fallback
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const target = path.join(UPLOADS_DIR, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(target, buffer);
  return { url: `/uploads/${uniqueName}`, name: file.name, size: file.size };
}
