import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 2,
    });

    // Return raw property keys and sample values to debug what's actually in Notion
    const debugInfo = response.results
      .filter((page: any) => page.object === "page")
      .map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          allPropKeys: Object.keys(props),
          propDetails: Object.entries(props).reduce((acc: any, [key, value]: [string, any]) => {
            acc[key] = {
              type: value?.type,
              // Capture different possible title/text structures
              raw: value,
              title: value?.title,
              rich_text: value?.rich_text,
              name: value?.name,
            };
            return acc;
          }, {}),
        };
      });

    return NextResponse.json({ 
      success: true,
      pageCount: response.results.length,
      debugInfo,
    });
  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({ 
      error: error.message,
      details: error.code 
    }, { status: 500 });
  }
}
