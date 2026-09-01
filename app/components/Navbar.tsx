"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pools", label: "Pools" },
    { href: "/deposit", label: "Deposit" },
    { href: "/withdraw", label: "Withdraw" },
    { href: "/history", label: "Draws" },
    { href: "/faucet", label: "Faucet" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 bg-surface border-b-2 border-primary">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Blindpot" className="h-10 md:h-12 w-auto mix-blend-multiply" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-label-mono text-xs uppercase px-3 py-1.5 border transition-all ${
                  isActive
                    ? "bg-primary text-surface font-bold border-primary"
                    : "text-on-surface hover:bg-surface-container-high border-transparent hover:border-primary/30"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {isWrongNetwork && (
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="bg-error text-surface px-3 py-1 text-xs font-label-mono uppercase border-2 border-primary animate-pulse flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Switch to Sepolia
          </button>
        )}

        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block font-value-mono text-xs px-2.5 py-1 bg-surface-container-low border border-primary">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={() => disconnect()}
              className="bg-secondary-container text-primary border-2 border-primary px-3 py-1 text-xs font-label-mono uppercase hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1"
              title="Disconnect Wallet"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              <span className="hidden md:inline">Disconnect</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            className="bg-secondary-container text-primary border-2 border-primary px-4 py-1.5 text-xs font-label-mono uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
