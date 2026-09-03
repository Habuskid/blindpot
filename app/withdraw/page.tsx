"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSwitchChain, useReadContract, usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useUnshieldAll } from '@zama-fhe/react-sdk';
import { useWithdraw } from '../../sdk/src/withdraw';
import { useGetMyBalance } from '../../sdk/src/getMyBalance';
import { addresses } from '../../sdk/src/config';
import { ERC20_ABI } from '../../sdk/src/abi';
import { formatUSDC } from '../../lib/formatters';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { NetworkBanner } from '../components/NetworkBanner';
import { CircularLoader, OnchainSyncCard, type OnchainPhase } from '../components/BlindpotLoader';

const VAULT_ADDRESS = addresses.vault;
const TOKEN_WRAPPER_ADDRESS = addresses.token;
const UNDERLYING_TOKEN_ADDRESS = addresses.underlyingToken;

export default function BlindpotWithdrawFlow() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pool" | "unwrap">("pool");
  const [actionPhase, setActionPhase] = useState<OnchainPhase>("idle");
  const [actionTitle, setActionTitle] = useState<string>("");
  const [actionDesc, setActionDesc] = useState<string>("");
  const [actionTx, setActionTx] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const { withdraw, isPending: isWithdrawing } = useWithdraw();
  const { decryptedBalance, hasPermit, handleGrantPermit, isGrantingPermit, isDecrypting, refetchHandle } = useGetMyBalance(VAULT_ADDRESS);

  // Read public USDC balance on Sepolia
  const { data: publicBalanceRaw, refetch: refetchPublicBalance } = useReadContract({
    address: UNDERLYING_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && chainId === sepolia.id },
  });

  const publicBalance = publicBalanceRaw !== undefined ? Number(publicBalanceRaw) / 1_000_000 : 0;

  // Zama confidential token unwrap hook
  const { mutateAsync: unshieldAll, isPending: isUnshielding } = useUnshieldAll(TOKEN_WRAPPER_ADDRESS);

  const handleSwitchNetwork = async () => {
    setErrorMsg(null);
    setStatusMsg("Switching wallet network to Ethereum Sepolia...");
    try {
      await switchChainAsync({ chainId: sepolia.id });
      setStatusMsg("Network switched to Sepolia!");
    } catch (switchErr: any) {
      setErrorMsg("Please switch your wallet network to Ethereum Sepolia to proceed.");
      setStatusMsg(null);
    }
  };

  // 1. Withdraw confidential cUSDC from Blindpot Vault to User Wallet
  const handleWithdraw = async () => {
    if (!account) return;
    if (chainId !== sepolia.id) {
      await handleSwitchNetwork();
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setActionTx(null);
    setActionPhase("wallet");
    setActionTitle("Confirm Exit in Wallet");
    setActionDesc("Please review and confirm the full principal withdrawal transaction in MetaMask...");

    try {
      const hash = await withdraw(VAULT_ADDRESS);
      setActionTx(hash || null);
      setActionPhase("mining");
      setActionTitle("Mining on Sepolia");
      setActionDesc("Transaction broadcasted! Waiting for block inclusion on Ethereum Sepolia (~12s)...");

      if (publicClient && hash) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setActionPhase("syncing");
      setActionTitle("Synchronizing Vault State");
      setActionDesc("Block confirmed! Updating encrypted vault balances...");

      try {
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: account,
            poolId: 'pool-usdc-sepolia-01',
            action: 'WITHDRAW',
            txHash: hash || '0x_withdrawn',
          }),
        });
      } catch (dbErr) {
        console.warn('Activity log error:', dbErr);
      }

      await refetchHandle();
      await refetchPublicBalance();

      setActionPhase("success");
      setActionTitle("Withdrawal Confirmed");
      setActionDesc("100% of your principal is now in your wallet as confidential cUSDC. Switching to Step 2 to unwrap to public USDC...");

      setTimeout(() => {
        setActiveTab("unwrap");
      }, 2500);
    } catch (e: any) {
      console.error("Withdraw error:", e);
      const isRejection = e?.message?.includes("rejected") || e?.message?.includes("denied") || e?.code === 4001;
      setActionPhase("error");
      setActionTitle(isRejection ? "Transaction Cancelled" : "Withdrawal Failed");
      setActionDesc(isRejection ? "The withdrawal request was cancelled in your wallet." : (e?.message || "Withdrawal failed. Make sure you have an active deposit balance."));
    }
  };

  // 2. Unwrap confidential cUSDC back to public USDC in MetaMask
  const handleUnwrap = async () => {
    if (!account) return;
    if (chainId !== sepolia.id) {
      await handleSwitchNetwork();
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setActionTx(null);
    setActionPhase("wallet");
    setActionTitle("Confirm Unwrap in Wallet");
    setActionDesc("Please review and sign the Zama cryptographic unshield transaction in MetaMask...");

    try {
      setActionPhase("mining");
      setActionTitle("Processing Zama Cryptographic Unwrap");
      setActionDesc("Orchestrating unwrap request, KMS public decryption proof, and token release on Sepolia...");

      const res = await unshieldAll();
      const hash = (res as any)?.hash || (res as any)?.txHash;
      if (hash) setActionTx(hash);

      setActionPhase("syncing");
      setActionTitle("Synchronizing Balances");
      setActionDesc("Unwrap finalized on-chain! Updating your MetaMask public USDC balance...");

      await refetchPublicBalance();
      await refetchHandle();

      setActionPhase("success");
      setActionTitle("Unwrap Complete");
      setActionDesc("Your confidential cUSDC tokens have been fully unwrapped back into public USDC in MetaMask!");
    } catch (e: any) {
      console.error("Unwrap error:", e);
      const isRejection = e?.message?.includes("rejected") || e?.message?.includes("denied") || e?.code === 4001;
      setActionPhase("error");
      setActionTitle(isRejection ? "Unwrap Cancelled" : "Unwrap Failed");
      setActionDesc(isRejection ? "The unwrap request was cancelled in your wallet." : (e?.message || "Unwrap failed or was rejected."));
    }
  };

  const onDecryptClick = async () => {
    if (chainId !== sepolia.id) {
      try {
        await switchChainAsync({ chainId: sepolia.id });
      } catch (e) {
        return;
      }
    }
    handleGrantPermit();
  };

  return (
    <AuthGuard>
      <Navbar />

      <div className="md:pl-60 flex-grow flex flex-col">
        <main className="w-full max-w-lg px-margin-mobile relative z-10 mx-auto pt-24 pb-28 flex flex-col items-center">
          <div className="bg-surface border-2 border-primary hard-shadow-lg p-6 md:p-8 flex flex-col w-full">
            <header className="flex justify-between items-center border-b-2 border-primary pb-4 mb-6">
              <div>
                <div className="font-label-mono text-xs uppercase text-on-surface-variant">Exit Protocol</div>
                <h1 className="font-headline-md text-xl uppercase font-bold m-0">Withdraw Principal</h1>
              </div>
              <Link
                href="/dashboard"
                className="text-primary hover:bg-surface-container-high p-1 border-2 border-transparent hover:border-primary transition-colors flex items-center justify-center"
                title="Return to Dashboard"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </Link>
            </header>

            <NetworkBanner />

            {/* Symmetrical 2-Step Exit Stepper Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("pool")}
                className={`py-2 px-3 border-2 border-primary font-label-mono text-xs uppercase font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeTab === "pool"
                    ? "bg-primary text-surface hard-shadow-primary"
                    : "bg-surface text-primary hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                1. Pool Exit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unwrap")}
                className={`py-2 px-3 border-2 border-primary font-label-mono text-xs uppercase font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeTab === "unwrap"
                    ? "bg-primary text-surface hard-shadow-primary"
                    : "bg-surface text-primary hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">lock_open</span>
                2. Unwrap cUSDC
              </button>
            </div>

            {/* Live Multi-Stage Balance Ledger */}
            <div className="p-4 border-2 border-primary bg-surface-container-low mb-6 flex flex-col gap-2.5">
              <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                <span className="font-label-mono text-xs uppercase text-on-surface-variant">Deposited in Pool</span>
                <div>
                  {decryptedBalance !== undefined ? (
                    <span className="font-value-mono font-bold text-secondary text-sm">
                      {formatUSDC(decryptedBalance)} cUSDC
                    </span>
                  ) : (
                    <span className="font-value-mono text-xs bg-primary text-surface px-2 py-0.5 tracking-wider">
                      SEALED CIPHERTEXT
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-label-mono">
                <span className="text-on-surface-variant">Public USDC (MetaMask):</span>
                <span className="font-bold text-primary">{formatUSDC(publicBalance)} USDC</span>
              </div>

              {!hasPermit && (
                <button
                  type="button"
                  onClick={onDecryptClick}
                  disabled={isGrantingPermit || isDecrypting}
                  className="mt-1 text-xs font-label-mono text-primary underline hover:text-secondary text-left self-start flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">key</span>
                  {isGrantingPermit ? "Signing permit..." : "Click to decrypt exact pool balance"}
                </button>
              )}
            </div>

            {/* Step 1 Content: Pool Exit */}
            {activeTab === "pool" && (
              <div className="flex flex-col">
                <div className="py-2.5 border-l-4 border-primary pl-4 mb-6 bg-surface-container-low/50">
                  <p className="font-body-md text-xs text-primary leading-relaxed">
                    <strong>Step 1 (Pool Exit):</strong> Withdraws 100% of your initial capital from the Blindpot Vault into your wallet as confidential <strong>cUSDC</strong> tokens. Zero loss, no penalties.
                  </p>
                </div>

                <button
                  className="w-full bg-primary text-surface border-2 border-primary hard-shadow-primary py-4 font-label-mono text-sm uppercase font-bold hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50 mb-3"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <>
                      <CircularLoader size="sm" />
                      Withdrawing cUSDC...
                    </>
                  ) : isWrongNetwork ? (
                    "Switch to Sepolia & Withdraw"
                  ) : (
                    <>
                      Step 1: Withdraw from Pool
                      <span className="material-symbols-outlined text-[16px]">file_download</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2 Content: Unwrap cUSDC to Public USDC */}
            {activeTab === "unwrap" && (
              <div className="flex flex-col">
                <div className="py-2.5 border-l-4 border-secondary pl-4 mb-6 bg-surface-container-low/50">
                  <p className="font-body-md text-xs text-primary leading-relaxed">
                    <strong>Step 2 (Unwrap Bridge):</strong> Unwraps your confidential <strong>cUSDC</strong> wallet tokens back into public <strong>USDC</strong>. Your MetaMask balance will be fully restored.
                  </p>
                </div>

                <button
                  className="w-full bg-secondary-container text-primary border-2 border-primary hard-shadow-primary py-4 font-label-mono text-sm uppercase font-bold hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50 mb-3"
                  onClick={handleUnwrap}
                  disabled={isUnshielding}
                >
                  {isUnshielding ? (
                    <>
                      <CircularLoader size="sm" />
                      Unwrapping to Public USDC...
                    </>
                  ) : isWrongNetwork ? (
                    "Switch to Sepolia & Unwrap"
                  ) : (
                    <>
                      Step 2: Unwrap to Public USDC
                      <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Synchronized On-Chain Action Card */}
            <OnchainSyncCard
              phase={actionPhase}
              title={actionTitle}
              description={actionDesc}
              txHash={actionTx}
              onDismiss={() => setActionPhase("idle")}
            />

            {/* Error Dossier */}
            {errorMsg && (
              <div className="bg-error-container border border-error text-error p-3 mb-4 text-xs font-mono break-words flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {statusMsg && (
              <div className="bg-surface-container-high border border-primary text-primary p-3 mb-4 text-xs font-mono flex items-center gap-2">
                <CircularLoader size="sm" />
                <span>{statusMsg}</span>
              </div>
            )}
          </div>
        </main>

        <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
          <div className="font-label-mono text-xs font-bold uppercase">
            © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-6 font-label-mono text-xs uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/deposit" className="hover:underline">Deposit</Link>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
