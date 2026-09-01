"use client";

import React from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

interface WalletGateProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  actionName?: string;
}

export function WalletGate({
  children,
  title = "Wallet Authentication Required",
  description = "This terminal interacts directly with confidential ERC-7984 handles and on-chain FHE computations on Ethereum Sepolia. Connect your wallet to access this protocol terminal.",
  actionName = "Connect Web3 Wallet",
}: WalletGateProps) {
  const { isConnected, isConnecting } = useAccount();
  const { connect, isPending } = useConnect();

  if (isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="w-full flex items-center justify-center py-10 md:py-16">
      <div className="w-full max-w-md bg-surface border-2 border-primary p-8 hard-shadow-lg flex flex-col items-center text-center relative">
        <div className="absolute top-0 right-0 p-2 border-l-2 border-b-2 border-primary bg-surface-container-low font-label-mono text-[10px] uppercase font-bold text-error">
          AUTHENTICATION REQUIRED
        </div>

        <div className="w-16 h-16 bg-surface-container-low border-2 border-primary flex items-center justify-center mb-6 hard-shadow-sm">
          <span className="material-symbols-outlined text-3xl text-primary">lock</span>
        </div>

        <div className="font-stamp-text text-xs text-error border border-error px-2.5 py-0.5 mb-3 uppercase font-bold tracking-wider">
          STATUS: SEALED CIPHERTEXT
        </div>

        <h2 className="font-headline-md text-2xl uppercase font-bold text-primary mb-2">
          {title}
        </h2>

        <p className="font-body-md text-xs text-on-surface-variant max-w-sm mb-6 leading-relaxed">
          {description}
        </p>

        <button
          onClick={() => connect({ connector: injected() })}
          disabled={isPending || isConnecting}
          className="w-full bg-secondary-container text-primary border-2 border-primary font-label-mono uppercase py-4 font-bold text-sm hard-shadow-primary hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          {isPending || isConnecting ? "Connecting..." : actionName}
        </button>

        <div className="mt-6 pt-4 border-t border-primary/20 flex flex-wrap justify-center gap-4 text-[11px] font-label-mono text-on-surface-variant uppercase">
          <span>Ethereum Sepolia</span>
          <span>•</span>
          <span>ERC-7984</span>
          <span>•</span>
          <span>Zama fhEVM</span>
        </div>
      </div>
    </div>
  );
}
