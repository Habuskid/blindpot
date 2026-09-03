"use client";

import React from "react";
import Link from "next/link";

export function Footer({ simple = false, minimal = false }: { simple?: boolean; minimal?: boolean }) {
  if (minimal) {
    return (
      <footer className="w-full py-6 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center border-t-2 border-primary bg-surface mt-auto">
        <div className="font-label-mono text-xs font-bold text-primary tracking-wider">
          © BLINDPOT POOL. ALL RIGHTS RESERVED.
        </div>
        <div className="font-label-mono text-[11px] text-on-surface-variant uppercase mt-1">
          Zama fhEVM · Morpho Blue · Sepolia Testnet
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full py-6 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center border-t-2 border-primary bg-surface mt-auto gap-4">
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <div className="font-label-mono text-xs font-bold text-primary tracking-wider">
          © BLINDPOT POOL. ALL RIGHTS RESERVED.
        </div>
        <div className="font-label-mono text-[11px] text-on-surface-variant uppercase mt-0.5">
          Zama fhEVM · Morpho Blue · Sepolia Testnet
        </div>
      </div>

      <nav aria-label="Footer Navigation" className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 font-label-mono text-xs uppercase text-primary">
        <Link
          href="/how-it-works"
          className="hover:underline hover:text-secondary transition-colors underline-offset-4"
        >
          Documentation
        </Link>
        <span className="text-on-surface-variant/40 select-none">•</span>
        <Link
          href="/faucet"
          className="hover:underline hover:text-secondary transition-colors underline-offset-4"
        >
          Testnet Faucet
        </Link>
        <span className="text-on-surface-variant/40 select-none">•</span>
        <Link
          href="/history"
          className="hover:underline hover:text-secondary transition-colors underline-offset-4"
        >
          Draw Log
        </Link>
        {!simple && (
          <>
            <span className="text-on-surface-variant/40 select-none">•</span>
            <Link
              href="/dashboard"
              className="hover:underline hover:text-secondary transition-colors underline-offset-4"
            >
              Dashboard
            </Link>
            <span className="text-on-surface-variant/40 select-none">•</span>
            <Link
              href="/pools"
              className="hover:underline hover:text-secondary transition-colors underline-offset-4"
            >
              Pools
            </Link>
          </>
        )}
      </nav>
    </footer>
  );
}
