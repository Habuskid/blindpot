import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get('poolId') || undefined;
    const draws = db.getDraws(poolId);
    return NextResponse.json({ success: true, draws });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.drawId) {
      return NextResponse.json({ success: false, error: 'Missing drawId' }, { status: 400 });
    }
    const draw = db.recordDraw({
      id: `draw-${body.drawId}`,
      drawId: Number(body.drawId),
      poolId: body.poolId || 'pool-usdc-sepolia-01',
      timestamp: body.timestamp || Math.floor(Date.now() / 1000),
      blockNumber: body.blockNumber || 0,
      potSize: body.potSize || 10.0,
      txHash: body.txHash || '',
      status: 'EXECUTED',
    });
    return NextResponse.json({ success: true, draw });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
