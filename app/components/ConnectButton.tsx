"use client";

import React from "react";
import { useConnect, useDisconnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";

export function ConnectButton({ className }: { className?: string }) {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();

  if (isConnected) {
    return (
      <button onClick={() => disconnect()} className={className}>
        {address?.slice(0, 6)}...{address?.slice(-4)} (Disconnect)
      </button>
    );
  }

  return (
    <button onClick={() => connect({ connector: injected() })} className={className}>
      Connect wallet
    </button>
  );
}
