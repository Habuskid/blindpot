"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import { useRouter } from "next/navigation";
import { CircularLoader } from "./BlindpotLoader";

export function ConnectAndSignButton({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(!!localStorage.getItem('blindpot_session'));
  }, []);

  const handleConnectAndSign = async () => {
    try {
      setLoading(true);
      // If they already have a session, just go to dashboard
      if (isConnected && hasSession) {
        router.push("/dashboard");
        return;
      }

      // 1. Connect if not connected
      if (!isConnected) {
        await connectAsync({ connector: injected() });
      }

      // 2. Check session again after connecting (in case they just switched accounts, though this is a quick fix)
      const existingSession = localStorage.getItem('blindpot_session');
      if (existingSession) {
        router.push("/dashboard");
        return;
      }

      // 3. Sign message for session
      const message = `Sign in to Blindpot\n\nAuthenticate your wallet to access your confidential dashboard.\n\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message, account: address as any });

      // 4. Save session locally
      localStorage.setItem('blindpot_session', signature);
      setHasSession(true);

      // 5. Redirect to dashboard
      router.push("/dashboard");
    } catch (e) {
      console.error("Failed to connect or sign", e);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (loading) return "Authenticating...";
    if (isConnected && hasSession) return "Launch App";
    if (isConnected && !hasSession) return "Sign In to Launch";
    return "Launch App";
  };

  const getIcon = () => {
    if (loading) return "sync";
    if (isConnected && hasSession) return "space_dashboard";
    return "rocket_launch";
  };

  return (
    <button
      onClick={handleConnectAndSign}
      disabled={loading}
      className={className || "bg-secondary-container text-primary border-2 border-primary px-4 py-1.5 text-xs font-label-mono uppercase font-bold hard-shadow-primary hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 disabled:opacity-70"}
    >
      {loading ? (
        <CircularLoader size="sm" />
      ) : (
        <span className="material-symbols-outlined text-[16px]">
          {getIcon()}
        </span>
      )}
      {getLabel()}
    </button>
  );
}
