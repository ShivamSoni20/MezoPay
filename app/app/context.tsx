"use client";

import { createContext, useContext } from "react";
import type { Client } from "@xmtp/browser-sdk";

export type XmtpStatus = "disconnected" | "connecting" | "connected" | "error";

// Types for AppContext
export interface AppContextType {
  address: `0x${string}` | undefined;
  username: string | null;
  balance: bigint;
  balanceFormatted: string;
  refetchData: () => void;
  showToast: (message: string, amount?: string) => void;
  tabs: any[];
  setTabs: React.Dispatch<React.SetStateAction<any[]>>;
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  friends: any[];
  setFriends: React.Dispatch<React.SetStateAction<any[]>>;
  yieldEarned: number;
  owedAmount: number;
  oweAmount: number;
  xmtpClient: Client<unknown> | null;
  xmtpStatus: XmtpStatus;
  requestsVersion: number;
  initXmtp: () => Promise<void>;
  sendPaymentRequest: (
    toAddress: string,
    toUsername: string,
    amount: number,
    note: string,
    requestId?: string,
  ) => Promise<boolean>;
  notifyPaymentCompleted: (requestId: string, toAddress: string) => Promise<void>;
  refreshRequests: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
