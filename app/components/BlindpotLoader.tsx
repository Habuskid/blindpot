"use client";

import React, { useEffect, useState } from "react";

interface CipherSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  brassAccent?: boolean;
}

/**
 * Mechanical Aperture Tumbler: A bespoke brutalist loading indicator
 * that rotates in discrete mechanical steps instead of a generic smooth circle.
 */
export function CipherSpinner({ size = "md", className = "", brassAccent = true }: CipherSpinnerProps) {
  const sizePx = size === "sm" ? 14 : size === "lg" ? 24 : 18;
  const strokeWidth = size === "sm" ? 2 : 2.5;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: sizePx, height: sizePx }}
      role="status"
      aria-label="Loading"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-mechanical"
        style={{ transformOrigin: "center" }}
      >
        {/* Outer square aperture */}
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="6 3"
        />
        {/* Inner crosshair reticle */}
        <line x1="12" y1="5" x2="12" y2="8" stroke="currentColor" strokeWidth={strokeWidth} />
        <line x1="12" y1="16" x2="12" y2="19" stroke="currentColor" strokeWidth={strokeWidth} />
        <line x1="5" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth={strokeWidth} />
        <line x1="16" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth={strokeWidth} />
        {/* Center core pulse pip */}
        <rect
          x="10"
          y="10"
          width="4"
          height="4"
          fill={brassAccent ? "#C9A15A" : "currentColor"}
        />
      </svg>
    </span>
  );
}

interface DossierLoaderProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

/**
 * DossierLoader: Classified FHEVM Coprocessor Scanning Card
 * Displays the signature 3 redaction bars (2 silver, 1 brass) from BRAND.md
 * with a cycling hex stream ticker.
 */
export function DossierLoader({
  label = "PROCESSING ENCRYPTED RECORD...",
  sublabel = "COMMUNICATING WITH ZAMA FHEVM COPROCESSOR",
  className = "",
}: DossierLoaderProps) {
  const [hexTick, setHexTick] = useState("0x7f4a...euint64");

  useEffect(() => {
    const hexSamples = [
      "0x8f2b...FHE_OPS",
      "KMS::VERIFY_PERMIT",
      "0x13aa...SEALED",
      "COPROC::HCU_EVAL",
      "0x489f...CIPHER",
      "ZAMA::RELAY_EXEC",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % hexSamples.length;
      setHexTick(hexSamples[idx]);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`border-2 border-primary bg-surface p-6 md:p-8 hard-shadow-primary flex flex-col items-center justify-center text-center w-full max-w-md mx-auto relative overflow-hidden ${className}`}
    >
      {/* Top Classified Dossier Header */}
      <div className="w-full flex justify-between items-center border-b border-primary/20 pb-3 mb-5 text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-error animate-ping inline-block" />
          FHEVM // CIPHERTEXT SCAN
        </span>
        <span className="font-bold text-primary bg-surface-container px-1.5 py-0.5 border border-primary/30">
          {hexTick}
        </span>
      </div>

      {/* Signature Redaction Bars (2 silver + 1 prize brass) from BRAND.md */}
      <div className="w-full flex flex-col gap-2 mb-6 items-center">
        <div className="w-3/4 h-3.5 bg-surface-variant border border-primary animate-radar" style={{ animationDelay: "0ms" }} />
        <div className="w-full h-3.5 bg-[#C9A15A] border border-primary animate-radar shadow-[1px_1px_0px_#0F0F12]" style={{ animationDelay: "150ms" }} />
        <div className="w-1/2 h-3.5 bg-surface-variant border border-primary animate-radar" style={{ animationDelay: "300ms" }} />
      </div>

      {/* Mechanical Tumbler + Label */}
      <div className="flex items-center gap-2 mb-1.5">
        <CipherSpinner size="md" />
        <span className="font-headline-sm text-xs md:text-sm font-bold uppercase tracking-tight text-primary">
          {label}
        </span>
      </div>

      <p className="font-label-mono text-[11px] uppercase text-on-surface-variant tracking-wider m-0">
        {sublabel}
      </p>
    </div>
  );
}
