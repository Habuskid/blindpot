"use client";

import React from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

interface WalletGateProps {
  title?: string;
  description?: string;
  actionName?: string;
}

export function WalletGate({
  title = "Wallet Authentication Required",
  description = "This terminal interacts with encrypted FHE handles on Ethereum Sepolia. Connect your Web3 wallet to access confidential balances, execute deposits, or withdraw principal.",
  actionName = "Connect Wallet to Continue",
}: WalletGateProps) {
  const { isConnected } = useAccount();
  const { connect, isPending } = useConnect();

  if (isConnected) return null;

  return (
    <div className="w-full border-2 border-primary bg-surface p-8 hard-shadow-lg flex flex-col items-center text-center my-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 border-l-2 border-b-2 border-primary bg-surface-container-low font-label-mono text-[10px] uppercase font-bold text-error">
        RESTRICTED TERMINAL
      </div>

      <div className="w-14 h-14 bg-surface-container-low border-2 border-primary flex items-center justify-center mb-4 hard-shadow-sm">
        <span className="material-symbols-outlined text-3xl text-primary">lock</span>
      </div>

      <div className="font-stamp-text text-xs text-error border border-error px-2 py-0.5 mb-2 uppercase font-bold tracking-wider">
        STATUS: SEALED CIPHERTEXT
      </div>

      <h2 className="font-headline-md text-xl md:text-2xl uppercase font-bold text-primary mb-2">
        {title}
      </h2>

      <p className="font-body-md text-xs md:text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        className="bg-secondary-container text-primary border-2 border-primary font-label-mono uppercase px-8 py-3.5 font-bold text-sm hard-shadow-primary hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
        {isPending ? "Connecting..." : actionName}
      </button>

      <div className="mt-6 pt-4 border-t border-primary/20 flex flex-wrap justify-center gap-4 text-[11px] font-label-mono text-on-surface-variant uppercase">
        <span>Network: Ethereum Sepolia</span>
        <span>•</span>
        <span>Chain ID: 11155111</span>
        <span>•</span>
        <span>Standard: ERC-7984</span>
      </div>
    </div>
  );
}
