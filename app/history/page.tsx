"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useClaim } from '../../sdk/src/claim';
import { addresses } from '../../sdk/src/config';
import { Navbar } from '../components/Navbar';

const VAULT_ADDRESS = addresses.vault;

const vaultAbi = [
  {
    type: 'function',
    name: 'currentDrawId',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  }
] as const;

export default function BlindpotDrawHistory() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { claim, isPending } = useClaim();
  const [claimingDraw, setClaimingDraw] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: currentDrawId } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
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
    if (!isConnected) {
      connect({ connector: injected() });
      return;
    }
    setClaimingDraw(drawId);
    setErrorMsg(null);
    setStatusMsg(`Submitting blinded claim transaction for Draw #${drawId}...`);

    try {
      await claim(VAULT_ADDRESS, BigInt(drawId));
      setStatusMsg(`🎉 Claim transaction confirmed for Draw #${drawId}! If you were the winner, your prize has been transferred into your confidential balance.`);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || `Claim failed for Draw #${drawId}. Make sure the draw has finalized.`);
      setStatusMsg(null);
    } finally {
      setClaimingDraw(null);
    }
  };

  return (
    <>
      <Navbar />

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
                Array.from({ length: totalDraws }).map((_, idx) => {
                  const drawNum = (totalDraws - idx).toString();
                  const isClaimingThis = isPending && claimingDraw === drawNum;

                  return (
                    <tr key={drawNum} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-3.5 border-r border-primary/20 font-bold">
                        #{drawNum}
                      </td>
                      <td className="p-3.5 border-r border-primary/20 font-mono text-xs">
                        FHE.randEuint32 (deposit-weighted)
                      </td>
                      <td className="p-3.5 border-r border-primary/20">
                        <span className="bg-primary text-surface text-[11px] px-2 py-0.5 uppercase tracking-wider font-bold">
                          SEALED eaddress
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-primary/20 text-center">
                        <button
                          className="bg-secondary-container text-primary border border-primary px-3.5 py-1 text-xs font-label-mono uppercase font-bold hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
                          onClick={() => handleClaim(drawNum)}
                          disabled={isClaimingThis}
                        >
                          {isClaimingThis ? "Claiming..." : !isConnected ? "Connect to Claim" : "Claim"}
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <Link
                          href={`/you-won?draw=${drawNum}`}
                          className="text-primary hover:text-secondary font-label-mono text-xs uppercase underline"
                        >
                          View Dossier
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
    </>
  );
}
