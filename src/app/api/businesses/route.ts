import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;

export async function GET() {
  try {
    const database: any = await notion.databases.retrieve({ database_id: databaseId });
    const props = database?.properties ?? {};

    // Look for the "Business/Group" select property; fall back to any select named like "Business"
    const candidate =
      props["Business/Group"] ??
      Object.values(props).find(
        (p: any) => p?.type === "select" && /business/i.test(p?.name || "")
      );

    const options =
      candidate?.type === "select"
        ? (candidate.select?.options ?? []).map((o: any) => ({ name: o.name, color: o.color }))
        : [];

    return NextResponse.json({ businesses: options });
  } catch (error: any) {
    console.error("Notion businesses error:", error);
    return NextResponse.json(
      { businesses: [], error: error.message },
      { status: 500 }
    );
  }
}
