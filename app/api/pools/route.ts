import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try {
    const pools = db.getPools();
    return NextResponse.json({ success: true, pools });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.vaultAddress) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const pool = db.registerPool({
      id: body.id || `pool-${Date.now()}`,
      name: body.name,
      symbol: body.symbol || 'cUSDC',
      network: body.network || 'Ethereum Sepolia',
      chainId: body.chainId || 11155111,
      vaultAddress: body.vaultAddress,
      tokenAddress: body.tokenAddress || '',
      underlyingAddress: body.underlyingAddress || '',
      maxMembers: body.maxMembers || 25,
      drawInterval: body.drawInterval || 600,
      yieldEngine: body.yieldEngine || 'ERC-4626 / Aave v3',
      status: 'ACTIVE',
      createdAt: Math.floor(Date.now() / 1000),
    });
    return NextResponse.json({ success: true, pool });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
