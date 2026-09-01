"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const isPublicPage = pathname === "/" || pathname === "/how-it-works";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "space_dashboard" },
    { href: "/pools", label: "Pools Directory", icon: "view_list" },
    { href: "/deposit", label: "Deposit USDC", icon: "add_circle" },
    { href: "/withdraw", label: "Withdraw Principal", icon: "arrow_upward" },
    { href: "/history", label: "Draw Audit Log", icon: "history" },
    { href: "/faucet", label: "Testnet Faucet", icon: "water_drop" },
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // If on landing or how-it-works page, show clean minimal public header (NO pages bar)
  if (isPublicPage) {
    return (
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 bg-surface border-b-2 border-primary">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Blindpot" className="h-10 md:h-12 w-auto mix-blend-multiply" />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/how-it-works"
            className={`font-label-mono text-xs uppercase px-3 py-1.5 border hidden sm:inline-block ${
              pathname === "/how-it-works"
                ? "bg-primary text-surface font-bold border-primary"
                : "text-on-surface hover:bg-surface-container-high border-transparent"
            }`}
          >
            How It Works
          </Link>

          {isConnected ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-secondary-container text-primary border-2 border-primary px-4 py-1.5 text-xs font-label-mono uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">space_dashboard</span>
              Open App
            </button>
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

  // Inside the dApp: Clean Sidebar layout + Top Bar
  return (
    <>
      {/* Top Bar for dApp */}
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 md:px-8 py-3 bg-surface border-b-2 border-primary md:pl-[256px]">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1 border-2 border-primary bg-surface-container-low hover:bg-surface-container-high"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>

          <span className="font-label-mono text-xs uppercase font-bold text-on-surface-variant hidden sm:inline-block">
            Ethereum Sepolia (11155111)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isWrongNetwork && (
            <button
              onClick={() => switchChain({ chainId: sepolia.id })}
              className="bg-error text-surface px-3 py-1 text-xs font-label-mono uppercase border-2 border-primary animate-pulse flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Switch Network
            </button>
          )}

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="font-value-mono text-xs px-2.5 py-1 bg-surface-container-low border border-primary font-bold">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="bg-secondary-container text-primary border-2 border-primary px-3 py-1 text-xs font-label-mono uppercase hard-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 font-bold"
                title="Disconnect Wallet"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: injected() })}
              className="bg-secondary-container text-primary border-2 border-primary px-4 py-1.5 text-xs font-label-mono uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              Connect
            </button>
          )}
        </div>
      </header>

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-60 bg-surface border-r-2 border-primary flex flex-col justify-between p-4 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between border-b-2 border-primary pb-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Blindpot" className="h-9 w-auto mix-blend-multiply" />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 text-primary hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <div className="font-label-mono text-[10px] uppercase text-on-surface-variant font-bold px-2 mb-1 tracking-wider">
              Navigation
            </div>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 font-label-mono text-xs uppercase font-bold border transition-all ${
                    isActive
                      ? "bg-primary text-surface border-primary hard-shadow-sm"
                      : "text-on-surface bg-surface hover:bg-surface-container-high border-transparent hover:border-primary/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t-2 border-primary pt-3 flex flex-col gap-2">
          <div className="p-2.5 bg-surface-container-low border border-primary/40 text-[11px] font-label-mono text-on-surface-variant flex flex-col gap-0.5">
            <div className="flex items-center gap-1 font-bold text-primary">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span>
              Zama fhEVM Active
            </div>
            <div className="text-[10px]">ERC-7984 · Sepolia</div>
          </div>
          <div className="text-[10px] font-label-mono text-on-surface-variant text-center uppercase">
            Blindpot Protocol
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-primary/40 backdrop-blur-[1px] z-40 md:hidden"
        />
      )}
    </>
  );
}
