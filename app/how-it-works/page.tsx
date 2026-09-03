"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { LandingNavbar } from '../components/LandingNavbar';

export default function BlindpotHowItWorks() {
  return (
    <>
      <LandingNavbar />

      <main className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop pt-24 pb-20">
        <header className="mb-12 border-b-2 border-primary pb-6">
          <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-1">Architecture Dossier</div>
          <h1 className="font-headline-lg text-2xl md:text-3xl text-primary uppercase font-bold">Pool Architecture &amp; Mechanics</h1>
          <p className="font-value-mono text-xs text-on-surface-variant mt-2 uppercase tracking-widest">Document Ref: BPT-HIW-001 · Morpho Blue Engine · Zama FHEVM</p>
        </header>

        {/* SECTION 1: NO-LOSS SAVINGS */}
        <section className="mb-8 border-2 border-primary bg-surface p-6 hard-shadow-primary">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
            <span className="font-stamp-text text-stamp-text text-error border border-error px-2 py-0.5 text-xs">§ 01</span>
            <h2 className="font-headline-md text-lg text-primary uppercase font-bold">100% No-Loss Principal Guarantee</h2>
          </div>
          <p className="font-body-md text-sm text-on-surface mb-3 leading-relaxed">
            Deposit USDC into the shared <strong>BlindpotVault</strong>. Your principal is automatically wrapped into confidential ERC-7984 tokens (<code className="bg-surface px-1 text-xs">cUSDC</code>), granting you continuous entry tickets into every periodic prize epoch.
          </p>
          <p className="font-body-md text-sm text-on-surface leading-relaxed">
            Unlike traditional lotteries where ticket costs are lost forever, your principal is <strong>never touched or risked</strong>. You can withdraw 100% of your deposited funds at any moment with <strong>zero lockups, zero exit fees, and zero loss</strong>.
          </p>
        </section>

        {/* SECTION 2: YIELD ENGINE & SUSTAINABLE PROTOCOL ECONOMICS */}
        <section className="mb-8 border-2 border-primary bg-surface p-6 hard-shadow-primary">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
            <span className="font-stamp-text text-stamp-text text-error border border-error px-2 py-0.5 text-xs">§ 02</span>
            <h2 className="font-headline-md text-lg text-primary uppercase font-bold">Morpho Blue Yield &amp; Sustainable Revenue</h2>
          </div>
          <p className="font-body-md text-sm text-on-surface mb-4 leading-relaxed">
            Blindpot operates on real decentralized lending yield, combined with a self-sustaining commercial business model:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4">
            <div className="border border-primary/40 bg-surface-container-low p-4">
              <div className="font-bold text-secondary uppercase mb-2">Morpho Blue Continuous Lending</div>
              <p className="text-on-surface-variant leading-relaxed">
                Pooled deposits generate low-risk lending interest on Morpho Blue (~3.99% base APY). Yield is harvested permissionlessly at the boundary of each 10-minute epoch.
              </p>
            </div>
            <div className="border border-primary/40 bg-surface-container-low p-4">
              <div className="font-bold text-primary uppercase mb-2">Sustainable Economic Split</div>
              <p className="text-on-surface-variant leading-relaxed">
                A <strong>10% Protocol Take Rate</strong> accrues to the Blindpot DAO Treasury to fund keeper automation gas and protocol growth; <strong>90% + Floor Subsidy</strong> forms the dynamic prize pot.
              </p>
            </div>
          </div>
          <div className="p-3 bg-surface border border-primary/20 text-xs font-mono text-on-surface-variant">
            <span className="text-secondary font-bold">Protocol Invariant:</span> No draw ever pays out zero or dust. An autonomous floor reserve guarantees meaningful prize rewards during testnet cold-starts.
          </div>
        </section>

        {/* SECTION 3: CONFIDENTIALITY & WHY ZAMA FHEVM */}
        <section className="mb-8 border-2 border-primary bg-surface p-6 hard-shadow-primary">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
            <span className="font-stamp-text text-stamp-text text-error border border-error px-2 py-0.5 text-xs">§ 03</span>
            <h2 className="font-headline-md text-lg text-primary uppercase font-bold">Confidentiality: Why Zama fhEVM?</h2>
          </div>
          <p className="font-body-md text-sm text-on-surface mb-4 leading-relaxed">
            Public prize protocols expose every depositor's wallet balance and win odds. This intimidates retail savers, leaks personal net worth, and paints targets on winners for hackers and phishing drainers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="border border-error/40 bg-error-container/20 p-4">
              <div className="font-bold text-error uppercase mb-2">Transparent Pools (Leaky)</div>
              <ul className="space-y-1 text-on-surface-variant">
                <li>• Individual deposit size: <span className="text-error font-bold">PUBLIC</span></li>
                <li>• Exact win probability: <span className="text-error font-bold">PUBLIC</span></li>
                <li>• Losing user balances: <span className="text-error font-bold">EXPOSED</span></li>
                <li>• Winner wallet address: <span className="text-error font-bold">DOXXED ON ETHERSCAN</span></li>
              </ul>
            </div>

            <div className="border border-primary bg-surface-container-low p-4">
              <div className="font-bold text-primary uppercase mb-2">Blindpot Pool (fhEVM)</div>
              <ul className="space-y-1 text-primary">
                <li>• Individual deposit size: <span className="font-bold">ENCRYPTED (euint64)</span></li>
                <li>• Exact win probability: <span className="font-bold">SEALED ON-CHAIN</span></li>
                <li>• Losing user balances: <span className="font-bold">PERMANENTLY PRIVATE</span></li>
                <li>• Winner wallet address: <span className="font-bold">SEALED IN CIPHERTEXT</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW DRAWS WORK */}
        <section className="mb-8 border-2 border-primary bg-surface p-6 hard-shadow-primary">
          <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
            <span className="font-stamp-text text-stamp-text text-error border border-error px-2 py-0.5 text-xs">§ 04</span>
            <h2 className="font-headline-md text-lg text-primary uppercase font-bold">How the Draws Work (Simple &amp; Fair)</h2>
          </div>
          <div className="space-y-3 font-body-md text-sm text-on-surface leading-relaxed">
            <div className="p-3 border border-primary/20 bg-surface-container-low flex items-start gap-3">
              <span className="font-mono font-bold text-primary">01</span>
              <div>
                <strong>Fair, Automated Draws:</strong> Every round, a winner is picked automatically and provably fairly using private on-chain randomness. The more you save, the more prize tickets you receive, but every single ticket has a chance to win.
              </div>
            </div>

            <div className="p-3 border border-primary/20 bg-surface-container-low flex items-start gap-3">
              <span className="font-mono font-bold text-primary">02</span>
              <div>
                <strong>100% Secret Winner Selection:</strong> The winner is selected purely inside encrypted math. Nobody watching the blockchain, not even the app creators, can see who won.
              </div>
            </div>

            <div className="p-3 border border-primary/20 bg-surface-container-low flex items-start gap-3">
              <span className="font-mono font-bold text-primary">03</span>
              <div>
                <strong>Private Prize Claims:</strong> When you claim your winnings, the transfer is encrypted. Outside observers watching the network cannot tell if you claimed 50 USDC or 0 USDC, keeping your wallet safe from hackers.
              </div>
            </div>

            <div className="p-3 border border-primary/20 bg-surface-container-low flex items-start gap-3">
              <span className="font-mono font-bold text-primary">04</span>
              <div>
                <strong>Instant Results in Your Dossier:</strong> Open the Winning Dossier anytime to check your results with a simple, free signature. If you won, claim your prize directly into your wallet. If not, your funds stay 100% safe and automatically enter the next draw.
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
          © BLINDPOT POOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-xs uppercase">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/faucet" className="hover:underline">Faucet</Link>
        </div>
      </footer>
    </>
  );
}
