import { NextResponse } from "next/server";
import { createReminder, listReminders } from "@/lib/reminders-store";
import type { ReminderRecurrence } from "@/types";

const VALID_RECURRENCE: ReminderRecurrence[] = ["none", "daily", "weekly", "monthly"];

export async function GET() {
  try {
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (err: any) {
    console.error("Reminders GET error:", err);
    return NextResponse.json(
      { reminders: [], error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title : null;
    const scheduledAt = String(body.scheduledAt || "");
    const texts = Array.isArray(body.texts) ? body.texts : [];
    const recurrence: ReminderRecurrence = VALID_RECURRENCE.includes(body.recurrence)
      ? body.recurrence
      : "none";

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt is required (ISO timestamp)" },
        { status: 400 }
      );
    }
    // Sanity-check the date parses
    const ts = new Date(scheduledAt);
    if (Number.isNaN(ts.getTime())) {
      return NextResponse.json(
        { error: "scheduledAt is not a valid ISO timestamp" },
        { status: 400 }
      );
    }

    const reminder = await createReminder({
      title,
      scheduledAt: ts.toISOString(),
      texts,
      recurrence,
    });
    return NextResponse.json({ success: true, reminder });
  } catch (err: any) {
    console.error("Reminder POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create reminder" },
      { status: 500 }
    );
  }
}
