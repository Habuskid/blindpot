"use client";

import React, { useEffect, useState } from "react";

export interface CircularLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  brassAccent?: boolean;
}

/**
 * CircularLoader: A sleek, rotating circular loader that is clean,
 * responsive, and non-generic. Features a calibrated orbital arc with
 * an orbiting Prize Brass (#C9A15A) marker.
 */
export function CircularLoader({
  size = "md",
  className = "",
  brassAccent = true,
}: CircularLoaderProps) {
  const sizePx = size === "sm" ? 16 : size === "lg" ? 28 : 20;
  const strokeWidth = size === "sm" ? 2.5 : size === "lg" ? 3 : 2.5;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: sizePx, height: sizePx }}
      role="status"
      aria-label="Loading"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-spin"
        style={{ animationDuration: "0.85s" }}
      >
        {/* Subtle background track */}
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity="0.16"
        />
        {/* Active rotating arc */}
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="26 80"
        />
        {/* Distinctive Prize Brass Orbiting Marker */}
        {brassAccent && (
          <circle
            cx="29"
            cy="16"
            r={size === "sm" ? "2.2" : size === "lg" ? "3" : "2.6"}
            fill="#C9A15A"
            stroke="#0F0F12"
            strokeWidth="0.75"
          />
        )}
      </svg>
    </span>
  );
}

// Alias for backwards compatibility across existing pages
export const CipherSpinner = CircularLoader;

export type OnchainPhase = "idle" | "wallet" | "mining" | "syncing" | "success" | "error";

export interface OnchainSyncCardProps {
  phase: OnchainPhase;
  title?: string;
  description?: string;
  txHash?: string | null;
  onDismiss?: () => void;
  className?: string;
  hideOnSuccess?: boolean;
}

/**
 * OnchainSyncCard: High-UX synchronization status banner.
 * Gives the user real-time visual feedback while confirming in wallet,
 * waiting for block inclusion, and syncing on-chain balances.
 */
export function OnchainSyncCard({
  phase,
  title,
  description,
  txHash,
  onDismiss,
  className = "",
  hideOnSuccess = true,
}: OnchainSyncCardProps) {
  if (phase === "idle") return null;
  if (hideOnSuccess && phase === "success") return null;

  const isPending = phase === "wallet" || phase === "mining" || phase === "syncing";

  return (
    <div
      className={`border-2 p-4 mb-5 transition-all flex flex-col gap-2 ${
        phase === "wallet"
          ? "border-secondary bg-surface-container-high hard-shadow-sm animate-pulse"
          : phase === "mining" || phase === "syncing"
          ? "border-primary bg-surface-container-low hard-shadow-sm"
          : phase === "success"
          ? "border-primary bg-surface-container hard-shadow-sm"
          : "border-error bg-error-container text-error"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isPending && <CircularLoader size="md" />}
          {phase === "success" && (
            <span className="material-symbols-outlined text-[20px] text-secondary font-bold">
              check_circle
            </span>
          )}
          {phase === "error" && (
            <span className="material-symbols-outlined text-[20px] text-error font-bold">
              cancel
            </span>
          )}
          <span className="font-headline-sm text-xs md:text-sm font-bold uppercase tracking-tight text-primary">
            {title ||
              (phase === "wallet"
                ? "Confirm in Wallet"
                : phase === "mining"
                ? "Broadcasting on Sepolia"
                : phase === "syncing"
                ? "Synchronizing State"
                : phase === "success"
                ? "Confirmed on-Chain"
                : "Transaction Cancelled / Failed")}
          </span>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-on-surface-variant hover:text-primary transition-colors text-xs font-mono"
            title="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      <p className="font-body-md text-xs text-on-surface-variant leading-relaxed m-0 pl-7">
        {description ||
          (phase === "wallet"
            ? "Please review and confirm the transaction prompt in MetaMask or your connected wallet."
            : phase === "mining"
            ? "Transaction submitted. Waiting for block inclusion on Ethereum Sepolia (~12s)..."
            : phase === "syncing"
            ? "Block mined! Updating encrypted balances and on-chain state..."
            : phase === "success"
            ? "The transaction was mined successfully and your ledger has been synchronized."
            : "The transaction was rejected in your wallet or reverted on-chain.")}
      </p>

      {txHash && (
        <div className="pl-7 pt-1 flex items-center gap-2 text-[11px] font-mono">
          <span className="text-on-surface-variant">TX:</span>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-secondary hover:underline flex items-center gap-0.5 font-bold"
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
          </a>
        </div>
      )}
    </div>
  );
}

interface DossierLoaderProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

/**
 * DossierLoader: Classified FHEVM Coprocessor Scanning Card
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
      <div className="w-full flex justify-between items-center border-b border-primary/20 pb-3 mb-5 text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-error animate-ping inline-block" />
          FHEVM // CIPHERTEXT SCAN
        </span>
        <span className="font-bold text-primary bg-surface-container px-1.5 py-0.5 border border-primary/30">
          {hexTick}
        </span>
      </div>

      <div className="w-full flex flex-col gap-2 mb-6 items-center">
        <div className="w-3/4 h-3.5 bg-surface-variant border border-primary animate-radar" style={{ animationDelay: "0ms" }} />
        <div className="w-full h-3.5 bg-[#C9A15A] border border-primary animate-radar shadow-[1px_1px_0px_#0F0F12]" style={{ animationDelay: "150ms" }} />
        <div className="w-1/2 h-3.5 bg-surface-variant border border-primary animate-radar" style={{ animationDelay: "300ms" }} />
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <CircularLoader size="md" />
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
