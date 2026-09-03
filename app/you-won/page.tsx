"use client";

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useGetMyWinnings } from '../../sdk/src/getMyWinnings';
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { formatUSDC } from '../../lib/formatters';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { CircularLoader, DossierLoader } from '../components/BlindpotLoader';
import { Footer } from '../components/Footer';
import { useToast } from '../components/Toast';

const VAULT_ADDRESS = addresses.vault;

function YouWonContent() {
  const searchParams = useSearchParams();
  const drawParam = searchParams.get('draw') || searchParams.get('drawId') || '1';
  const drawId = BigInt(drawParam);

  const { address: account, isConnected } = useAccount();
  const { decryptedWinnings, hasPermit, handleGrantPermit, isGrantingPermit, isDecrypting } = useGetMyWinnings(VAULT_ADDRESS, drawId);
  const { claim, isPending: isClaiming } = useClaim();
  const { success: toastSuccess, error: toastError, loading: toastLoading, dismiss: toastDismiss } = useToast();

  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    if (account && drawParam) {
      const stored = sessionStorage.getItem(`claimed_${drawParam}_${account.toLowerCase()}`);
      if (stored === 'true') {
        setIsClaimed(true);
      }
    }
  }, [account, drawParam]);

  const onSignPermitClick = async () => {
    toastLoading('Requesting EIP-712 decryption permit signature...', { id: 'permit-toast', title: 'DECRYPTION PERMIT' });
    try {
      await handleGrantPermit();
      toastSuccess('Permit verified! Decrypting your round dossier...', { id: 'permit-toast', title: 'PERMIT GRANTED' });
    } catch (e: any) {
      toastError(e?.message || 'Permit signing failed.', { id: 'permit-toast', title: 'SIGNING FAILED' });
    }
  };

  const handleExecuteClaim = async () => {
    toastLoading(`Submitting claim transaction for Draw #${drawParam}...`, { id: 'claim-toast', title: 'CLAIM TRANSACTION' });
    try {
      const tx = await claim(VAULT_ADDRESS, drawId);
      setIsClaimed(true);
      toastSuccess(`Claim transaction confirmed! Your winnings have been deposited into your confidential balance.`, {
        id: 'claim-toast',
        title: 'PRIZE CLAIM CONFIRMED',
        duration: 7000,
      });
      if (account) {
        sessionStorage.setItem(`claimed_${drawParam}_${account.toLowerCase()}`, 'true');
        try {
          await fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userAddress: account,
              action: 'CLAIM',
              drawId: Number(drawParam),
              amount: decryptedWinnings,
              txHash: tx || ('0x' + '0'.repeat(64)),
            }),
          });
        } catch (e) {}

        try {
          const storageKey = `blindpot_activity_${account.toLowerCase()}`;
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          existing.unshift({
            id: `act-claim-${drawParam}-${Date.now()}`,
            userAddress: account.toLowerCase(),
            poolId: 'pool-usdc-sepolia-01',
            action: 'CLAIM',
            drawId: Number(drawParam),
            amount: decryptedWinnings,
            txHash: tx || ('0x' + '0'.repeat(64)),
            timestamp: Math.floor(Date.now() / 1000),
            status: 'CONFIRMED',
          });
          localStorage.setItem(storageKey, JSON.stringify(existing));
        } catch (_) {}
      }
    } catch (e: any) {
      console.error(e);
      toastError(e?.message || `Claim failed for Draw #${drawParam}.`, { id: 'claim-toast', title: 'CLAIM FAILED' });
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

        <div className="border-2 border-primary bg-surface-container-low p-8 mb-8 relative min-h-[180px] flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 19px, #000 19px, #000 20px)" }}></div>

          {!hasPermit && decryptedWinnings === undefined && (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="bg-primary text-surface px-6 py-3 font-value-mono text-xl tracking-widest hard-shadow-sm">
                SEALED CIPHERTEXT
              </div>
              <div className="font-label-mono text-xs uppercase text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Confidential Winnings Encrypted
              </div>
              <p className="text-xs text-on-surface-variant max-w-sm mt-2 font-mono">
                Sign with your wallet to privately check if you won this round.
              </p>
            </div>
          )}

          {(isDecrypting || isGrantingPermit) && decryptedWinnings === undefined && (
            <div className="font-value-mono text-lg text-secondary flex items-center gap-2">
              <CircularLoader size="md" />
              Checking Your Ticket...
            </div>
          )}

          {decryptedWinnings !== undefined && (
            <div className="flex flex-col items-center justify-center relative text-center">
              <div className="font-value-mono text-4xl md:text-5xl font-bold tracking-tight mb-2">
                {decryptedWinnings > 0 ? (
                  <span className="text-secondary">+{formatUSDC(decryptedWinnings)} USDC</span>
                ) : (
                  <span className="text-on-surface-variant">0.00 USDC</span>
                )}
              </div>

              <div className={`mt-2 font-label-mono text-xs uppercase px-3 py-1 font-bold border-2 ${
                decryptedWinnings > 0 
                  ? "bg-secondary text-primary border-primary" 
                  : "bg-surface-container-high text-error border-error"
              }`}>
                {decryptedWinnings > 0 ? "🏆 PRIZE CONFIRMED: YOU WON!" : "TRY AGAIN NEXT TIME: NON-WINNING TICKET"}
              </div>

              <p className="mt-4 text-xs font-mono text-on-surface-variant max-w-md leading-relaxed">
                {decryptedWinnings > 0
                  ? "Congratulations! You were selected as the winner for this round. Click below to claim your prize tokens directly into your wallet."
                  : "You did not win this round. Your deposited principal remains 100% safe and automatically rolls over into the next epoch draw!"}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t-2 border-primary">
          {!hasPermit && (
            <button
              onClick={onSignPermitClick}
              disabled={isGrantingPermit || isDecrypting}
              className="w-full sm:w-auto bg-surface text-primary border-2 border-primary px-6 py-3 font-label-mono text-xs uppercase font-bold hover:bg-surface-container-high hard-shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              {isGrantingPermit ? "Signing Permit..." : "Decrypt My Winnings"}
            </button>
          )}

          {isClaimed ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-secondary text-primary border-2 border-primary px-8 py-3 font-label-mono text-xs uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
              Prize Claimed · Return to Dashboard
            </Link>
          ) : decryptedWinnings !== undefined && decryptedWinnings > 0 ? (
            <button
              onClick={handleExecuteClaim}
              disabled={isClaiming}
              className="w-full sm:w-auto bg-secondary text-primary border-2 border-primary px-8 py-3 font-label-mono text-xs uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">emoji_events</span>
              {isClaiming ? "Submitting Claim..." : "Claim Prize Tokens"}
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-surface text-primary border-2 border-primary px-8 py-3 font-label-mono text-xs uppercase font-bold hover:bg-surface-container-high text-center hard-shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Return to Dashboard
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BlindpotYouWon() {
  return (
    <AuthGuard>
      <Navbar />
      <div className="md:pl-60 flex-grow flex flex-col">
        <Suspense fallback={
          <div className="pt-32 pb-32 px-4 flex justify-center items-center">
            <DossierLoader
              label="AUTHENTICATING WINNING DOSSIER..."
              sublabel="VERIFYING ON-CHAIN FHE TICKETS"
            />
          </div>
        }>
          <YouWonContent />
        </Suspense>
        <Footer />
      </div>
    </AuthGuard>
  );
}
