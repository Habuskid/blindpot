"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useAccount();
  const { connect, isPending } = useConnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-label-mono text-xs uppercase">
        <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
      </div>
    );
  }

  // If user is NOT connected, show full-screen Wallet Authentication Gate
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between">
        {/* Minimal Gate Header */}
        <header className="w-full flex justify-between items-center px-6 py-4 border-b-2 border-primary bg-surface">
          <Link href="/">
            <img src="/logo.png" alt="Blindpot" className="h-10 w-auto mix-blend-multiply" />
          </Link>
          <Link
            href="/"
            className="font-label-mono text-xs uppercase font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Return to Home
          </Link>
        </header>

        {/* Central Login Card */}
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border-2 border-primary p-8 hard-shadow-lg flex flex-col items-center text-center relative">
            <div className="absolute top-0 right-0 p-2 border-l-2 border-b-2 border-primary bg-surface-container-low font-label-mono text-[10px] uppercase font-bold text-error">
              AUTHENTICATION REQUIRED
            </div>

            <div className="w-16 h-16 bg-surface-container-low border-2 border-primary flex items-center justify-center mb-6 hard-shadow-sm">
              <span className="material-symbols-outlined text-3xl text-primary">lock</span>
            </div>

            <h1 className="font-headline-md text-2xl uppercase font-bold text-primary mb-2">
              WALLET LOGIN REQUIRED
            </h1>

            <p className="font-body-md text-xs text-on-surface-variant mb-6 max-w-sm leading-relaxed">
              This terminal interacts directly with confidential ERC-7984 handles and on-chain FHE computations on Ethereum Sepolia. Connect your wallet to access the protocol.
            </p>

            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isPending || isConnecting}
              className="w-full bg-secondary-container text-primary border-2 border-primary font-label-mono uppercase py-4 font-bold text-sm hard-shadow-primary hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              {isPending || isConnecting ? "Connecting..." : "Connect Web3 Wallet"}
            </button>

            <div className="mt-6 pt-4 border-t border-primary/20 flex justify-center gap-4 text-[11px] font-label-mono text-on-surface-variant uppercase">
              <span>Ethereum Sepolia</span>
              <span>•</span>
              <span>Chain ID: 11155111</span>
              <span>•</span>
              <span>Zama fhEVM</span>
            </div>
          </div>
        </main>

        <footer className="w-full py-4 px-6 border-t-2 border-primary bg-surface text-center font-label-mono text-xs font-bold uppercase">
          © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </footer>
      </div>
    );
  }

  // When authenticated, render full dApp layout and page
  return <>{children}</>;
}
