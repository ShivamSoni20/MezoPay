"use client";

import dynamic from "next/dynamic";

const DynamicWalletProvider = dynamic(
  () => import("@/components/WalletProvider").then((mod) => mod.WalletProvider),
  { ssr: false },
);

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <DynamicWalletProvider>{children}</DynamicWalletProvider>;
}
