/**
 * Reminder fire-poll. Hit this on a regular interval (recommended every
 * 1–5 minutes via GitHub Actions, Upstash QStash, or Vercel Pro cron).
 *
 * Each call atomically claims any reminders whose scheduled_at has passed
 * and posts them to Discord. The atomic claim (UPDATE ... RETURNING)
 * prevents double-fires if two pollers race.
 *
 * Auth: same CRON_SECRET as daily-reminder. Sent as Authorization: Bearer
 * <secret> by Vercel Cron, or as ?secret=<value> for ad-hoc triggers.
 */

import { NextResponse } from "next/server";
import { claimDueReminders } from "@/lib/reminders-store";
import { DISCORD_COLORS, notifyDiscord } from "@/lib/discord";

export async function GET(request: Request) {
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
    const due = await claimDueReminders();

    if (due.length === 0) {
      return NextResponse.json({ fired: 0 });
    }

    let messageCount = 0;
    for (const reminder of due) {
      // Each reminder = one embed header (title) + one Discord message per text.
      // We send the title+first-text as one embed, and any additional texts as
      // follow-up plain messages so they group nicely in Discord.
      const headerTitle = reminder.title?.trim() || "⏰ Reminder";

      // First text in an embed
      await notifyDiscord({
        embeds: [
          {
            title: headerTitle,
            description: reminder.texts[0],
            color: DISCORD_COLORS.amber,
            timestamp: reminder.scheduledAt,
            footer: { text: "Olympus · Reminder" },
          },
        ],
      });
      messageCount++;

      // Remaining texts as plain messages so they all visibly fire together
      for (let i = 1; i < reminder.texts.length; i++) {
        await notifyDiscord({ content: reminder.texts[i] });
        messageCount++;
      }
    }

    return NextResponse.json({
      fired: due.length,
      messages: messageCount,
      ids: due.map((r) => r.id),
    });
  } catch (err: any) {
    console.error("check-reminders error:", err);
    return NextResponse.json(
      { error: err.message || "Reminder poll failed" },
      { status: 500 }
    );
  }
}
