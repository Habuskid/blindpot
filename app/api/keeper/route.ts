import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { addresses } from '../../../sdk/src/config';
import { BLINDPOT_VAULT_ABI } from '../../../sdk/src/abi';
import { db } from '../../../lib/db';

let isExecuting = false;
let lastExecutionTime = 0;

export async function GET() {
  return handleKeeperTrigger();
}

export async function POST() {
  return handleKeeperTrigger();
}

async function handleKeeperTrigger() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;

  if (!privateKey) {
    return NextResponse.json({ success: false, error: 'Missing PRIVATE_KEY on server' }, { status: 500 });
  }

  let formattedKey = privateKey.trim();
  if ((formattedKey.startsWith('"') && formattedKey.endsWith('"')) || (formattedKey.startsWith("'") && formattedKey.endsWith("'"))) {
    formattedKey = formattedKey.slice(1, -1).trim();
  }
  if (!formattedKey.startsWith('0x')) {
    formattedKey = '0x' + formattedKey;
  }

  const vaultAddress = addresses.vault as `0x${string}`;
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl || 'https://rpc.sepolia.org'),
  });

  try {
    const [memberCount, nextDrawTime, currentDrawId] = await Promise.all([
      publicClient.readContract({ address: vaultAddress, abi: BLINDPOT_VAULT_ABI, functionName: 'memberCount' } as any),
      publicClient.readContract({ address: vaultAddress, abi: BLINDPOT_VAULT_ABI, functionName: 'nextDrawTime' } as any),
      publicClient.readContract({ address: vaultAddress, abi: BLINDPOT_VAULT_ABI, functionName: 'currentDrawId' } as any),
    ]);

    const now = Math.floor(Date.now() / 1000);
    const target = Number(nextDrawTime);
    const members = Number(memberCount);
    const round = Number(currentDrawId);

    if (now < target) {
      return NextResponse.json({
        success: true,
        executed: false,
        reason: 'Epoch not matured yet',
        secondsRemaining: target - now,
        currentDrawId: round,
      });
    }

    if (members === 0) {
      return NextResponse.json({
        success: true,
        executed: false,
        reason: 'No active depositors in pool',
        currentDrawId: round,
      });
    }

    // Rate-limit executions to once per 60 seconds
    if (isExecuting || now - lastExecutionTime < 60) {
      return NextResponse.json({
        success: true,
        executed: false,
        reason: 'Draw transaction already in flight or recently confirmed',
        currentDrawId: round,
      });
    }

    isExecuting = true;
    lastExecutionTime = now;

    const account = privateKeyToAccount(formattedKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl || 'https://rpc.sepolia.org'),
    });

    console.log(`⚡ [API Keeper] Triggering autonomous draw on Sepolia for Round #${round}...`);
    const hash = await walletClient.writeContract({
      address: vaultAddress,
      abi: BLINDPOT_VAULT_ABI,
      functionName: 'drawWinner',
    } as any);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const newDrawId = round + 1;

    // Record to database
    db.recordDraw({
      id: `draw-${newDrawId}`,
      drawId: newDrawId,
      poolId: 'pool-usdc-sepolia-01',
      timestamp: now,
      blockNumber: Number(receipt.blockNumber),
      potSize: 10.0,
      txHash: hash,
      status: 'EXECUTED',
    });

    isExecuting = false;

    return NextResponse.json({
      success: true,
      executed: true,
      newDrawId,
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
    });
  } catch (err: any) {
    isExecuting = false;
    console.error('❌ [API Keeper Error]:', err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || 'Draw execution failed' }, { status: 500 });
  }
}
