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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isConnected && !isConnecting && !isReconnecting) {
      router.replace("/");
    }
  }, [mounted, isConnected, isConnecting, isReconnecting, router]);

  // While checking connection or if disconnected, render nothing (completely blocks the page)
  if (!mounted || !isConnected) {
    return null;
  }

  return <>{children}</>;
}
