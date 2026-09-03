import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    
    if (!user) {
      return NextResponse.json({ success: true, activity: [] });
    }

    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`
          CREATE TABLE IF NOT EXISTS "ActivityLog" (
            "id" TEXT PRIMARY KEY,
            "userAddress" TEXT NOT NULL,
            "poolId" TEXT NOT NULL,
            "action" TEXT NOT NULL,
            "amount" DOUBLE PRECISION,
            "drawId" INTEGER,
            "txHash" TEXT NOT NULL,
            "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const rows = await sql`
          SELECT * FROM "ActivityLog"
          WHERE "userAddress" ILIKE ${user}
          ORDER BY timestamp DESC
          LIMIT 50
        `;
        const activity = rows.map((r: any) => ({
          id: r.id,
          userAddress: r.userAddress,
          poolId: r.poolId,
          action: r.action,
          amount: r.amount ? parseFloat(r.amount) : undefined,
          drawId: r.drawId ? parseInt(r.drawId) : undefined,
          txHash: r.txHash,
          timestamp: r.timestamp instanceof Date 
            ? Math.floor(r.timestamp.getTime() / 1000) 
            : (typeof r.timestamp === 'string' ? Math.floor(new Date(r.timestamp).getTime() / 1000) : Number(r.timestamp)),
          status: 'CONFIRMED',
        }));
        return NextResponse.json({ success: true, activity, source: 'neon' });
      } catch (neonErr: any) {
        console.warn("Neon DB query error on GET:", neonErr?.message);
      }
    }

    const activity = db.getActivity(user);
    return NextResponse.json({ success: true, activity, source: 'db' });
  } catch (e: any) {
    console.warn("DB error on GET /api/activity:", e?.message);
    return NextResponse.json({ success: true, activity: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.userAddress || !body.action || !body.txHash) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
    const validActions = ['DEPOSIT', 'WITHDRAW', 'CLAIM'];

    if (!ethAddressRegex.test(body.userAddress)) {
      return NextResponse.json({ success: false, error: 'Invalid Ethereum address format' }, { status: 400 });
    }

    if (!txHashRegex.test(body.txHash)) {
      return NextResponse.json({ success: false, error: 'Invalid transaction hash format' }, { status: 400 });
    }

    const actionUpper = String(body.action).toUpperCase();
    if (!validActions.includes(actionUpper)) {
      return NextResponse.json({ success: false, error: 'Invalid action type' }, { status: 400 });
    }

    const recordId = `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const userAddr = body.userAddress.toLowerCase();
    const poolId = body.poolId || 'pool-usdc-sepolia-01';
    const amountVal = body.amount ? parseFloat(body.amount) : undefined;
    const drawIdVal = body.drawId ? parseInt(body.drawId) : undefined;

    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`
          CREATE TABLE IF NOT EXISTS "ActivityLog" (
            "id" TEXT PRIMARY KEY,
            "userAddress" TEXT NOT NULL,
            "poolId" TEXT NOT NULL,
            "action" TEXT NOT NULL,
            "amount" DOUBLE PRECISION,
            "drawId" INTEGER,
            "txHash" TEXT NOT NULL,
            "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const rows = await sql`
          INSERT INTO "ActivityLog" (
            "id", "userAddress", "poolId", "action", "amount", "drawId", "txHash", "timestamp"
          ) VALUES (
            ${recordId},
            ${userAddr},
            ${poolId},
            ${actionUpper},
            ${amountVal || null},
            ${drawIdVal || null},
            ${body.txHash},
            NOW()
          )
          RETURNING *
        `;
        return NextResponse.json({ success: true, record: rows[0], source: 'neon' });
      } catch (neonErr: any) {
        console.warn("Neon DB insert error on POST:", neonErr?.message);
      }
    }

    const record = db.recordActivity({
      id: recordId,
      userAddress: userAddr,
      poolId: poolId,
      action: actionUpper as 'DEPOSIT' | 'WITHDRAW' | 'CLAIM',
      amount: amountVal,
      drawId: drawIdVal,
      txHash: body.txHash,
      timestamp: body.timestamp || Math.floor(Date.now() / 1000),
      status: 'CONFIRMED',
    });

    return NextResponse.json({ success: true, record, source: 'db' });
  } catch (e: any) {
    console.warn("DB error on POST /api/activity:", e?.message);
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
