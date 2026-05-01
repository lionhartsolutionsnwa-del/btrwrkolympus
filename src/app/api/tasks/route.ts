import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import type { TaskStatus } from "@/types";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;
let cachedTitlePropertyName: string | null = null;

function readNotionText(items: any[] | undefined): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items
    .map((item: any) => item?.plain_text ?? item?.text?.content ?? "")
    .join("")
    .trim();
}

function getTaskNameFromProperties(props: Record<string, any>): string {
  // Prefer common task-title property names first.
  const preferredTitleKeys = ["Task", "Name", "Title"];
  for (const key of preferredTitleKeys) {
    const prop = props?.[key];
    if (!prop) continue;

    if (prop.type === "title") {
      const title = readNotionText(prop.title);
      if (title) return title;
    }

    if (prop.type === "rich_text") {
      const text = readNotionText(prop.rich_text);
      if (text) return text;
    }
  }

  // Fallback to whichever property is the database title field.
  const titleProp = Object.values(props ?? {}).find((prop: any) => prop?.type === "title") as any;
  const title = readNotionText(titleProp?.title);
  if (title) return title;

  // Final fallback in case title is modeled as rich_text in some setups.
  const richTextProp = Object.values(props ?? {}).find((prop: any) => prop?.type === "rich_text") as any;
  const richText = readNotionText(richTextProp?.rich_text);
  return richText || "Untitled";
}

async function getDatabaseTitlePropertyName(): Promise<string> {
  if (cachedTitlePropertyName) return cachedTitlePropertyName;

  const database: any = await notion.databases.retrieve({ database_id: databaseId });
  const titleEntry = Object.entries(database?.properties ?? {}).find(
    ([, prop]: any) => prop?.type === "title"
  );

  cachedTitlePropertyName = (titleEntry?.[0] as string) || "Task";
  return cachedTitlePropertyName;
}

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: "Due Date", direction: "ascending" }],
    });

    const tasks = response.results
      .filter((page: any) => page.object === "page")
      .map((page: any) => {
        const props = page.properties;
        const name = getTaskNameFromProperties(props);

        const statusValue = props.Status?.status?.name?.toLowerCase().replace(" ", "_");
        const status: TaskStatus =
          statusValue === "in_progress"
            ? "in_progress"
            : statusValue === "done"
            ? "done"
            : "todo";

        let dueDate = props["Due Date"]?.date?.start || null;
        if (dueDate && !dueDate.includes("T")) {
          dueDate = dueDate + "T12:00:00";
        }
        const description = readNotionText(props["Task Description"]?.rich_text);
        const business =
          props["Business/Group"]?.select?.name || "";

        return {
          id: page.id,
          name,
          status,
          dueDate,
          description,
          business,
          createdAt: page.created_time,
        };
      });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Notion API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, dueDate, status = "todo", business } = body;
    const titlePropertyName = await getDatabaseTitlePropertyName();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    const properties: any = {
      [titlePropertyName]: {
        title: [{ text: { content: name.trim() } }],
      },
      Status: {
        status: { name: status === "in_progress" ? "In Progress" : status === "done" ? "Done" : "Not started" },
      },
    };

    if (dueDate) {
      properties["Due Date"] = { date: { start: dueDate } };
    }

    if (business && typeof business === "string" && business.trim()) {
      properties["Business/Group"] = { select: { name: business.trim() } };
    }

    const page: any = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return NextResponse.json({
      success: true,
      task: {
        id: page.id,
        name: name.trim(),
        status: status as TaskStatus,
        dueDate: dueDate || null,
        description: "",
        business: business || "",
        createdAt: page.created_time,
      },
    });
  } catch (error: any) {
    console.error("Notion create error:", error);
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    );
  }
}
