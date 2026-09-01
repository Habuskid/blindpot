"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasSession(!!localStorage.getItem('blindpot_session'));
  }, []);

  useEffect(() => {
    if (mounted && (!isConnected && !isConnecting && !isReconnecting || !hasSession)) {
      router.replace("/");
    }
  }, [mounted, isConnected, isConnecting, isReconnecting, hasSession, router]);

  // While checking connection or if disconnected, render nothing
  if (!mounted || !isConnected || !hasSession) {
    return null;
  }

  return <>{children}</>;
}
