import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { randomUUID } from "node:crypto";
import type { Scroll, ScrollFile, TaskStatus } from "@/types";
import { readScrolls, saveUpload, writeScroll } from "@/lib/storage";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function updateNotionStatus(taskId: string, status: TaskStatus) {
  const statusName =
    status === "in_progress" ? "In Progress" : status === "done" ? "Done" : "Not started";
  await notion.pages.update({
    page_id: taskId,
    properties: {
      Status: { status: { name: statusName } },
    },
  });
}

export async function GET() {
  try {
    const scrolls = await readScrolls();
    return NextResponse.json({ scrolls });
  } catch (err: any) {
    console.error("Scroll GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch scrolls", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    let files: ScrollFile[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      body = {
        author: String(form.get("author") || "").trim(),
        message: String(form.get("message") || "").trim(),
        taskId: String(form.get("taskId") || "").trim() || undefined,
        taskName: String(form.get("taskName") || "").trim() || undefined,
        newStatus: (String(form.get("newStatus") || "").trim() || undefined) as
          | TaskStatus
          | undefined,
        links: form
          .getAll("links")
          .map((l) => String(l).trim())
          .filter(Boolean),
      };

      const fileEntries = form.getAll("files");
      for (const entry of fileEntries) {
        if (entry instanceof File && entry.size > 0) {
          files.push(await saveUpload(entry));
        }
      }
    } else {
      body = await request.json();
    }

    if (!body.author) {
      return NextResponse.json({ error: "Author is required" }, { status: 400 });
    }
    if (!body.message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (body.taskId && body.newStatus) {
      await updateNotionStatus(body.taskId, body.newStatus);
    }

    const scroll: Scroll = {
      id: randomUUID(),
      author: body.author,
      message: body.message,
      taskId: body.taskId,
      taskName: body.taskName,
      newStatus: body.newStatus,
      links: Array.isArray(body.links) && body.links.length ? body.links : undefined,
      files: files.length ? files : undefined,
      createdAt: new Date().toISOString(),
    };

    await writeScroll(scroll);

    return NextResponse.json({ success: true, scroll });
  } catch (err: any) {
    console.error("Scroll POST error:", err);
    return NextResponse.json(
      { error: "Failed to post scroll", details: err.message },
      { status: 500 }
    );
  }
}
