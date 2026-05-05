import { NextResponse } from "next/server";
import { deleteReminder } from "@/lib/reminders-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteReminder(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reminder DELETE error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
