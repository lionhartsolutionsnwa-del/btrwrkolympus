/**
 * Daily reminder cron — replaces the old n8n "Mission Tasks Reminder" flow.
 *
 * Runs at 16:00 UTC = 11:00 America/Chicago (CDT). In CST winter months it
 * lands at 10:00. Acceptable for this use case; switch to a multi-trigger
 * cron if you need exact 11:00 year-round.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` automatically to crons
 * defined in vercel.json. We reject anything else to prevent random pings.
 *
 * Auth note: in dev, just hit GET /api/cron/daily-reminder?secret=<value>
 * if CRON_SECRET is unset, auth is skipped (dev convenience).
 */

import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { DISCORD_COLORS, notifyDiscord } from "@/lib/discord";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID!;
const TZ = "America/Chicago";

// ── Date helpers ────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD for the given instant in America/Chicago. */
function chicagoYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Add days to a YYYY-MM-DD string, returning a new YYYY-MM-DD. */
function addDaysYmd(ymd: string, days: number): string {
  // Treat as floating date — no TZ shift.
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Pretty-print a YYYY-MM-DD as "Sat, May 2, 2026" (Chicago locale). */
function fmtPretty(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  // Use UTC midnight + format with TZ=Chicago → consistent display.
  const dt = new Date(Date.UTC(y, m - 1, d, 12)); // noon UTC ≈ same calendar day in Chicago
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

/** Get the YYYY-MM-DD portion of a Notion date.start (handles both
 *  date-only "2026-05-02" and full ISO "2026-05-02T12:00:00"). */
function dueYmd(dateStart: string | null | undefined): string | null {
  if (!dateStart) return null;
  if (dateStart.length === 10) return dateStart; // already YYYY-MM-DD
  if (dateStart.includes("T")) return dateStart.slice(0, 10);
  return null;
}

function readNotionText(items: any[] | undefined): string {
  if (!Array.isArray(items)) return "";
  return items.map((i: any) => i?.plain_text ?? "").join("").trim();
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth: Vercel Cron sends Authorization: Bearer $CRON_SECRET.
  // For local dev, also accept ?secret= query param.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const authHeader = request.headers.get("authorization") || "";
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "");
    const tokenFromQuery = url.searchParams.get("secret") || "";
    if (tokenFromHeader !== secret && tokenFromQuery !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const todayYmd = chicagoYmd(now);
    const tomorrowYmd = addDaysYmd(todayYmd, 1);
    const dayAfterYmd = addDaysYmd(todayYmd, 2);

    // Pull tasks due today or tomorrow.
    const response: any = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          { property: "Due Date", date: { on_or_after: todayYmd } },
          { property: "Due Date", date: { before: dayAfterYmd } },
        ],
      },
      sorts: [{ property: "Due Date", direction: "ascending" }],
    });

    const todayTasks: string[] = [];
    const tomorrowTasks: string[] = [];

    for (const page of response.results) {
      if (page.object !== "page") continue;
      const props = page.properties || {};

      const titleProp = Object.values(props).find(
        (p: any) => p?.type === "title"
      ) as any;
      const name = readNotionText(titleProp?.title) || "Untitled";

      const due = props["Due Date"]?.date?.start;
      const ymd = dueYmd(due);
      if (!ymd) continue;

      const business = props["Business/Group"]?.select?.name;
      const status = props.Status?.status?.name;

      // Skip already-done tasks — no need to remind about completed work.
      if (status === "Done") continue;

      const tag = business ? ` _(${business})_` : "";
      const line = `• ${name}${tag}`;

      if (ymd === todayYmd) todayTasks.push(line);
      else if (ymd === tomorrowYmd) tomorrowTasks.push(line);
    }

    const todayLabel = fmtPretty(todayYmd);
    const tomorrowLabel = fmtPretty(tomorrowYmd);

    const todayCount = todayTasks.length;
    const tomorrowCount = tomorrowTasks.length;

    if (todayCount === 0 && tomorrowCount === 0) {
      // Optional: post a "you're clear" message anyway. For now stay silent.
      return NextResponse.json({
        sent: false,
        reason: "No tasks due today or tomorrow",
      });
    }

    await notifyDiscord({
      content: "Good morning. Here are your quests.",
      embeds: [
        {
          title: "🌅 Daily Quest Roll",
          color: DISCORD_COLORS.gold,
          fields: [
            {
              name: `Today · ${todayLabel}`,
              value: todayCount ? todayTasks.join("\n") : "_None_",
            },
            {
              name: `Tomorrow · ${tomorrowLabel}`,
              value: tomorrowCount ? tomorrowTasks.join("\n") : "_None_",
            },
          ],
          footer: { text: "Olympus" },
        },
      ],
    });

    return NextResponse.json({
      sent: true,
      todayCount,
      tomorrowCount,
    });
  } catch (err: any) {
    console.error("Daily reminder error:", err);
    return NextResponse.json(
      { error: "Daily reminder failed", details: err.message },
      { status: 500 }
    );
  }
}
