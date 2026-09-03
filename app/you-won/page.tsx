"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useGetMyWinnings } from '../../sdk/src/getMyWinnings';
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { formatUSDC } from '../../lib/formatters';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { CipherSpinner, DossierLoader } from '../components/BlindpotLoader';

const VAULT_ADDRESS = addresses.vault;

function YouWonContent() {
  const searchParams = useSearchParams();
  const drawParam = searchParams.get('draw') || searchParams.get('drawId') || '1';
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
      setStatusMsg(`Claim transaction confirmed. If you won Draw #${drawParam}, your winnings have been deposited into your confidential balance.`);
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
                Sign with your connected wallet to decrypt your personal outcome via Zama KMS.
              </p>
            </div>
          )}

          {(isDecrypting || isGrantingPermit) && decryptedWinnings === undefined && (
            <div className="font-value-mono text-lg text-secondary flex items-center gap-2">
              <CipherSpinner size="md" />
              Decrypting Winnings with KMS...
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
                {decryptedWinnings > 0 ? "🏆 PRIZE CONFIRMED — YOU WON!" : "TRY AGAIN NEXT TIME — NON-WINNING TICKET"}
              </div>

              <p className="mt-4 text-xs font-mono text-on-surface-variant max-w-md leading-relaxed">
                {decryptedWinnings > 0
                  ? "Congratulations! Your ticket was chosen by FHE.randEuint32. Click below to claim your confidential tokens into your wallet."
                  : "You did not win this round. Your deposited principal remains 100% safe and automatically rolls over into the next epoch draw!"}
              </p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="bg-error-container border border-error text-error p-3 mb-6 text-xs font-mono break-words flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="bg-surface-container-high border border-primary text-primary p-3 mb-6 text-xs font-mono flex items-center gap-2">
            <CipherSpinner size="sm" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t-2 border-primary">
          {!hasPermit && (
            <button
              onClick={handleGrantPermit}
              disabled={isGrantingPermit || isDecrypting}
              className="w-full sm:w-auto bg-surface text-primary border-2 border-primary px-6 py-3 font-label-mono text-xs uppercase font-bold hover:bg-surface-container-high hard-shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              {isGrantingPermit ? "Signing Permit..." : "Decrypt My Winnings"}
            </button>
          )}

          {decryptedWinnings !== undefined && decryptedWinnings > 0 ? (
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
        <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
          <div className="font-label-mono text-xs font-bold uppercase">
            © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-6 font-label-mono text-xs uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/history" className="hover:underline">History</Link>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
