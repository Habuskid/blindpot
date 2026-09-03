"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { BLINDPOT_VAULT_ABI } from '../../sdk/src/abi';
import { formatTimestamp } from '../../lib/formatters';
import { Navbar } from '../components/Navbar';
import { AuthGuard } from '../components/AuthGuard';
import { CipherSpinner } from '../components/BlindpotLoader';

const VAULT_ADDRESS = addresses.vault;

export default function BlindpotDrawHistory() {
  const { isConnected } = useAccount();
  const { claim, isPending } = useClaim();
  const [claimingDraw, setClaimingDraw] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: currentDrawId } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: BLINDPOT_VAULT_ABI,
    functionName: 'currentDrawId',
  });

  const [dbDraws, setDbDraws] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/draws')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.draws) {
          setDbDraws(data.draws);
        }
      })
      .catch((e) => console.warn('Draws fetch error:', e));
  }, []);

  const totalDraws = Math.max(
    currentDrawId !== undefined ? Number(currentDrawId) : 0,
    dbDraws.length
  );

  const handleClaim = async (drawId: string) => {
    setClaimingDraw(drawId);
    setErrorMsg(null);
    setStatusMsg(`Submitting blinded claim transaction for Draw #${drawId}...`);

    try {
      await claim(VAULT_ADDRESS, BigInt(drawId));
      setStatusMsg(`Claim transaction confirmed for Draw #${drawId}. If you were the winner, your prize has been transferred into your confidential balance.`);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || `Claim failed for Draw #${drawId}. Make sure the draw has finalized.`);
      setStatusMsg(null);
    } finally {
      setClaimingDraw(null);
    }
  };

  return (
    <AuthGuard>
      <Navbar />

      <div className="md:pl-60 flex-grow flex flex-col">
        <main className="flex-grow pt-24 md:pt-28 pb-20 px-margin-mobile md:px-margin-desktop max-w-[1100px] mx-auto w-full">
        <div className="mb-8 border-2 border-primary bg-surface p-6 md:p-8 hard-shadow-primary">
          <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-1">Protocol Audit Log</div>
          <h1 className="font-headline-lg text-2xl md:text-3xl text-primary uppercase border-b-2 border-primary pb-2 mb-4 tracking-tighter">
            DRAW HISTORY &amp; CLAIM DOSSIER
          </h1>
          <div className="font-label-mono text-xs text-on-surface-variant uppercase bg-surface-container-low border border-primary border-dashed p-3 leading-relaxed">
            <span className="text-primary font-bold">PUBLIC DISCLOSURE:</span> DRAW ID · BLOCK TIMESTAMP · AGGREGATE POT.<br />
            <span className="text-error font-bold">SEALED IN CIPHERTEXT:</span> WINNER IDENTITY · LOSING BALANCES · CLAIM AMOUNTS.
          </div>
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

        <div className="border-2 border-primary bg-surface hard-shadow-primary overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-primary bg-surface-container font-label-mono text-xs text-primary uppercase tracking-widest">
                <th className="p-3.5 border-r border-primary/20">Draw #</th>
                <th className="p-3.5 border-r border-primary/20">Winner Selection</th>
                <th className="p-3.5 border-r border-primary/20">Confidentiality</th>
                <th className="p-3.5 border-r border-primary/20 text-center">Action</th>
                <th className="p-3.5 text-center">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/20 font-value-mono text-sm">
              {totalDraws === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant font-label-mono text-xs uppercase">
                    No on-chain draws recorded yet. Participate in the active pool on the dashboard!
                  </td>
                </tr>
              ) : (
                Array.from({ length: totalDraws }).map((_, index) => {
                  const drawIdNum = totalDraws - index;
                  const drawId = drawIdNum.toString();
                  const isCurrent = drawIdNum === Number(currentDrawId);
                  const isClaiming = isPending && claimingDraw === drawId;

                  return (
                    <tr key={drawId} className="border-b border-primary/10 hover:bg-surface-container-low transition-colors">
                      <td className="p-3.5 font-bold border-r border-primary/20">
                        #{drawId} {isCurrent && <span className="text-[10px] bg-secondary-container text-primary border border-secondary px-1.5 py-0.5 ml-1">ACTIVE</span>}
                      </td>
                      <td className="p-3.5 border-r border-primary/20">
                        <span className="font-label-mono text-xs bg-surface-container-high px-2 py-0.5 border border-primary/20">
                          FHE.randEuint32
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-primary/20 text-xs font-label-mono text-error">
                        SEALED
                      </td>
                      <td className="p-3.5 text-center border-r border-primary/20">
                        <button
                          onClick={() => handleClaim(drawId)}
                          disabled={isClaiming}
                          className="bg-primary text-surface font-label-mono text-xs uppercase px-3 py-1.5 font-bold hard-shadow-sm hover:opacity-90 active:shadow-none transition-all disabled:opacity-50"
                        >
                          {isClaiming ? "Claiming..." : "Blinded Claim"}
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <Link
                          href={`/you-won?drawId=${drawId}`}
                          className="font-label-mono text-xs text-secondary font-bold underline hover:text-primary"
                        >
                          Decrypt Dossier →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pl-4 border-l-2 border-primary/40">
          <p className="font-body-md text-xs text-on-surface-variant italic">
            * Blinded Claiming: Anyone can call claim, but the smart contract uses `FHE.select` to conditionally transfer funds without revealing whether the claimer actually won or received 0 tokens.
          </p>
        </div>
      </main>

      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold text-primary uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/how-it-works" className="hover:underline">Documentation</Link>
        </div>
      </footer>
      </div>
    </AuthGuard>
  );
}
