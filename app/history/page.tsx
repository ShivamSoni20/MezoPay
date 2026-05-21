"use client";
import React, { useEffect, useState } from 'react';
import { useXmtp } from '@/app/context/XmtpContext';
import type { Conversation, DecodedMessage } from '@xmtp/browser-sdk';
import '@/app/styles/history.css';

// Helper to format timestamps nicely
const formatDate = (date: Date) => {
  return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

type ConvInfo = {
  address: string;
  messages: { text: string; ts: Date }[];
};

export default function HistoryPage() {
  const { client, listConversations, resetXmtp } = useXmtp();
  const [convs, setConvs] = useState<ConvInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!client) return;
      setLoading(true);
      try {
        const conversations = await listConversations();
        const convInfos: ConvInfo[] = [];
        for (const conv of conversations) {
          // Fetch the latest 10 messages (sorted newest first)
          const msgs = await conv.messages();
          const latest = msgs
            .slice(-10) // keep last 10 (messages are in chronological order)
            .map((m: DecodedMessage) => {
                const content: any = m.content as any;
                return {
                  text: content?.type === 'text' ? content?.value : '[non‑text]',
                  ts: new Date(Number(m.sentAtNs) / 1e6),
                };
              });
          convInfos.push({ address: (conv as any).peerAddress || (conv as any).dmPeerInboxId?.() || conv.id, messages: latest });
        }
        setConvs(convInfos);
      } catch (e) {
        console.error('Failed to load history', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client, listConversations]);

  if (!client) {
    return (
      <div className="history-container">
        <p className="history-info">Connect your wallet to view XMTP message history.</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h1 className="history-title">XMTP Message History</h1>
      {loading && <p className="history-info">Loading conversations…</p>}
      {!loading && convs.length === 0 && (
        <p className="history-info">No conversations yet. Start chatting with other users!</p>
      )}
      <div className="history-grid">
        {convs.map((c) => (
          <div key={c.address} className="history-card">
            <h2 className="history-peer">{c.address.slice(0, 6)}…{c.address.slice(-4)}</h2>
            <ul className="history-messages">
              {c.messages.map((m, i) => (
                <li key={i} className="history-message">
                  <span className="history-text">{m.text}</span>
                  <span className="history-ts">{formatDate(m.ts)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Clear History button – only visible in dev / non‑production builds */}
      {process.env.NODE_ENV !== 'production' && (
        <button className="history-clear-btn" onClick={resetXmtp}>
          Clear XMTP data (dev only)
        </button>
      )}
    </div>
  );
}
