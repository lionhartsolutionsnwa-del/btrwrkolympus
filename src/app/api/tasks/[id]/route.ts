import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const statusName =
      status === "in_progress" ? "In Progress" : status === "done" ? "Done" : "Not started";

    // Notion "Status" is a status-type property, not select.
    const page = await notion.pages.update({
      page_id: id,
      properties: {
        Status: {
          status: { name: statusName },
        },
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    console.error("Notion update error:", error);
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}
