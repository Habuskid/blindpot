"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Navbar } from './components/Navbar';

export default function BlindpotLandingPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect } = useConnect();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <>
      <Navbar />

      <main className="flex-grow pt-[72px] flex flex-col">
        <section className="flex flex-col md:flex-row hairline-b min-h-[60vh]">
          <div className="w-full md:w-[60%] p-margin-mobile md:p-margin-desktop flex flex-col justify-center hairline-r relative bg-surface">
            <div className="font-stamp-text text-stamp-text text-error opacity-75 mb-2 inline-block">
              CONFIDENTIAL PRIZE SAVINGS PROTOCOL
            </div>
            <h1 className="font-headline-lg text-headline-lg uppercase text-primary max-w-3xl mb-gutter break-words leading-none">
              YOUR SAVINGS.<br />
              <span className="hairline-t inline-block w-full mt-2 pt-2">SEALED FROM EVERYONE.</span><br />
              EVEN US.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-margin-desktop">
              Cryptographic stealth deposits that shield your balances and win odds from public ledgers with Fully Homomorphic Encryption (FHE). Withdraw your full principal at any time without fees or loss.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  if (isConnected) {
                    router.push('/dashboard');
                  } else {
                    connect({ connector: injected() });
                  }
                }}
                className="bg-secondary-container text-primary font-label-mono text-label-mono uppercase px-6 py-3 text-base font-bold border-2 border-primary hard-shadow-primary hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                {isConnected ? "Go to Dashboard" : "Connect & Launch"}
              </button>
              <Link
                href="/how-it-works"
                className="bg-surface text-primary font-label-mono text-label-mono uppercase px-6 py-3 text-base border-2 border-primary hard-shadow-sm hover:bg-surface-container-high transition-colors"
              >
                How It Works
              </Link>
            </div>

            <div className="absolute top-4 right-4 font-stamp-text text-stamp-text text-error opacity-50 hidden sm:block">
              REF: BP-S4-BOUNTY
            </div>
          </div>

          <div className="w-full md:w-[40%] bg-surface-container-high p-margin-mobile md:p-margin-desktop flex flex-col justify-center items-center relative overflow-hidden group">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(15, 15, 18, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 15, 18, 0.5) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
            
            <div className="z-10 bg-surface border-2 border-primary p-gutter hard-shadow-lg w-full max-w-sm cursor-pointer">
              <div className="font-label-mono text-label-mono uppercase border-b-2 border-primary pb-2 mb-4 flex justify-between items-center">
                <span className="font-bold">ON-CHAIN LEDGER</span>
                <span className="text-error text-xs font-mono">FHE ENCRYPTED</span>
              </div>
              <div className="space-y-4 font-value-mono text-value-mono relative">
                <div className="flex justify-between items-center hairline-b pb-2">
                  <span className="font-bold">DEPOSIT</span>
                  <div className="relative w-32 h-6 flex justify-end items-center">
                    <div className="w-full h-5 bg-primary text-center text-surface text-xs leading-5 uppercase tracking-widest">
                      ████████
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center hairline-b pb-2">
                  <span className="font-bold">WIN ODDS</span>
                  <div className="relative w-28 h-6 flex justify-end items-center">
                    <div className="w-full h-5 bg-primary text-center text-surface text-xs leading-5 uppercase tracking-widest">
                      ███████
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">PRIZE POT</span>
                  <div className="relative w-24 h-6 flex justify-end items-center">
                    <span className="text-secondary font-bold">$1,000.00</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-primary/20 text-center font-label-mono text-[11px] text-on-surface-variant uppercase">
                Hover to view client-side decryption
              </div>
            </div>
          </div>
        </section>

        <div className="w-full bg-primary text-surface py-2.5 px-margin-mobile md:px-margin-desktop flex justify-center items-center font-label-mono text-label-mono uppercase text-xs tracking-widest text-center">
          Built on Zama Protocol (fhEVM) · ERC-7984 Confidential Tokens · Sepolia Testnet
        </div>

        <section className="border-b-2 border-primary bg-surface">
          <div className="font-headline-md text-headline-md font-bold px-margin-mobile md:px-margin-desktop py-gutter hairline-b uppercase">
            OPERATIONAL CYCLE
          </div>
          <div className="flex flex-col md:flex-row w-full font-label-mono text-label-mono">
            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">01</div>
              <div className="uppercase mb-2 font-bold text-primary">DEPOSIT</div>
              <div className="font-body-md text-sm text-on-surface-variant">Wrap ERC-20 into ERC-7984 confidential balance on fhEVM.</div>
            </div>

            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">02</div>
              <div className="uppercase mb-2 font-bold text-primary">HOLD</div>
              <div className="font-body-md text-sm text-on-surface-variant">Balances remain homomorphically encrypted while earning prize tickets.</div>
            </div>

            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">03</div>
              <div className="uppercase mb-2 font-bold text-primary">DRAW</div>
              <div className="font-body-md text-sm text-on-surface-variant">On-chain FHE randomness picks winner weighted by encrypted tickets.</div>
            </div>

            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">04</div>
              <div className="uppercase mb-2 font-bold text-primary">CLAIM</div>
              <div className="font-body-md text-sm text-on-surface-variant">Winners claim prize via blinded conditional FHE transfer.</div>
            </div>

            <div className="flex-1 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">05</div>
              <div className="uppercase mb-2 font-bold text-primary">WITHDRAW</div>
              <div className="font-body-md text-sm text-on-surface-variant">Withdraw full principal at any time without fees or loss.</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-label-mono font-bold text-primary mb-4 md:mb-0">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 font-label-mono text-label-mono uppercase text-xs">
          <Link href="/how-it-works" className="hover:underline">Documentation</Link>
          <Link href="/faucet" className="hover:underline">Testnet Faucet</Link>
          <Link href="/history" className="hover:underline">Draw Log</Link>
        </div>
      </footer>
    </>
  );
}
