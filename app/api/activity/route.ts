import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    
    if (!user) {
      return NextResponse.json({ success: true, activity: [] });
    }

    const activity = db.getActivity(user);
    return NextResponse.json({ success: true, activity });
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

    const record = db.recordActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userAddress: body.userAddress.toLowerCase(),
      poolId: body.poolId || 'pool-usdc-sepolia-01',
      action: body.action.toUpperCase() as 'DEPOSIT' | 'WITHDRAW' | 'CLAIM',
      amount: body.amount ? parseFloat(body.amount) : undefined,
      drawId: body.drawId ? parseInt(body.drawId) : undefined,
      txHash: body.txHash,
      timestamp: body.timestamp || Math.floor(Date.now() / 1000),
      status: 'CONFIRMED',
    });

    return NextResponse.json({ success: true, record });
  } catch (e: any) {
    console.warn("DB error on POST /api/activity:", e?.message);
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
