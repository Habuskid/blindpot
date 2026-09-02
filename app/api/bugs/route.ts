import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Fallback if no DB configured yet
    if (!process.env.DATABASE_URL) {
      console.error("[BUG LOGGED - NO DB]", body.message, body.details);
      return NextResponse.json({ success: true, fake: true });
    }

    const bug = await prisma.bugLog.create({
      data: {
        message: body.message || 'Unknown bug',
        details: body.details ? JSON.stringify(body.details) : null,
      },
    });

    return NextResponse.json({ success: true, bug });
  } catch (error: any) {
    console.error("Failed to save bug:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
