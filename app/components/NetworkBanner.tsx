"use client";

import React from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  if (!isWrongNetwork) return null;

  return (
    <div className="bg-error-container border-2 border-error text-error p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono hard-shadow-sm w-full">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]">warning</span>
        <span>
          <strong>UNSUPPORTED NETWORK:</strong> Please switch your wallet to <strong>Ethereum Sepolia Testnet</strong> (Chain ID 11155111).
        </span>
      </div>
      <button
        onClick={() => switchChainAsync({ chainId: sepolia.id })}
        className="w-full sm:w-auto bg-error text-surface px-4 py-2 uppercase font-bold text-xs hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Switch to Sepolia
      </button>
    </div>
  );
}
