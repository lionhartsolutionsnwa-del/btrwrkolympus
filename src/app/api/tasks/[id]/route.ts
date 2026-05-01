import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import type { TaskStatus } from "@/types";
import { DISCORD_COLORS, notifyDiscord } from "@/lib/discord";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_COLOR: Record<TaskStatus, number> = {
  todo: DISCORD_COLORS.marble,
  in_progress: DISCORD_COLORS.amber,
  done: DISCORD_COLORS.olive,
};

function readNotionTitle(props: Record<string, any>): string {
  const titleProp = Object.values(props ?? {}).find((p: any) => p?.type === "title") as any;
  const items = titleProp?.title;
  if (!Array.isArray(items)) return "Untitled";
  return items.map((i: any) => i?.plain_text ?? "").join("").trim() || "Untitled";
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;
let cachedTitlePropertyName: string | null = null;

async function getDatabaseTitlePropertyName(): Promise<string> {
  if (cachedTitlePropertyName) return cachedTitlePropertyName;
  const database: any = await notion.databases.retrieve({ database_id: databaseId });
  const titleEntry = Object.entries(database?.properties ?? {}).find(
    ([, prop]: any) => prop?.type === "title"
  );
  cachedTitlePropertyName = (titleEntry?.[0] as string) || "Task";
  return cachedTitlePropertyName;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build a properties object only for fields that were sent.
    const properties: any = {};

    if (typeof body.status === "string") {
      const statusName =
        body.status === "in_progress"
          ? "In Progress"
          : body.status === "done"
            ? "Done"
            : "Not started";
      properties.Status = { status: { name: statusName } };
    }

    if (typeof body.name === "string" && body.name.trim()) {
      const titlePropertyName = await getDatabaseTitlePropertyName();
      properties[titlePropertyName] = {
        title: [{ text: { content: body.name.trim() } }],
      };
    }

    if (body.dueDate !== undefined) {
      // Empty string or null clears the date.
      properties["Due Date"] =
        body.dueDate === null || body.dueDate === ""
          ? { date: null }
          : { date: { start: body.dueDate } };
    }

    if (typeof body.description === "string") {
      // Empty string clears the rich text.
      properties["Task Description"] = body.description.trim()
        ? {
            rich_text: [{ text: { content: body.description.trim() } }],
          }
        : { rich_text: [] };
    }

    if (typeof body.business === "string") {
      properties["Business/Group"] = body.business.trim()
        ? { select: { name: body.business.trim() } }
        : { select: null };
    }

    if (Object.keys(properties).length === 0) {
      return NextResponse.json(
        { error: "No editable fields supplied" },
        { status: 400 }
      );
    }

    const page: any = await notion.pages.update({
      page_id: id,
      properties,
    });

    // Notify only when a status change happened (other edits are silent —
    // we don't want a Discord ping every time someone tweaks a description).
    if (typeof body.status === "string") {
      const status = body.status as TaskStatus;
      const taskName = readNotionTitle(page?.properties || {});
      notifyDiscord({
        embeds: [
          {
            title: `⚡ ${taskName}`,
            description: `Status → ${STATUS_LABEL[status]}`,
            color: STATUS_COLOR[status],
            footer: { text: "Olympus" },
          },
        ],
      });
    }

    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    console.error("Notion update error:", error);
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}
