"use client";

import { getConfig, mezoTestnet } from "@mezo-org/passport";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  if (!walletConnectProjectId) {
    return <>{children}</>;
  }

  return (
    <ConfiguredWalletProvider walletConnectProjectId={walletConnectProjectId}>
      {children}
    </ConfiguredWalletProvider>
  );
}

function ConfiguredWalletProvider({
  children,
  walletConnectProjectId,
}: {
  children: React.ReactNode;
  walletConnectProjectId: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() =>
    getConfig({
      appName: "MezoPay",
      walletConnectProjectId,
      mezoNetwork: "testnet",
    }),
  );
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={mezoTestnet}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
