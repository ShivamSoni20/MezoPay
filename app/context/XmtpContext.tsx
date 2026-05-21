"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, type Conversation } from '@xmtp/browser-sdk';

// Add a type for the context so TS knows what we expose
type XmtpContextType = {
  client: Client | null;
  initXmtp: () => Promise<boolean>;
  sending: boolean;
  resetXmtp: () => Promise<void>;
  /** Returns all conversations for the current client */
  listConversations: () => Promise<Conversation[]>;
};

export const XmtpContext = createContext<XmtpContextType | undefined>(undefined);

export const XmtpProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [sending, setSending] = useState(false);

  // -------------------------------------------------
  // Initialise the XMTP client (once per page load)
  // -------------------------------------------------
  const initXmtp = async (): Promise<boolean> => {
    // Legacy context - do not initialize here to prevent e.getIdentifier crashes
    return false;
  };

  // -------------------------------------------------
  // Helper: list all conversations for the current client
  // -------------------------------------------------
  const listConversations = async (): Promise<Conversation[]> => {
    if (!client) return [];
    try {
      // The SDK returns a Set; convert to an array for easier handling
      const convSet = await client.conversations.list();
      return Array.from(convSet);
    } catch (e) {
      console.error('Failed to list XMTP conversations:', e);
      return [];
    }
  };

  // -------------------------------------------------
  // Reset storage – useful during development / explicit logout
  // -------------------------------------------------
  const resetXmtp = async (): Promise<void> => {
    if (!client) return;
    try {
      // Close the client connection first
      await client.close();
      // Delete the IndexedDB database used by XMTP (replace with the actual DB name if known)
      try {
        const DB_NAME = 'xmtp-db';
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => console.log('XMTP IndexedDB deleted');
        deleteRequest.onerror = () => console.error('Failed to delete XMTP IndexedDB');
      } catch (dbErr) {
        console.error('Error during IndexedDB deletion', dbErr);
      }
      setClient(null);
    } catch (e) {
      console.error('XMTP reset error:', e);
    }
  };

  // -------------------------------------------------
  // Wallet account change handling – disconnect / switch
  // -------------------------------------------------
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Wallet disconnected – clear client state
        setClient(null);
      } else {
        // New address – re‑initialise the client for the new account
        initXmtp();
      }
    };
    (window as any).ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => {
      (window as any).ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // -------------------------------------------------
  // Cleanup on page unload to free IndexedDB handles
  // -------------------------------------------------
  useEffect(() => {
    const unload = async () => {
      if (client) {
        await client.close();
      }
    };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [client]);

  return (
    <XmtpContext.Provider
      value={{ client, initXmtp, sending, resetXmtp, listConversations }}
    >
      {children}
    </XmtpContext.Provider>
  );
};

export const useXmtp = () => {
  const ctx = useContext(XmtpContext);
  if (!ctx) throw new Error('useXmtp must be used within XmtpProvider');
  return ctx;
};
