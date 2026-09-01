"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { ConnectAndSignButton } from "./ConnectAndSignButton";
import { injected } from "wagmi/connectors";

export function LandingNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect, isPending } = useConnect();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 bg-surface border-b-2 border-primary">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="Blindpot" className="h-10 md:h-12 w-auto mix-blend-multiply" />
      </Link>

      <nav className="flex items-center gap-4 sm:gap-6 font-label-mono text-xs uppercase font-bold text-on-surface">
        <Link
          href="/"
          className={`hover:text-secondary transition-colors ${
            pathname === "/" ? "text-primary border-b-2 border-primary pb-0.5" : "text-on-surface-variant"
          }`}
        >
          Overview
        </Link>
        <Link
          href="/how-it-works"
          className={`hover:text-secondary transition-colors ${
            pathname === "/how-it-works" ? "text-primary border-b-2 border-primary pb-0.5" : "text-on-surface-variant"
          }`}
        >
          How It Works
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        {isConnected ? <button onClick={() => router.push("/dashboard")} className="bg-secondary-container text-primary border-2 border-primary px-4 sm:px-5 py-2 text-xs font-label-mono uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">space_dashboard</span>Open App</button> : <ConnectAndSignButton className="bg-secondary-container text-primary border-2 border-primary px-4 sm:px-5 py-2 text-xs font-label-mono uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5" /> }
      </div>
    </header>
  );
}
