"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useReadContract } from 'wagmi';
import { ConnectAndSignButton } from "./components/ConnectAndSignButton";
import { injected } from 'wagmi/connectors';
import { addresses } from '../sdk/src/config';
import { LandingNavbar } from './components/LandingNavbar';

const vaultAbi = [
  {
    type: 'function',
    name: 'memberCount',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'currentDrawId',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextDrawTime',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
] as const;

export default function BlindpotLandingPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const { data: memberCount } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: vaultAbi,
    functionName: 'memberCount',
  });

  const { data: currentDrawId } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: vaultAbi,
    functionName: 'currentDrawId',
  });

  const { data: nextDrawTimeRaw } = useReadContract({
    address: addresses.vault as `0x${string}`,
    abi: vaultAbi,
    functionName: 'nextDrawTime',
  });

  const displayMembers = memberCount !== undefined ? Number(memberCount) : 0;
  const displayDrawId = currentDrawId !== undefined ? Number(currentDrawId) : 0;

  useEffect(() => {
    if (nextDrawTimeRaw === undefined) return;
    const target = Number(nextDrawTimeRaw);
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      setSecondsRemaining(Math.max(0, target - now));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextDrawTimeRaw]);

  const formatCountdown = (secs: number | null) => {
    if (secs === null) return "--:--";
    if (secs === 0) return "DRAW IMMINENT";
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <LandingNavbar />

      <main className="flex-grow pt-[72px] flex flex-col">
        {/* HERO SECTION */}
        <section className="flex flex-col md:flex-row hairline-b min-h-[60vh]">
          <div className="w-full md:w-[60%] p-margin-mobile md:p-margin-desktop flex flex-col justify-center hairline-r relative bg-surface">
            <div className="font-stamp-text text-stamp-text text-error opacity-80 mb-3 inline-block">
              CONFIDENTIAL PRIZE SAVINGS PROTOCOL · ZAMA FHEVM
            </div>
            <h1 className="font-headline-lg text-headline-lg uppercase text-primary max-w-3xl mb-gutter break-words leading-none">
              YOUR SAVINGS.<br />
              <span className="hairline-t inline-block w-full mt-2 pt-2">SEALED FROM EVERYONE.</span><br />
              EVEN US.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-margin-desktop leading-relaxed">
              Deposit into a confidential prize pool powered by Fully Homomorphic Encryption (FHE). Your balance, tickets, and odds remain completely private on-chain. Withdraw 100% of your principal at any time with zero loss and zero fees.
            </p>
            <div className="flex flex-wrap gap-4">
              <ConnectAndSignButton className="bg-secondary-container text-primary font-label-mono text-label-mono uppercase px-6 py-3.5 text-base font-bold border-2 border-primary hard-shadow-primary hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2" />
              <Link
                href="/how-it-works"
                className="bg-surface text-primary font-label-mono text-label-mono uppercase px-6 py-3.5 text-base border-2 border-primary hard-shadow-sm hover:bg-surface-container-high transition-colors flex items-center gap-1"
              >
                How It Works
              </Link>
            </div>

          </div>

          {/* LIVE ON-CHAIN PROTOCOL LEDGER CARD */}
          <div className="w-full md:w-[40%] bg-surface-container-high p-margin-mobile md:p-margin-desktop flex flex-col justify-center items-center relative overflow-hidden group">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(15, 15, 18, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 15, 18, 0.5) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
            
            <div className="z-10 bg-surface border-2 border-primary p-6 hard-shadow-lg w-full max-w-sm">
              <div className="font-label-mono text-xs uppercase border-b-2 border-primary pb-3 mb-4 flex justify-between items-center">
                <span className="font-bold">ON-CHAIN VAULT</span>
                <span className="text-error text-xs font-mono font-bold">FHE SEALED</span>
              </div>
              
              <div className="space-y-4 font-value-mono text-sm">
                <div className="flex justify-between items-center hairline-b pb-2">
                  <span className="font-label-mono text-xs text-on-surface-variant uppercase">Your Balance</span>
                  <div className="bg-primary text-surface text-xs px-2.5 py-1 font-mono tracking-widest">
                    ████████ USDC
                  </div>
                </div>

                <div className="flex justify-between items-center hairline-b pb-2">
                  <span className="font-label-mono text-xs text-on-surface-variant uppercase">Pool Capacity</span>
                  <span className="font-bold text-primary font-mono">
                    {displayMembers} / 25 Active
                  </span>
                </div>

                <div className="flex justify-between items-center hairline-b pb-2">
                  <span className="font-label-mono text-xs text-on-surface-variant uppercase">Active Epoch</span>
                  <span className="font-bold text-primary font-mono">
                    Round #{displayDrawId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-label-mono text-xs text-on-surface-variant uppercase">Next Draw</span>
                  <span className="font-bold text-secondary font-mono">
                    {formatCountdown(secondsRemaining)}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-primary/20 text-center font-label-mono text-[11px] text-on-surface-variant uppercase">
                Launch App to Decrypt Your Position
              </div>
            </div>
          </div>
        </section>

        {/* NETWORK STATUS BAR */}
        <div className="w-full bg-primary text-surface py-2.5 px-margin-mobile md:px-margin-desktop flex justify-center items-center font-label-mono text-label-mono uppercase text-xs tracking-widest text-center">
          Built on Zama Protocol (fhEVM) · ERC-7984 Confidential Tokens · Sepolia Testnet
        </div>

        {/* 5-STAGE OPERATIONAL LIFECYCLE */}
        <section className="border-b-2 border-primary bg-surface">
          <div className="font-headline-md text-headline-md font-bold px-margin-mobile md:px-margin-desktop py-gutter hairline-b uppercase flex justify-between items-center">
            <span>OPERATIONAL CYCLE</span>
            <span className="font-label-mono text-xs font-normal text-on-surface-variant">5-STAGE GUARANTEE</span>
          </div>
          <div className="flex flex-col md:flex-row w-full font-label-mono text-label-mono">
            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">01</div>
              <div className="uppercase mb-2 font-bold text-primary">DEPOSIT</div>
              <div className="font-body-md text-sm text-on-surface-variant">Wrap ERC-20 USDC into confidential ERC-7984 tokens on Zama fhEVM.</div>
            </div>

            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">02</div>
              <div className="uppercase mb-2 font-bold text-primary">HOLD</div>
              <div className="font-body-md text-sm text-on-surface-variant">Balances remain homomorphically encrypted while earning continuous prize tickets.</div>
            </div>

            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">03</div>
              <div className="uppercase mb-2 font-bold text-primary">DRAW</div>
              <div className="font-body-md text-sm text-on-surface-variant">On-chain FHE randomness selects winner proportionally with zero modulo gap.</div>
            </div>

            <div className="flex-1 border-b md:border-b-0 md:border-r border-primary/30 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">04</div>
              <div className="uppercase mb-2 font-bold text-primary">CLAIM</div>
              <div className="font-body-md text-sm text-on-surface-variant">Winners claim prize via blinded FHE.select conditional transfers.</div>
            </div>

            <div className="flex-1 p-gutter hover:bg-surface-container-high transition-colors">
              <div className="text-error mb-2 text-xl font-bold">05</div>
              <div className="uppercase mb-2 font-bold text-primary">WITHDRAW</div>
              <div className="font-body-md text-sm text-on-surface-variant">Withdraw 100% of deposited principal at any time without fees or loss.</div>
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
