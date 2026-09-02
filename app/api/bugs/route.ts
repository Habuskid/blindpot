import { NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Fallback if no DB configured yet
    if (!process.env.DATABASE_URL) {
      console.error("[BUG LOGGED - NO DB]", body.message, body.details);
      try {
        fs.appendFileSync("bug_logs.json", JSON.stringify(body) + "\n");
      } catch (e) {}
      return NextResponse.json({ success: true, fake: true });
    }

    const sql = neon(process.env.DATABASE_URL);

    const bug = await sql`
      INSERT INTO "BugLog" (
        "id", "message", "details", "createdAt"
      ) VALUES (
        gen_random_uuid(),
        ${body.message},
        ${body.details},
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, bug: bug[0] });
  } catch (error: any) {
    console.error("Failed to log bug:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      // If running locally without a DB, return the local file contents
      try {
        const fileContent = fs.readFileSync("bug_logs.json", "utf8");
        const bugs = fileContent.trim().split("\n").map(line => JSON.parse(line));
        return NextResponse.json({ success: true, bugs });
      } catch (e) {
        return NextResponse.json({ success: false, message: "No DB URL and no local logs" });
      }
    }

    const sql = neon(process.env.DATABASE_URL);
    const bugs = await sql`
      SELECT * FROM "BugLog"
      ORDER BY "createdAt" DESC
      LIMIT 20
    `;
    
    return NextResponse.json({ success: true, bugs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
