"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useRouter } from 'next/navigation';
import { useHasPermit, useGrantPermit, useDecryptValues } from "@zama-fhe/react-sdk";
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { Navbar } from '../components/Navbar';

const vaultAbi = [
  {
    type: 'function',
    name: 'memberCount',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'currentDrawId',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextDrawTime',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'drawInterval',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEncryptedBalance',
    inputs: [{ type: 'address', name: 'user' }],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEncryptedWinnings',
    inputs: [{ type: 'uint256', name: 'drawId' }, { type: 'address', name: 'user' }],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
] as const;

export default function BlindpotDashboard() {
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { claim, isPending: isClaiming } = useClaim();
  const router = useRouter();

  const [claimStatusMsg, setClaimStatusMsg] = useState<string | null>(null);
  const [claimErrorMsg, setClaimErrorMsg] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const vaultAddress = addresses.vault as `0x${string}`;

  // Read Pool Stats
  const { data: memberCount } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'memberCount',
  });

  const { data: currentDrawId } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'currentDrawId',
  });

  const { data: nextDrawTimeRaw } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'nextDrawTime',
  });

  const displayMembers = memberCount !== undefined ? Number(memberCount) : 0;
  const displayDrawId = currentDrawId !== undefined ? Number(currentDrawId) : 0;

  // Read Encrypted Balance Handle
  const { data: encryptedBalanceHandle } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'getEncryptedBalance',
    args: account ? [account] : undefined,
    query: { enabled: !!account && isConnected },
  });

  // Read Encrypted Winnings Handle for Latest Round
  const { data: encryptedWinningsHandle, refetch: refetchWinnings } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'getEncryptedWinnings',
    args: account && displayDrawId > 0 ? [BigInt(displayDrawId), account] : undefined,
    query: { enabled: !!account && isConnected && displayDrawId > 0 },
  });

  // Zama EIP-712 Permit & Multi-Value Decryption
  const { data: hasPermit } = useHasPermit({ contractAddresses: [vaultAddress] });
  const { mutateAsync: grantPermit, isPending: isGrantingPermit } = useGrantPermit();

  const balanceHandleHex = encryptedBalanceHandle !== undefined
    ? `0x${encryptedBalanceHandle.toString(16).padStart(64, '0')}` as `0x${string}`
    : undefined;

  const winningsHandleHex = encryptedWinningsHandle !== undefined
    ? `0x${encryptedWinningsHandle.toString(16).padStart(64, '0')}` as `0x${string}`
    : undefined;

  // Prepare decryption handles array
  const handlesToDecrypt: { encryptedValue: `0x${string}`; contractAddress: `0x${string}` }[] = [];
  if (balanceHandleHex) handlesToDecrypt.push({ encryptedValue: balanceHandleHex, contractAddress: vaultAddress });
  if (winningsHandleHex) handlesToDecrypt.push({ encryptedValue: winningsHandleHex, contractAddress: vaultAddress });

  const { data: decryptedValues, isLoading: isDecrypting } = useDecryptValues(
    handlesToDecrypt,
    { enabled: !!hasPermit && handlesToDecrypt.length > 0 }
  );

  const decryptedBalance = balanceHandleHex && decryptedValues?.[0] !== undefined
    ? Number(decryptedValues[0])
    : undefined;

  const decryptedWinnings = winningsHandleHex && decryptedValues?.[1] !== undefined
    ? Number(decryptedValues[1])
    : undefined;

  // Countdown timer logic
  useEffect(() => {
    if (nextDrawTimeRaw === undefined) return;
    const target = Number(nextDrawTimeRaw);
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      setSecondsRemaining(Math.max(0, target - now));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextDrawTimeRaw]);

  const onDecryptClick = async () => {
    if (chainId !== sepolia.id) {
      try {
        await switchChainAsync({ chainId: sepolia.id });
      } catch (e) {
        return;
      }
    }
    await grantPermit([vaultAddress]);
  };

  const handleClaimWinnings = async () => {
    if (!displayDrawId) return;
    setClaimErrorMsg(null);
    setClaimStatusMsg("Claiming winnings to your wallet confidentially...");
    try {
      await claim(vaultAddress, BigInt(displayDrawId));
      setClaimStatusMsg("🎉 Prize claimed successfully! Your winnings have been deposited into your confidential balance.");
    } catch (e: any) {
      setClaimErrorMsg(e?.message || "Claim failed.");
      setClaimStatusMsg(null);
    }
  };

  const formatCountdown = (secs: number | null) => {
    if (secs === null) return "--:--";
    if (secs === 0) return "DRAW IMMINENT";
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <Navbar />

      <main className="w-full max-w-4xl px-margin-mobile md:px-margin-desktop relative z-10 flex flex-col pt-24 md:pt-28 pb-32 mx-auto">
        {/* Network Mismatch Guard */}
        {isWrongNetwork && (
          <div className="w-full bg-error-container border-2 border-error text-error p-3.5 mb-6 flex justify-between items-center text-xs font-mono">
            <span>⚠️ Connected to Chain {chainId}. Please switch to Sepolia (11155111).</span>
            <button
              onClick={() => switchChainAsync({ chainId: sepolia.id })}
              className="bg-error text-surface px-3 py-1 uppercase font-bold font-label-mono"
            >
              Switch Network
            </button>
          </div>
        )}

        {/* Top Header Card: Balance & Decrypt */}
        <div className="border-2 border-primary bg-surface p-6 md:p-8 hard-shadow-primary flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-primary pb-5">
            <div>
              <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Confidential Savings</div>
              <h1 className="font-headline-md text-2xl uppercase font-bold m-0">Your Deposit Balance</h1>
            </div>

            <div className="flex items-center gap-3">
              {!hasPermit && decryptedBalance === undefined && (
                <div className="bg-primary text-surface px-4 py-2 font-value-mono text-xl tracking-widest hard-shadow-sm">
                  ████████ USDC
                </div>
              )}

              {(isDecrypting || isGrantingPermit) && decryptedBalance === undefined && (
                <div className="font-value-mono text-sm text-secondary flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  Decrypting via KMS...
                </div>
              )}

              {decryptedBalance !== undefined && (
                <div className="flex items-center gap-2.5">
                  <span className="font-value-mono text-2xl text-secondary font-bold">
                    {decryptedBalance.toLocaleString()} USDC
                  </span>
                  <span className="stamp-decrypt font-stamp-text text-xs bg-surface border border-secondary text-secondary px-1.5 py-0.5 font-bold">
                    CONFIDENTIAL
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="font-body-md text-xs text-on-surface-variant max-w-md">
              Encrypted on-chain with Zama FHEVM. Only your private key can decrypt your balance and win status.
            </div>

            {isConnected && (
              <div>
                {!hasPermit ? (
                  <button
                    className="bg-secondary-container text-primary border-2 border-primary font-label-mono text-xs uppercase px-5 py-2.5 hard-shadow-sm font-bold hover:translate-x-[1px] hover:translate-y-[1px] transition-transform flex items-center gap-1.5"
                    onClick={onDecryptClick}
                    disabled={isGrantingPermit}
                  >
                    <span className="material-symbols-outlined text-[16px]">key</span>
                    {isGrantingPermit ? "Signing Permit..." : "Decrypt My Details"}
                  </button>
                ) : (
                  <button
                    className="bg-surface text-primary border border-primary font-label-mono text-xs uppercase px-3 py-1.5 hover:bg-surface-container-high flex items-center gap-1"
                    onClick={onDecryptClick}
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Refresh Data
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Personal Draw Result Banner (Direct In-Dashboard Outcome) */}
        {isConnected && displayDrawId > 0 && (
          <div className="mt-6 w-full border-2 border-primary bg-surface p-5 hard-shadow-sm">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-primary/20">
              <div className="font-label-mono text-xs uppercase font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">emoji_events</span>
                Latest Draw Outcome (Round #{displayDrawId})
              </div>
              <span className="font-value-mono text-xs text-on-surface-variant font-bold">
                {hasPermit ? "DECRYPTED FOR YOU" : "REQUIRES PERMIT"}
              </span>
            </div>

            {!hasPermit ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-2 text-xs">
                <span className="text-on-surface-variant font-body-md">
                  Your round outcome is sealed. Click "Decrypt My Details" above to reveal if you won Round #{displayDrawId}.
                </span>
                <button
                  onClick={onDecryptClick}
                  disabled={isGrantingPermit}
                  className="bg-surface border border-primary px-3 py-1.5 font-label-mono uppercase font-bold text-xs hover:bg-surface-container-high whitespace-nowrap"
                >
                  {isGrantingPermit ? "Signing..." : "🔑 Check My Result"}
                </button>
              </div>
            ) : decryptedWinnings !== undefined && decryptedWinnings > 0 ? (
              <div className="bg-secondary-container/40 border border-secondary p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="font-headline-sm text-lg font-bold text-secondary flex items-center gap-1.5">
                    <span>🎉 CONGRATULATIONS! YOU WON ROUND #{displayDrawId}</span>
                  </div>
                  <div className="font-value-mono text-sm text-primary font-bold mt-0.5">
                    Prize Amount: {decryptedWinnings.toLocaleString()} USDC
                  </div>
                </div>

                <button
                  onClick={handleClaimWinnings}
                  disabled={isClaiming}
                  className="bg-secondary-container text-primary border-2 border-primary font-label-mono text-xs uppercase px-6 py-2.5 font-bold hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isClaiming ? "Claiming Prize..." : "Claim Prize to Balance"}
                </button>
              </div>
            ) : (
              <div className="py-2 text-xs flex items-center justify-between">
                <span className="text-on-surface-variant font-body-md">
                  <strong>Round #{displayDrawId} Result:</strong> Non-winning ticket. 100% of your deposit principal remains in the pool for the next epoch!
                </span>
                <span className="font-label-mono text-xs uppercase text-primary font-bold bg-surface-container-low px-2 py-1 border border-primary/20">
                  Principal Safe
                </span>
              </div>
            )}
          </div>
        )}

        {claimStatusMsg && (
          <div className="mt-4 w-full bg-surface-container-high border border-primary text-primary p-3 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
            {claimStatusMsg}
          </div>
        )}

        {claimErrorMsg && (
          <div className="mt-4 w-full bg-error-container border border-error text-error p-3 text-xs font-mono">
            ⚠️ {claimErrorMsg}
          </div>
        )}

        {/* Minimal Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {/* Depositors */}
          <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
            <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Pool Capacity</div>
            <div className="font-value-mono text-2xl font-bold text-primary mt-2">
              {displayMembers} <span className="text-sm font-normal text-on-surface-variant">/ 25</span>
            </div>
            <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
              Active Depositors
            </div>
          </div>

          {/* Active Round */}
          <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
            <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Current Round</div>
            <div className="font-value-mono text-2xl font-bold text-primary mt-2">
              #{displayDrawId}
            </div>
            <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
              On-Chain FHE Draw
            </div>
          </div>

          {/* Next Draw Timer */}
          <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
            <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Next Epoch Draw</div>
            <div className="font-value-mono text-2xl font-bold text-secondary mt-2">
              {formatCountdown(secondsRemaining)}
            </div>
            <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
              Autonomous Cadence
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => router.push('/deposit')}
            className="bg-secondary-container text-primary border-2 border-primary font-label-mono uppercase px-4 py-3.5 hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all text-center font-bold text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Deposit USDC
          </button>

          <button
            onClick={() => router.push('/withdraw')}
            className="bg-surface text-primary border-2 border-primary font-label-mono uppercase px-4 py-3.5 hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all text-center font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            Withdraw Principal
          </button>

          <button
            onClick={() => router.push('/history')}
            className="bg-surface text-primary border-2 border-primary font-label-mono uppercase px-4 py-3.5 hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all text-center font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Draw History
          </button>
        </div>
      </main>

      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/faucet" className="hover:underline">Faucet</Link>
          <Link href="/how-it-works" className="hover:underline">Docs</Link>
        </div>
      </footer>
    </>
  );
}
