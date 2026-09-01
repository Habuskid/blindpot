"use client";

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';

export default function BlindpotHowItWorks() {
  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop pt-24 pb-20">
        <header className="mb-12 border-b-2 border-primary pb-6">
          <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-1">Architecture Dossier</div>
          <h1 className="font-headline-lg text-2xl md:text-3xl text-primary uppercase font-bold">Protocol Overview &amp; Mechanics</h1>
          <p className="font-value-mono text-xs text-on-surface-variant mt-2 uppercase tracking-widest">Document Ref: BPT-HIW-001</p>
        </header>

        <section className="mb-12 border-2 border-primary bg-surface p-6 hard-shadow-primary">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
            <span className="font-stamp-text text-stamp-text text-error border border-error px-2 py-0.5 text-xs">§ 01</span>
            <h2 className="font-headline-md text-lg text-primary uppercase font-bold">The No-Loss Prize Model</h2>
          </div>
          <p className="font-body-md text-sm text-on-surface mb-3 leading-relaxed">
            Deposit tokens into the shared <strong>BlindpotVault</strong>. Your deposit grants you entry tickets into periodic prize draws.
          </p>
          <p className="font-body-md text-sm text-on-surface leading-relaxed">
            If you do not win the draw, you keep 100% of your initial deposit. Principal is always withdrawable at any time with <strong>no locks, no fees, and zero loss</strong>.
          </p>
        </section>

        <section className="mb-12 border-2 border-primary bg-surface p-6 hard-shadow-primary">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
            <span className="font-stamp-text text-stamp-text text-error border border-error px-2 py-0.5 text-xs">§ 02</span>
            <h2 className="font-headline-md text-lg text-primary uppercase font-bold">Confidentiality: Why Zama fhEVM?</h2>
          </div>
          <p className="font-body-md text-sm text-on-surface mb-4 leading-relaxed">
            Standard blockchain lottery and prize-savings systems expose every user's exact balance, deposit size, and win odds on public explorers. This leaks net worth and invites MEV front-running.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="border border-error/40 bg-error-container/20 p-4">
              <div className="font-bold text-error uppercase mb-2">Transparent Protocol (Leaky)</div>
              <ul className="space-y-1 text-on-surface-variant">
                <li>• Individual deposit size: <span className="text-error font-bold">PUBLIC</span></li>
                <li>• Exact win probability: <span className="text-error font-bold">PUBLIC</span></li>
                <li>• Losing user balances: <span className="text-error font-bold">EXPOSED</span></li>
              </ul>
            </div>

            <div className="border border-primary bg-surface-container-low p-4">
              <div className="font-bold text-primary uppercase mb-2">Blindpot Protocol (fhEVM)</div>
              <ul className="space-y-1 text-primary">
                <li>• Individual deposit size: <span className="font-bold">ENCRYPTED (euint64)</span></li>
                <li>• Exact win probability: <span className="font-bold">SEALED ON-CHAIN</span></li>
                <li>• Losing user balances: <span className="font-bold">PERMANENTLY PRIVATE</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12 border-2 border-primary bg-surface p-6 hard-shadow-primary">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
            <span className="font-stamp-text text-stamp-text text-error border border-error px-2 py-0.5 text-xs">§ 03</span>
            <h2 className="font-headline-md text-lg text-primary uppercase font-bold">On-Chain FHE Draw Mechanics</h2>
          </div>
          <div className="space-y-3 font-body-md text-sm text-on-surface leading-relaxed">
            <div className="p-3 border border-primary/20 bg-surface-container-low flex items-start gap-3">
              <span className="font-mono font-bold text-primary">01</span>
              <div>
                <strong>Deposit-Weighted Randomness:</strong> Winner selection uses Zama's native on-chain FHE pseudo-random number generator (<code className="bg-surface px-1 text-xs">FHE.randEuint32</code>), mathematically scaled to the active ticket pool.
              </div>
            </div>

            <div className="p-3 border border-primary/20 bg-surface-container-low flex items-start gap-3">
              <span className="font-mono font-bold text-primary">02</span>
              <div>
                <strong>Encrypted Winner Selection:</strong> The winning address is computed over ciphertexts (<code className="bg-surface px-1 text-xs">eaddress</code>) using FHE conditional walks.
              </div>
            </div>

            <div className="p-3 border border-primary/20 bg-surface-container-low flex items-start gap-3">
              <span className="font-mono font-bold text-primary">03</span>
              <div>
                <strong>Blinded Claims:</strong> Claims execute via <code className="bg-surface px-1 text-xs">FHE.select</code>. Nobody observing the mempool can deduce who claimed winnings or who walked away with zero.
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center mt-8">
          <Link
            href="/dashboard"
            className="bg-secondary-container text-primary border-2 border-primary font-label-mono text-xs uppercase px-8 py-3.5 font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            Launch App
          </Link>
        </div>
      </main>

      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/faucet" className="hover:underline">Faucet</Link>
        </div>
      </footer>
    </>
  );
}
