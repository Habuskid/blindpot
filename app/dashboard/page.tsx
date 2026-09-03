"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useChainId, useSwitchChain, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useRouter } from 'next/navigation';
import { useHasPermit, useGrantPermit, useDecryptValues, useRevokePermits } from "@zama-fhe/react-sdk";
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { BLINDPOT_VAULT_ABI } from '../../sdk/src/abi';
import { formatUSDC, formatTimestamp, formatAddress } from '../../lib/formatters';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { NetworkBanner } from '../components/NetworkBanner';
import { CircularLoader } from '../components/BlindpotLoader';
import { Skeleton, SkeletonTableRow } from '../components/Skeleton';
import { Footer } from '../components/Footer';
import { useEpochCountdown } from '../hooks/useEpochCountdown';
import { useToast } from '../components/Toast';

export default function BlindpotDashboard() {
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { claim, isPending: isClaiming } = useClaim();
  const { success: toastSuccess, error: toastError, info: toastInfo, loading: toastLoading, dismiss: toastDismiss } = useToast();
  const router = useRouter();

  const [isSigningPermit, setIsSigningPermit] = useState(false);
  const [isExecutingDraw, setIsExecutingDraw] = useState(false);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const vaultAddress = addresses.vault as `0x${string}`;

  // Read Real Pool Stats On-Chain
  const { data: memberCount, refetch: refetchMemberCount } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'memberCount',
  });

  const { data: isUserMember, refetch: refetchIsMember } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'isMember',
    args: account ? [account] : undefined,
    query: { enabled: !!account && isConnected },
  });

  const { data: currentDrawId, refetch: refetchDrawId } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'currentDrawId',
  });

  const { data: nextDrawTimeRaw, refetch: refetchNextDrawTime } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'nextDrawTime',
  });

  const { formattedCountdown } = useEpochCountdown(nextDrawTimeRaw);

  const { data: drawAddress } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'draw',
  });

  const displayMembers = memberCount !== undefined ? Number(memberCount) : 0;
  const displayDrawId = currentDrawId !== undefined ? Number(currentDrawId) : 0;

  const [selectedDrawId, setSelectedDrawId] = useState<number | null>(null);
  const activeDrawId = selectedDrawId !== null ? selectedDrawId : displayDrawId;

  // Read Encrypted Balance Handle
  const { data: encryptedBalanceHandle, refetch: refetchBalanceHandle } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'getEncryptedBalance',
    args: account ? [account] : undefined,
    query: { enabled: !!account && isConnected },
  });

  // Read Encrypted Winnings Handle for Active/Selected Round
  const { data: encryptedWinningsHandle, refetch: refetchWinningsHandle } = useReadContract({
    address: vaultAddress,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'getEncryptedWinnings',
    args: account && activeDrawId > 0 ? [BigInt(activeDrawId), account] : undefined,
    query: { enabled: !!account && isConnected && activeDrawId > 0 },
  });

  // Zama EIP-712 Permit & Multi-Value Decryption
  const permitContracts = drawAddress
    ? [vaultAddress, drawAddress as `0x${string}`]
    : [vaultAddress];

  const { data: hasPermit, refetch: refetchPermit } = useHasPermit({ contractAddresses: permitContracts });
  const { mutateAsync: grantPermit } = useGrantPermit();
  const { mutateAsync: revokePermits } = useRevokePermits();

  // Format valid non-zero handles for KMS query
  const hasValidBalanceHandle = encryptedBalanceHandle !== undefined && encryptedBalanceHandle > 0n;
  const hasValidWinningsHandle = encryptedWinningsHandle !== undefined && encryptedWinningsHandle > 0n;

  const validBalanceHandleHex = hasValidBalanceHandle
    ? (`0x${encryptedBalanceHandle.toString(16).padStart(64, '0')}` as `0x${string}`)
    : undefined;

  const validWinningsHandleHex = hasValidWinningsHandle
    ? (`0x${encryptedWinningsHandle.toString(16).padStart(64, '0')}` as `0x${string}`)
    : undefined;

  const handlesToDecrypt: { encryptedValue: `0x${string}`; contractAddress: `0x${string}` }[] = [];
  if (validBalanceHandleHex && drawAddress) {
    handlesToDecrypt.push({ encryptedValue: validBalanceHandleHex, contractAddress: drawAddress as `0x${string}` });
  }
  if (validWinningsHandleHex) {
    handlesToDecrypt.push({ encryptedValue: validWinningsHandleHex, contractAddress: vaultAddress });
  }

  const { data: decryptedValues, isLoading: isKmsDecrypting, error: kmsError } = useDecryptValues(
    handlesToDecrypt,
    { enabled: !!hasPermit && handlesToDecrypt.length > 0 }
  );

  // Helper to extract decrypted value regardless of case
  const getDecryptedNumber = (handleHex?: string): number | undefined => {
    if (!handleHex || !decryptedValues) return undefined;
    const val = decryptedValues[handleHex as `0x${string}`] ?? decryptedValues[handleHex.toLowerCase() as `0x${string}`];
    if (val === undefined || val === null) return undefined;
    return Number(val);
  };

  
  // Log KMS errors locally to console for debugging
  useEffect(() => {
    if (kmsError) {
      console.warn("KMS Decryption notice:", kmsError?.message || kmsError);
    }
  }, [kmsError]);

  // Compute final display balance
  let decryptedBalance: number | undefined = undefined;
  if (hasPermit) {
    if (isUserMember === false || encryptedBalanceHandle === 0n || !hasValidBalanceHandle) {
      decryptedBalance = 0;
    } else if (validBalanceHandleHex) {
      const num = getDecryptedNumber(validBalanceHandleHex);
      if (num !== undefined) {
        decryptedBalance = num / 1_000_000;
      }
    }
  }

  // Compute final display winnings
  let decryptedWinnings: number | undefined = undefined;
  if (hasPermit) {
    if (encryptedWinningsHandle === 0n || !hasValidWinningsHandle) {
      decryptedWinnings = 0;
    } else if (validWinningsHandleHex) {
      const num = getDecryptedNumber(validWinningsHandleHex);
      if (num !== undefined) {
        decryptedWinnings = num >= 1_000_000 ? num / 1_000_000 : num;
      }
    }
  }


  // Decrypt handler
  const onDecryptClick = async () => {
    if (chainId !== sepolia.id) {
      try {
        toastInfo("Switching wallet network to Ethereum Sepolia...", { id: "network-toast", title: "NETWORK SWITCH" });
        await switchChainAsync({ chainId: sepolia.id });
        toastSuccess("Connected to Sepolia Testnet.", { id: "network-toast", title: "NETWORK READY" });
      } catch (e: any) {
        toastError("Please switch your wallet to Sepolia to sign decryption permits.", { title: "NETWORK MISMATCH" });
        return;
      }
    }

    try {
      setIsSigningPermit(true);
      toastLoading("Signing EIP-712 Decryption Permit via wallet...", { id: "permit-toast", title: "DECRYPTION PERMIT" });
      // Revoke any cached permits from previous vault deployments
      try { await revokePermits(permitContracts); } catch (_) {}
      await grantPermit(permitContracts);
      await refetchPermit();
      await refetchIsMember();
      await refetchBalanceHandle();
      await refetchWinningsHandle();
      setIsSigningPermit(false);
      toastSuccess("Permit granted! Decrypting your confidential positions via Zama KMS...", { id: "permit-toast", title: "PERMIT VERIFIED", duration: 6000 });
    } catch (e: any) {
      console.error("Permit grant error:", e);
      setIsSigningPermit(false);
      toastError(e?.message || "Decryption permit signature was rejected or failed.", { id: "permit-toast", title: "SIGNING FAILED" });
    }
  };

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Fetch real persistent activity logs from database
  useEffect(() => {
    if (!account) {
      setLoadingActivity(false);
      return;
    }
    setLoadingActivity(true);
    fetch(`/api/activity?user=${account}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.activity) {
          setActivityLogs(data.activity);
        }
      })
      .catch((e) => console.warn('Activity fetch error:', e))
      .finally(() => setLoadingActivity(false));
  }, [account]);

  const handleClaimWinnings = async () => {
    if (!account) return;
    toastLoading("Submitting blinded claim transaction on Sepolia...", { id: "claim-toast", title: "CLAIMING PRIZE" });
    try {
      const hash = await claim(vaultAddress, BigInt(displayDrawId));
      toastSuccess("Blinded claim executed! Winnings have been transferred into your confidential balance.", {
        id: "claim-toast",
        title: "PRIZE CLAIM CONFIRMED",
        duration: 7000,
      });
      
      // Log to database
      try {
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: account,
            poolId: 'pool-usdc-sepolia-01',
            action: 'CLAIM',
            drawId: displayDrawId,
            txHash: hash || ('0x' + '0'.repeat(64)),
          }),
        });
        const refetchRes = await fetch(`/api/activity?user=${account}`);
        const refetchData = await refetchRes.json();
        if (refetchData.success) setActivityLogs(refetchData.activity);
      } catch (logErr) {
        console.warn('Claim log error:', logErr);
      }

      await refetchBalanceHandle();
      await refetchWinningsHandle();
    } catch (e: any) {
      toastError(e?.message || "Claim failed.", { id: "claim-toast", title: "CLAIM FAILED" });
    }
  };

  const handleTriggerDraw = async () => {
    toastLoading("Triggering autonomous draw on Sepolia...", { id: "draw-toast", title: "EXECUTING DRAW" });
    setIsExecutingDraw(true);
    try {
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: BLINDPOT_VAULT_ABI,
        functionName: 'drawWinner',
      } as any);
      toastSuccess(`Confidential draw confirmed on-chain! New epoch started.`, {
        id: "draw-toast",
        title: "ROUND ADVANCED",
        duration: 7000,
      });
      await refetchDrawId();
      await refetchNextDrawTime();
      await refetchMemberCount();
      setIsExecutingDraw(false);
    } catch (e: any) {
      toastError(e?.message || "Draw trigger failed.", { id: "draw-toast", title: "DRAW FAILED" });
      setIsExecutingDraw(false);
    }
  };

  const isDecryptingActive = isSigningPermit || (hasPermit && isKmsDecrypting && handlesToDecrypt.length > 0 && decryptedBalance === undefined);
  const isEnrolled = !!isUserMember || (decryptedBalance !== undefined && decryptedBalance > 0);

  return (
    <AuthGuard>
      <Navbar />

      <div className="md:pl-60 flex-grow flex flex-col">
        <main className="w-full max-w-4xl px-margin-mobile md:px-margin-desktop relative z-10 flex flex-col pt-24 md:pt-28 pb-32 mx-auto">
        {/* Network Mismatch Guard */}
        <NetworkBanner />

        {/* Top Header Card: Balance & Decrypt */}
        <div className="border-2 border-primary bg-surface p-6 md:p-8 hard-shadow-primary flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-primary pb-5">
            <div>
              <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span>
                Confidential Savings Account
              </div>
              <h1 className="font-headline-md text-2xl uppercase font-bold m-0 mt-0.5">Your Deposit Balance</h1>
            </div>

                {/* REDACTED DOSSIER BAR VS DECRYPTED BALANCE */}
                <div className="flex flex-wrap items-center gap-3">
                  {decryptedBalance === undefined ? (
                    <>
                      <div className="flex items-center gap-2 bg-surface-container-low border-2 border-primary px-4 py-2 hard-shadow-sm">
                        <span className="material-symbols-outlined text-[24px] opacity-70">visibility_off</span>
                        <span className="text-xl md:text-2xl font-bold font-value-mono">***.** USDC</span>
                      </div>
                      <button
                        onClick={onDecryptClick}
                        disabled={isDecryptingActive}
                        className="bg-primary text-surface border-2 border-primary font-label-mono text-xs uppercase px-4 py-2.5 font-bold hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isDecryptingActive ? (
                          <>
                            <CircularLoader size="sm" />
                            <span>Decrypting KMS...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">key</span>
                            <span>Decrypt Balance</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 bg-surface-container-low border-2 border-primary px-4 py-2 hard-shadow-sm">
                      <span className="font-value-mono text-2xl md:text-3xl text-secondary font-bold">
                        {decryptedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                      <span className="stamp-decrypt font-stamp-text text-[11px] bg-secondary-container border border-secondary text-secondary px-2 py-0.5 font-bold uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        DECRYPTED
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Error Banners */}
              {kmsError && (
                <div className="bg-error-container border border-error text-error p-3 text-xs font-mono break-words flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span className="font-bold">KMS Decryption Failed</span>
                  </div>
                  <span className="opacity-80">{kmsError.message || String(kmsError)}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                <div className="font-body-md text-xs text-on-surface-variant max-w-md">
                  Balances are encrypted end-to-end with Zama fhEVM. Decrypting uses a gasless EIP-712 permit to retrieve your private plaintext directly in your browser.
                </div>
              </div>
            </div>

            {/* ACTIVE POOL MEMBERSHIP DOSSIER */}
            <div className="mt-6 w-full border-2 border-primary bg-surface p-6 hard-shadow-primary flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b-2 border-primary pb-3">
                <div>
                  <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Enrolled Liquidity Pool</div>
                  <h2 className="font-headline-sm text-lg uppercase font-bold text-primary m-0">
                    Blindpot Vault #1 (Morpho USDC Savings)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {isEnrolled ? (
                    <span className="font-label-mono text-xs bg-secondary-container text-primary border border-secondary px-3 py-1 font-bold uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping inline-block"></span>
                      Active Depositor · Enrolled
                    </span>
                  ) : (
                    <span className="font-label-mono text-xs bg-surface-container-high text-on-surface-variant border border-primary/40 px-3 py-1 font-bold uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-on-surface-variant inline-block"></span>
                      Not Enrolled (0 Deposit)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-surface-container-low border border-primary p-4">
                <div>
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Target Network</div>
                  <div className="font-value-mono text-xs font-bold text-primary mt-0.5">Ethereum Sepolia</div>
                </div>
                <div>
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Vault Contract</div>
                  <a
                    href={`https://sepolia.etherscan.io/address/${vaultAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-value-mono text-xs font-bold text-secondary hover:underline flex items-center gap-1 mt-0.5 truncate"
                  >
                    {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>
                <div>
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Pool Capacity</div>
                  <div className="font-value-mono text-xs font-bold text-primary mt-0.5">
                    {displayMembers} / 25 Depositors
                  </div>
                </div>
                <div>
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Real Blended APR</div>
                  <div className="font-value-mono text-xs font-bold text-secondary mt-0.5 flex items-center gap-1">
                    <span>9.19% APR</span>
                    <span className="text-[10px] text-on-surface-variant font-normal">(3.99% Morpho)</span>
                  </div>
                </div>
                <div>
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Yield Engine</div>
                  <a
                    href="https://sepolia.etherscan.io/address/0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-value-mono text-xs font-bold text-secondary hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Morpho Blue
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>
              </div>

              <div className="pt-1">
                <div className="font-body-md text-xs text-on-surface-variant flex items-center gap-1.5">
                  {isEnrolled ? (
                    <span>
                      <span className="material-symbols-outlined text-[14px] text-secondary inline-block align-middle mr-1">verified</span>
                      <strong>Your principal is active:</strong> You are automatically entered into every continuous 10-minute epoch draw. Winning probability scales proportionally with your confidential deposit.
                    </span>
                  ) : (
                    <span>
                      <span className="material-symbols-outlined text-[14px] text-primary inline-block align-middle mr-1">info</span>
                      <strong>Join the Pool:</strong> Deposit test USDC below to receive confidential draw tickets and participate in automated epoch prize distributions.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Draw Result Banner */}
            {displayDrawId > 0 && (
              <div className="mt-6 w-full border-2 border-primary bg-surface p-5 hard-shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-primary/20">
                  <div className="font-label-mono text-xs uppercase font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">emoji_events</span>
                    Epoch Outcome Dossier (Inspecting Round #{activeDrawId})
                  </div>

                  <div className="flex items-center gap-2">
                    {displayDrawId > 1 && (
                      <div className="flex gap-1">
                        {Array.from({ length: displayDrawId }).map((_, idx) => {
                          const r = idx + 1;
                          const isSelected = activeDrawId === r;
                          return (
                            <button
                              key={r}
                              onClick={() => setSelectedDrawId(r)}
                              className={`px-2 py-0.5 font-label-mono text-[10px] uppercase font-bold border ${
                                isSelected
                                  ? 'bg-primary text-surface border-primary'
                                  : 'bg-surface-container-low text-on-surface border-primary/30 hover:bg-surface-container-high'
                              }`}
                            >
                              Round #{r}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <span className="font-value-mono text-xs text-on-surface-variant font-bold">
                      {decryptedWinnings !== undefined ? "DECRYPTED" : "SEALED"}
                    </span>
                  </div>
                </div>

                {decryptedWinnings === undefined ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-2 text-xs">
                    <span className="text-on-surface-variant font-body-md">
                      Your Round #{activeDrawId} outcome is sealed in ciphertext. Click the encrypted balance above to verify if you won the round prize.
                    </span>
                  </div>
                ) : decryptedWinnings > 0 ? (
                  <div className="bg-secondary-container/40 border border-secondary p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="font-headline-sm text-lg font-bold text-secondary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[20px]">emoji_events</span>
                        <span>WINNER CONFIRMED: YOU WON ROUND #{activeDrawId}</span>
                      </div>
                      <div className="font-value-mono text-sm text-primary font-bold mt-0.5">
                        Prize Amount: {decryptedWinnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </div>
                    </div>

                    <button
                      onClick={handleClaimWinnings}
                      disabled={isClaiming}
                      className="bg-secondary-container text-primary border-2 border-primary font-label-mono text-xs uppercase px-6 py-2.5 font-bold hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {isClaiming ? "Claiming Prize..." : `Claim Round #${activeDrawId} Prize`}
                    </button>
                  </div>
                ) : (
                  <div className="py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-on-surface-variant font-body-md">
                      <strong>Round #{activeDrawId} Result:</strong> Non-winning ticket. 100% of your deposit principal has rolled over into the next epoch draw automatically!
                    </span>
                    <span className="font-label-mono text-xs uppercase text-primary font-bold bg-surface-container-low px-2 py-1 border border-primary/20 whitespace-nowrap self-start sm:self-auto">
                      Principal Rolled Over
                    </span>
                  </div>
                )}
              </div>
            )}


            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Pool Capacity</div>
                {memberCount !== undefined ? (
                  <div className="font-value-mono text-2xl font-bold text-primary mt-2">
                    {displayMembers} <span className="text-sm font-normal text-on-surface-variant">/ 25</span>
                  </div>
                ) : (
                  <Skeleton className="h-7 w-20 mt-2" />
                )}
                <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
                  Active Depositors
                </div>
              </div>

              <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Active Round</div>
                {currentDrawId !== undefined ? (
                  <div className="font-value-mono text-2xl font-bold text-primary mt-2">
                    #{displayDrawId === 0 ? 1 : displayDrawId + 1}
                  </div>
                ) : (
                  <Skeleton className="h-7 w-16 mt-2" />
                )}
                <div className="text-[11px] font-label-mono text-secondary font-bold mt-1">
                  {displayDrawId === 0 ? "Initial Epoch (Active)" : `Epoch #${displayDrawId + 1} (Active)`}
                </div>
              </div>

              <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold flex items-center justify-between">
                  <span>Next Epoch Draw</span>
                  <span className="flex items-center gap-1 text-[10px] text-secondary font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse inline-block"></span>
                    LIVE
                  </span>
                </div>
                {nextDrawTimeRaw !== undefined ? (
                  <div className="flex items-center justify-between mt-2">
                    <div className="font-value-mono text-2xl font-bold text-secondary tracking-wider">
                      {formattedCountdown}
                    </div>
                    {Number(nextDrawTimeRaw) <= Math.floor(Date.now() / 1000) && (
                      <button
                        onClick={handleTriggerDraw}
                        disabled={isExecutingDraw}
                        className="bg-secondary text-primary border-2 border-primary font-label-mono text-[10px] uppercase font-bold py-1 px-2 hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1"
                        title="Permissionless execution: trigger matured draw"
                      >
                        <span className="material-symbols-outlined text-[13px]">bolt</span>
                        {isExecutingDraw ? "Triggering..." : "Execute Draw"}
                      </button>
                    )}
                  </div>
                ) : (
                  <Skeleton className="h-7 w-24 mt-2" />
                )}
                <div className="text-[11px] font-label-mono text-on-surface-variant mt-1 flex items-center justify-between">
                  <span>Autonomous Cadence</span>
                  <span className="text-[10px] text-primary font-bold">10m Epoch</span>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons (Streamlined 2-Action Console) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => router.push('/deposit')}
                className="bg-primary text-surface border-2 border-primary font-label-mono uppercase px-6 py-4 hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all text-center font-bold text-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Deposit USDC to Vault
              </button>

              <button
                onClick={() => router.push('/withdraw')}
                className="bg-surface text-primary border-2 border-primary font-label-mono uppercase px-6 py-4 hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all text-center font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                Withdraw Principal (No Loss)
              </button>
            </div>

            {/* User Activity Ledger (from Database) */}
            <div className="mt-8 border-2 border-primary bg-surface p-6 hard-shadow-primary">
              <div className="flex justify-between items-center border-b-2 border-primary pb-3 mb-4">
                <div>
                  <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Audit Trail</div>
                  <h3 className="font-headline-sm text-lg uppercase font-bold text-primary m-0">
                    Your Activity Dossier
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/history"
                    className="font-label-mono text-xs text-secondary font-bold hover:underline flex items-center gap-1 uppercase"
                  >
                    <span>View All Draws</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                  <span className="font-label-mono text-[11px] uppercase bg-surface-container-low border border-primary px-2.5 py-1">
                    Database Synced
                  </span>
                </div>
              </div>

              {loadingActivity ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-primary/20 bg-surface-container-low font-bold text-on-surface-variant uppercase">
                        <th className="p-2">Action</th>
                        <th className="p-2">Details</th>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      <SkeletonTableRow cols={4} />
                      <SkeletonTableRow cols={4} />
                      <SkeletonTableRow cols={4} />
                    </tbody>
                  </table>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-6 font-label-mono text-xs text-on-surface-variant uppercase">
                  No previous transactions recorded in database for this address yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-primary/20 bg-surface-container-low font-bold text-on-surface-variant uppercase">
                        <th className="p-2">Action</th>
                        <th className="p-2">Details</th>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-surface-container-low/50">
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                log.action === 'DEPOSIT'
                                  ? 'bg-secondary-container text-primary'
                                  : log.action === 'WITHDRAW'
                                  ? 'bg-error-container text-error'
                                  : 'bg-primary text-surface'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2">
                            {log.amount ? `${log.amount} USDC` : log.drawId ? `Round #${log.drawId}` : 'Full Principal'}
                          </td>
                          <td className="p-2 text-on-surface-variant font-mono">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="p-2 text-right">
                            {log.txHash.startsWith('0x') && log.txHash.length > 20 ? (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary font-bold hover:underline"
                              >
                                View Tx ↗
                              </a>
                            ) : (
                              <span className="text-on-surface-variant">Confirmed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
