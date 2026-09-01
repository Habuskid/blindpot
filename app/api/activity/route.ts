import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user') || undefined;
    const activity = db.getActivity(user);
    return NextResponse.json({ success: true, activity });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.userAddress || !body.action || !body.txHash) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const record = db.recordActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userAddress: body.userAddress,
      poolId: body.poolId || 'pool-usdc-sepolia-01',
      action: body.action,
      amount: body.amount,
      drawId: body.drawId,
      txHash: body.txHash,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'CONFIRMED',
    });
    return NextResponse.json({ success: true, record });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
