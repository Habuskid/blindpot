"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useGetMyWinnings } from '../../sdk/src/getMyWinnings';
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { Navbar } from '../components/Navbar';
import { WalletGate } from '../components/WalletGate';

const VAULT_ADDRESS = addresses.vault;

function YouWonContent() {
  const searchParams = useSearchParams();
  const drawParam = searchParams.get('draw') || '1';
  const drawId = BigInt(drawParam);

  const { isConnected } = useAccount();
  const { decryptedWinnings, hasPermit, handleGrantPermit, isGrantingPermit, isDecrypting } = useGetMyWinnings(VAULT_ADDRESS, drawId);
  const { claim, isPending: isClaiming } = useClaim();

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExecuteClaim = async () => {
    setErrorMsg(null);
    setStatusMsg(`Submitting claim transaction for Draw #${drawParam}...`);
    try {
      await claim(VAULT_ADDRESS, drawId);
      setStatusMsg(`🎉 Claim transaction confirmed! If you won Draw #${drawParam}, your winnings have been deposited into your confidential balance.`);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || `Claim failed for Draw #${drawParam}.`);
      setStatusMsg(null);
    }
  };

  return (
    <main className="flex-grow pt-24 pb-16 px-margin-mobile md:px-margin-desktop flex items-center justify-center relative z-10">
      <div className="w-full max-w-2xl border-2 border-secondary bg-surface p-6 md:p-10 hard-shadow-lg relative overflow-hidden">
        <header className="flex justify-between items-end border-b-2 border-primary pb-4 mb-8">
          <div>
            <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-1">Dossier Report</div>
            <div className="font-value-mono text-sm font-bold">BP-DRW-{drawParam.padStart(4, '0')}</div>
          </div>
          <div className="text-right">
            <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-1">Status</div>
            <div className="font-value-mono text-xs uppercase text-secondary font-bold flex items-center justify-end gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Draw Completed
            </div>
          </div>
        </header>

        <h1 className="font-headline-lg text-2xl md:text-3xl font-bold uppercase tracking-tighter mb-8 text-center text-primary">
          DRAW #{drawParam} - WINNING DOSSIER
        </h1>

        {!isConnected ? (
          <WalletGate
            title="Dossier Decryption Locked"
            description="To decrypt whether your wallet holds the winning ticket for this draw and execute a claim, please connect your Web3 wallet."
            actionName="Connect Wallet to Decrypt Dossier"
          />
        ) : (
          <>
            <div className="border-2 border-primary bg-surface-container-low p-8 mb-8 relative min-h-[180px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 19px, #000 19px, #000 20px)" }}></div>

              {!hasPermit && decryptedWinnings === undefined && (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="bg-primary text-surface px-6 py-3 font-value-mono text-2xl tracking-widest hard-shadow-sm">
                    ████████ USDC
                  </div>
                  <div className="font-label-mono text-xs uppercase text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Confidential Winnings Encrypted
                  </div>
                </div>
              )}

              {(isDecrypting || isGrantingPermit) && decryptedWinnings === undefined && (
                <div className="font-value-mono text-lg text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Decrypting Winnings with KMS...
                </div>
              )}

              {decryptedWinnings !== undefined && (
                <div className="flex flex-col items-center justify-center relative">
                  <div className="font-value-mono text-4xl md:text-5xl font-bold text-secondary tracking-tight">
                    {decryptedWinnings > 0 ? `${(decryptedWinnings / 1_000_000).toLocaleString()} USDC` : "0.00 USDC"}
                  </div>

                  <div className="mt-4 stamp-decrypt font-stamp-text text-stamp-text text-sm">
                    {decryptedWinnings > 0 ? "PRIZE CONFIRMED" : "NON-WINNING TICKET"}
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-error-container border border-error text-error p-3 mb-6 text-xs font-mono break-words">
                ⚠️ {errorMsg}
              </div>
            )}

            {statusMsg && (
              <div className="bg-surface-container-high border border-primary text-primary p-3 mb-6 text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                {statusMsg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t-2 border-primary pt-6">
              {!hasPermit ? (
                <button
                  onClick={handleGrantPermit}
                  disabled={isGrantingPermit}
                  className="bg-surface text-primary border-2 border-primary hard-shadow-primary font-label-mono text-xs uppercase px-8 py-3.5 flex items-center gap-2 hover:bg-surface-container-high font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  {isGrantingPermit ? "Signing Permit..." : "Decrypt Winnings"}
                </button>
              ) : (
                <button
                  onClick={handleExecuteClaim}
                  disabled={isClaiming}
                  className="bg-secondary-container text-primary border-2 border-primary hard-shadow-primary font-label-mono text-xs uppercase px-8 py-3.5 font-bold flex items-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  {isClaiming ? "Executing Claim..." : "Claim to Balance"}
                </button>
              )}

              <Link
                href="/history"
                className="font-label-mono text-xs uppercase text-on-surface-variant hover:text-primary underline px-4 py-2"
              >
                ← Back to All Draws
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function BlindpotYouWon() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="pt-32 text-center font-mono">Loading dossier...</div>}>
        <YouWonContent />
      </Suspense>
      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/history" className="hover:underline">History</Link>
        </div>
      </footer>
    </>
  );
}
