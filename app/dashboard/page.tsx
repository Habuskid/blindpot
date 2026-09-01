"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useRouter } from 'next/navigation';
import { useHasPermit, useGrantPermit, useDecryptValues } from "@zama-fhe/react-sdk";
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { Navbar } from '../components/Navbar';
import { WalletGate } from '../components/WalletGate';

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
    name: 'isMember',
    inputs: [{ type: 'address', name: 'user' }],
    outputs: [{ type: 'bool', name: '' }],
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

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [claimStatusMsg, setClaimStatusMsg] = useState<string | null>(null);
  const [claimErrorMsg, setClaimErrorMsg] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isSigningPermit, setIsSigningPermit] = useState(false);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const vaultAddress = addresses.vault as `0x${string}`;

  // Read Real Pool Stats On-Chain
  const { data: memberCount, refetch: refetchMemberCount } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'memberCount',
  });

  const { data: isUserMember, refetch: refetchIsMember } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'isMember',
    args: account ? [account] : undefined,
    query: { enabled: !!account && isConnected },
  });

  const { data: currentDrawId, refetch: refetchDrawId } = useReadContract({
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
  const { data: encryptedBalanceHandle, refetch: refetchBalanceHandle } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'getEncryptedBalance',
    args: account ? [account] : undefined,
    query: { enabled: !!account && isConnected },
  });

  // Read Encrypted Winnings Handle for Latest Round
  const { data: encryptedWinningsHandle, refetch: refetchWinningsHandle } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'getEncryptedWinnings',
    args: account && displayDrawId > 0 ? [BigInt(displayDrawId), account] : undefined,
    query: { enabled: !!account && isConnected && displayDrawId > 0 },
  });

  // Zama EIP-712 Permit & Multi-Value Decryption
  const { data: hasPermit, refetch: refetchPermit } = useHasPermit({ contractAddresses: [vaultAddress] });
  const { mutateAsync: grantPermit } = useGrantPermit();

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
  if (validBalanceHandleHex) {
    handlesToDecrypt.push({ encryptedValue: validBalanceHandleHex, contractAddress: vaultAddress });
  }
  if (validWinningsHandleHex) {
    handlesToDecrypt.push({ encryptedValue: validWinningsHandleHex, contractAddress: vaultAddress });
  }

  const { data: decryptedValues, isLoading: isKmsDecrypting } = useDecryptValues(
    handlesToDecrypt,
    { enabled: !!hasPermit && handlesToDecrypt.length > 0 }
  );

  // Compute final display balance
  let decryptedBalance: number | undefined = undefined;
  if (hasPermit) {
    if (encryptedBalanceHandle === 0n) {
      decryptedBalance = 0;
    } else if (validBalanceHandleHex && decryptedValues?.[validBalanceHandleHex] !== undefined) {
      decryptedBalance = Number(decryptedValues[validBalanceHandleHex]) / 1_000_000;
    }
  }

  // Compute final display winnings
  let decryptedWinnings: number | undefined = undefined;
  if (hasPermit) {
    if (encryptedWinningsHandle === 0n) {
      decryptedWinnings = 0;
    } else if (validWinningsHandleHex && decryptedValues?.[validWinningsHandleHex] !== undefined) {
      const raw = Number(decryptedValues[validWinningsHandleHex]);
      decryptedWinnings = raw >= 1_000_000 ? raw / 1_000_000 : raw;
    }
  }

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

  // Decrypt handler
  const onDecryptClick = async () => {
    setErrorMsg(null);
    setStatusMsg(null);

    if (chainId !== sepolia.id) {
      try {
        setStatusMsg("Switching to Ethereum Sepolia...");
        await switchChainAsync({ chainId: sepolia.id });
      } catch (e: any) {
        setErrorMsg("Please switch your wallet to Sepolia to sign decryption permits.");
        setStatusMsg(null);
        return;
      }
    }

    try {
      setIsSigningPermit(true);
      setStatusMsg("Prompting wallet to sign EIP-712 Decryption Permit (gasless)...");
      await grantPermit([vaultAddress]);
      await refetchPermit();
      await refetchIsMember();
      await refetchBalanceHandle();
      await refetchWinningsHandle();
      setIsSigningPermit(false);
      setStatusMsg("✅ Permit granted! Decrypting your confidential positions via Zama KMS...");
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (e: any) {
      console.error("Permit grant error:", e);
      setIsSigningPermit(false);
      setErrorMsg(e?.message || "Decryption permit signature was rejected or failed.");
      setStatusMsg(null);
    }
  };

  const handleClaimWinnings = async () => {
    if (!account) return;
    setClaimErrorMsg(null);
    setClaimStatusMsg("Submitting blinded claim transaction on Sepolia...");
    try {
      await claim(vaultAddress, BigInt(displayDrawId));
      setClaimStatusMsg("🎉 Blinded claim executed! Winnings have been transferred into your confidential balance.");
      await refetchBalanceHandle();
      await refetchWinningsHandle();
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

  const isDecryptingActive = isSigningPermit || isKmsDecrypting;
  const isEnrolled = !!isUserMember || (decryptedBalance !== undefined && decryptedBalance > 0);

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

        {/* WALLET SECURITY GATE IF NOT CONNECTED */}
        {!isConnected ? (
          <>
            <WalletGate
              title="Dashboard Access Restricted"
              description="To view your active pool enrollment, decrypt your deposit balance, or claim epoch winnings, please connect your Web3 wallet."
              actionName="Connect Wallet to View Dashboard"
            />

            {/* LIVE PROTOCOL METRICS SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="border-2 border-primary bg-surface p-5 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Pool Capacity</div>
                <div className="font-value-mono text-2xl font-bold text-primary mt-2">
                  {displayMembers} <span className="text-sm font-normal text-on-surface-variant">/ 25</span>
                </div>
                <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
                  Active Depositors On-Chain
                </div>
              </div>

              <div className="border-2 border-primary bg-surface p-5 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Current Round</div>
                <div className="font-value-mono text-2xl font-bold text-primary mt-2">
                  #{displayDrawId}
                </div>
                <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
                  Autonomous fhEVM Epoch
                </div>
              </div>

              <div className="border-2 border-primary bg-surface p-5 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Next Epoch Draw</div>
                <div className="font-value-mono text-2xl font-bold text-secondary mt-2">
                  {formatCountdown(secondsRemaining)}
                </div>
                <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
                  Continuous Time-Lock
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
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
                <div className="flex items-center gap-3">
                  {decryptedBalance === undefined && (
                    <div className="relative group cursor-pointer" onClick={onDecryptClick}>
                      <div className="bg-primary text-surface px-5 py-2.5 font-label-mono text-xs uppercase tracking-widest hard-shadow-sm flex items-center gap-2 border border-primary select-none">
                        <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                        <span className="font-mono tracking-[0.2em] font-bold text-surface/90">SEALED CIPHERTEXT</span>
                      </div>
                      <div className="absolute -bottom-5 right-0 text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                        Click to Decrypt
                      </div>
                    </div>
                  )}

                  {isDecryptingActive && decryptedBalance === undefined && (
                    <div className="font-label-mono text-xs text-secondary flex items-center gap-1.5 font-bold animate-pulse">
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                      DECRYPTING VIA KMS...
                    </div>
                  )}

                  {decryptedBalance !== undefined && (
                    <div className="flex items-center gap-3 bg-surface-container-low border-2 border-primary px-4 py-2 hard-shadow-sm">
                      <span className="font-value-mono text-2xl md:text-3xl text-secondary font-bold">
                        {decryptedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                      <span className="stamp-decrypt font-stamp-text text-[11px] bg-secondary-container border border-secondary text-secondary px-2 py-0.5 font-bold uppercase">
                        DECRYPTED
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Error Banners */}
              {errorMsg && (
                <div className="bg-error-container border border-error text-error p-3 text-xs font-mono break-words">
                  ⚠️ {errorMsg}
                </div>
              )}

              {statusMsg && (
                <div className="bg-surface-container-high border border-primary text-primary p-3 text-xs font-mono flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>{statusMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                <div className="font-body-md text-xs text-on-surface-variant max-w-md">
                  Balances are encrypted end-to-end with Zama fhEVM. Decrypting uses a gasless EIP-712 permit to retrieve your private plaintext directly in your browser.
                </div>

                <div>
                  <button
                    className="bg-secondary-container text-primary border-2 border-primary font-label-mono text-xs uppercase px-5 py-2.5 hard-shadow-sm font-bold hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-transform flex items-center gap-2 disabled:opacity-50"
                    onClick={onDecryptClick}
                    disabled={isDecryptingActive}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isDecryptingActive ? "sync" : "key"}
                    </span>
                    {isSigningPermit
                      ? "Signing in Wallet..."
                      : isKmsDecrypting
                      ? "Querying KMS..."
                      : hasPermit
                      ? "Refresh Decryption"
                      : "Decrypt My Details"}
                  </button>
                </div>
              </div>
            </div>

            {/* ACTIVE POOL MEMBERSHIP DOSSIER */}
            <div className="mt-6 w-full border-2 border-primary bg-surface p-6 hard-shadow-primary flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b-2 border-primary pb-3">
                <div>
                  <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Enrolled Liquidity Pool</div>
                  <h2 className="font-headline-sm text-lg uppercase font-bold text-primary m-0">
                    Blindpot Vault #1 (USDC Savings)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-surface-container-low border border-primary p-4">
                <div>
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Target Network</div>
                  <div className="font-value-mono text-xs font-bold text-primary mt-0.5">Ethereum Sepolia</div>
                </div>
                <div>
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Smart Contract</div>
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
                  <div className="font-label-mono text-[11px] uppercase text-on-surface-variant">Yield Engine</div>
                  <div className="font-value-mono text-xs font-bold text-secondary mt-0.5">
                    Aave / ERC-4626
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
                <div className="font-body-md text-xs text-on-surface-variant">
                  {isEnrolled ? (
                    <span>
                      ✅ <strong>Your principal is active:</strong> You are automatically entered into every continuous 10-minute epoch draw. Winning probability scales proportionally with your confidential deposit.
                    </span>
                  ) : (
                    <span>
                      ⚠️ <strong>Join the Pool:</strong> Deposit test USDC to receive confidential draw tickets and participate in automated epoch prize distributions.
                    </span>
                  )}
                </div>

                {!isEnrolled && (
                  <button
                    onClick={() => router.push('/deposit')}
                    className="bg-primary text-surface border-2 border-primary font-label-mono text-xs uppercase px-4 py-2 font-bold hard-shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Deposit to Join Pool →
                  </button>
                )}
              </div>
            </div>

            {/* Personal Draw Result Banner */}
            {displayDrawId > 0 && (
              <div className="mt-6 w-full border-2 border-primary bg-surface p-5 hard-shadow-sm">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-primary/20">
                  <div className="font-label-mono text-xs uppercase font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">emoji_events</span>
                    Latest Draw Outcome (Round #{displayDrawId})
                  </div>
                  <span className="font-value-mono text-xs text-on-surface-variant font-bold">
                    {decryptedWinnings !== undefined ? "DECRYPTED" : "SEALED"}
                  </span>
                </div>

                {decryptedWinnings === undefined ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-2 text-xs">
                    <span className="text-on-surface-variant font-body-md">
                      Your round outcome is sealed in ciphertext. Click "Decrypt My Details" to verify if you won the round prize.
                    </span>
                    <button
                      onClick={onDecryptClick}
                      disabled={isDecryptingActive}
                      className="bg-surface border-2 border-primary px-3.5 py-1.5 font-label-mono uppercase font-bold text-xs hover:bg-surface-container-high whitespace-nowrap hard-shadow-sm"
                    >
                      {isDecryptingActive ? "Decrypting..." : "🔑 Check My Result"}
                    </button>
                  </div>
                ) : decryptedWinnings > 0 ? (
                  <div className="bg-secondary-container/40 border border-secondary p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="font-headline-sm text-lg font-bold text-secondary flex items-center gap-1.5">
                        <span>🎉 CONGRATULATIONS! YOU WON ROUND #{displayDrawId}</span>
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
                      {isClaiming ? "Claiming Prize..." : "Claim Prize to Balance"}
                    </button>
                  </div>
                ) : (
                  <div className="py-2 text-xs flex items-center justify-between">
                    <span className="text-on-surface-variant font-body-md">
                      <strong>Round #{displayDrawId} Result:</strong> Non-winning ticket. 100% of your deposit principal remains active in the pool for the next epoch!
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

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Pool Capacity</div>
                <div className="font-value-mono text-2xl font-bold text-primary mt-2">
                  {displayMembers} <span className="text-sm font-normal text-on-surface-variant">/ 25</span>
                </div>
                <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
                  Active Depositors
                </div>
              </div>

              <div className="border-2 border-primary bg-surface p-4 flex flex-col justify-between hard-shadow-sm">
                <div className="font-label-mono text-xs uppercase text-on-surface-variant font-bold">Current Round</div>
                <div className="font-value-mono text-2xl font-bold text-primary mt-2">
                  #{displayDrawId}
                </div>
                <div className="text-[11px] font-label-mono text-on-surface-variant mt-1">
                  On-Chain FHE Draw
                </div>
              </div>

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
          </>
        )}
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
