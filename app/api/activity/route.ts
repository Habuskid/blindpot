import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    
    if (!user) {
      return NextResponse.json({ success: true, activity: [] });
    }

    const activity = await prisma.activityLog.findMany({
      where: { userAddress: { equals: user, mode: 'insensitive' } },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    
    return NextResponse.json({ success: true, activity });
  } catch (e: any) {
    console.warn("Prisma error (likely missing DATABASE_URL):", e?.message);
    return NextResponse.json({ success: true, activity: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.userAddress || !body.action || !body.txHash) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const record = await prisma.activityLog.create({
      data: {
        userAddress: body.userAddress,
        poolId: body.poolId || 'pool-usdc-sepolia-01',
        action: body.action,
        amount: body.amount ? parseFloat(body.amount) : null,
        drawId: body.drawId ? parseInt(body.drawId) : null,
        txHash: body.txHash,
      }
    });
    return NextResponse.json({ success: true, record });
  } catch (e: any) {
    console.warn("Prisma error on write:", e?.message);
    return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 500 });
  }
}

