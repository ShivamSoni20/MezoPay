"use client";

import dynamic from "next/dynamic";

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((mod) => mod.ConnectButton),
  { ssr: false },
);

export function ConnectWallet() {
  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    return (
      <span className="rounded-xl border border-[#FDBA74] bg-[#FFF7ED] px-4 py-2 text-sm font-bold text-[#F97316]">
        Set WalletConnect ID
      </span>
    );
  }

  return <ConnectButton label="Connect wallet" />;
}
