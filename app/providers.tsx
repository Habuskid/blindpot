"use client";

import { useState, type ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { createConfig as createZamaConfig } from "@zama-fhe/react-sdk/wagmi";
import { createConfig as createWagmiConfig } from "wagmi";
import { indexedDBStorage, IndexedDBStorage } from "@zama-fhe/sdk";
import { sepolia as fheSepolia, type FheChain } from "@zama-fhe/sdk/chains";
import { web } from "@zama-fhe/sdk/web";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

const wagmiConfig = createWagmiConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: { [sepolia.id]: http(RPC) },
});

// On mainnet, route relayer traffic through your backend to keep the API key
// server-side; on Sepolia the preset's relayerUrl is already correct.
const mySepolia = { ...fheSepolia, network: RPC } as const satisfies FheChain;

// storage (FHE keypair) and permitStorage (wallet permit) must be SEPARATE stores.
const permitDBStorage = new IndexedDBStorage("PermitStore");

const zamaConfig = createZamaConfig({
  chains: [mySepolia],
  wagmiConfig,
  relayers: { [mySepolia.id]: web() },
  storage: indexedDBStorage,
  permitStorage: permitDBStorage,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration errors by only rendering providers on client
  if (!mounted) return null;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>{children}</ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
