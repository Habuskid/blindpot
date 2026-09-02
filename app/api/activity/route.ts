import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    
    if (!user) {
      return NextResponse.json({ success: true, activity: [] });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, activity: [] });
    }

    const sql = neon(process.env.DATABASE_URL);
    // Use ILIKE for case-insensitive match
    const activity = await sql`
      SELECT * FROM "ActivityLog"
      WHERE "userAddress" ILIKE ${user}
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    
    return NextResponse.json({ success: true, activity });
  } catch (e: any) {
    console.warn("Neon DB error on GET:", e?.message);
    return NextResponse.json({ success: true, activity: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.userAddress || !body.action || !body.txHash) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, record: { ...body, id: 'fake' } });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    const record = await sql`
      INSERT INTO "ActivityLog" (
        "id", "userAddress", "poolId", "action", "amount", "drawId", "txHash", "timestamp"
      ) VALUES (
        gen_random_uuid(),
        ${body.userAddress},
        ${body.poolId || 'pool-usdc-sepolia-01'},
        ${body.action},
        ${body.amount ? parseFloat(body.amount) : null},
        ${body.drawId ? parseInt(body.drawId) : null},
        ${body.txHash},
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, record: record[0] });
  } catch (e: any) {
    console.warn("Neon DB error on POST:", e?.message);
    return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 500 });
  }
}
