"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useWithdraw } from '../../sdk/src/withdraw';
import { useGetMyBalance } from '../../sdk/src/getMyBalance';
import { addresses } from '../../sdk/src/config';
import { Navbar } from '../components/Navbar';
import { WalletGate } from '../components/WalletGate';

const VAULT_ADDRESS = addresses.vault;

export default function BlindpotWithdrawFlow() {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const { withdraw, isPending } = useWithdraw();
  const { decryptedBalance, hasPermit, handleGrantPermit, isGrantingPermit, isDecrypting } = useGetMyBalance(VAULT_ADDRESS);

  const handleWithdraw = async () => {
    setErrorMsg(null);

    if (chainId !== sepolia.id) {
      setStatusMsg("Switching wallet network to Ethereum Sepolia...");
      try {
        await switchChainAsync({ chainId: sepolia.id });
      } catch (switchErr: any) {
        setErrorMsg("Please switch your wallet network to Ethereum Sepolia to proceed.");
        setStatusMsg(null);
        return;
      }
    }

    setStatusMsg("Executing full principal withdrawal on Sepolia...");

    try {
      await withdraw(VAULT_ADDRESS);
      setStatusMsg("🎉 Withdrawal successful! Your full principal has been returned to your wallet.");
      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    } catch (e: any) {
      console.error("Withdraw error:", e);
      setErrorMsg(e?.message || "Withdrawal failed. Make sure you have an active deposit balance in the pool.");
      setStatusMsg(null);
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
    <>
      <Navbar />

      <main className="w-full max-w-lg px-margin-mobile relative z-10 mx-auto pt-24 pb-28 flex flex-col items-center">
        {!isConnected ? (
          <WalletGate
            title="Withdrawal Terminal Locked"
            description="To decrypt your active principal and execute a guaranteed 100% no-loss withdrawal from the Blindpot Vault, please connect your Web3 wallet."
            actionName="Connect Wallet to Withdraw"
          />
        ) : (
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

            {isWrongNetwork && (
              <div className="bg-error-container border-2 border-error text-error p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <span>⚠️ Wallet is on Chain {chainId}. Sepolia (11155111) is required.</span>
                <button
                  onClick={() => switchChainAsync({ chainId: sepolia.id })}
                  className="bg-error text-surface px-3 py-1 uppercase font-bold font-label-mono hover:opacity-90 whitespace-nowrap"
                >
                  Switch Network
                </button>
              </div>
            )}

            <div className="p-4 border-2 border-primary bg-surface-container-low mb-6 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                <span className="font-label-mono text-xs uppercase text-on-surface-variant">Deposited Balance</span>
                <div>
                  {decryptedBalance !== undefined ? (
                    <span className="font-value-mono font-bold text-secondary text-base">
                      {decryptedBalance.toLocaleString()} USDC
                    </span>
                  ) : (
                    <span className="font-value-mono text-xs bg-primary text-surface px-2 py-0.5 tracking-widest">
                      ████████
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-label-mono">
                <span className="text-on-surface-variant">Withdraw Mode:</span>
                <span className="font-bold text-primary uppercase">Full Principal (No Lock / No Fee)</span>
              </div>

              {!hasPermit && (
                <button
                  onClick={onDecryptClick}
                  disabled={isGrantingPermit || isDecrypting}
                  className="mt-1 text-xs font-label-mono text-primary underline hover:text-secondary text-left self-start"
                >
                  {isGrantingPermit ? "Signing permit..." : "🔑 Click to decrypt exact balance before withdrawing"}
                </button>
              )}
            </div>

            <div className="py-2 border-l-4 border-primary pl-4 mb-6 bg-surface-container-low/50">
              <p className="font-body-md text-xs text-primary leading-relaxed">
                <strong>Guaranteed No-Loss:</strong> Withdrawing returns 100% of your initial deposit. No penalties, locks, or slashing apply at any point in the cycle.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-error-container border border-error text-error p-3 mb-4 text-xs font-mono break-words">
                ⚠️ {errorMsg}
              </div>
            )}

            {statusMsg && (
              <div className="bg-surface-container-high border border-primary text-primary p-3 mb-4 text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                {statusMsg}
              </div>
            )}

            <button
              className="w-full bg-primary text-surface border-2 border-primary hard-shadow-primary py-4 font-label-mono text-sm uppercase font-bold hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              onClick={handleWithdraw}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Executing Withdrawal...
                </>
              ) : isWrongNetwork ? (
                "Switch to Sepolia & Withdraw"
              ) : (
                <>
                  Execute Withdrawal
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                </>
              )}
            </button>
          </div>
        )}
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
    </>
  );
}
