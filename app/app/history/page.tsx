"use client";

import { useState } from "react";
import { useApp } from "../context";

type FilterType = "all" | "sent" | "received" | "split" | "yield";

export default function HistoryPage() {
  const { history } = useApp();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredHistory = history.filter((tx) => {
    if (filter === "all") return true;
    return tx.type === filter;
  });

  return (
    <div className="sc max-w-[800px]">
      <div className="sc-head">
        <span className="sc-title">Transaction History</span>
        <span className="text-xs text-[var(--gray)] font-bold">
          Indexed via Goldsky Subgraph
        </span>
      </div>

      {/* FILTER TABS */}
      <div className="hist-filter">
        {(["all", "sent", "received", "split", "yield"] as const).map((type) => (
          <button
            key={type}
            className={`h-filter-btn ${filter === type ? "active" : ""}`}
            onClick={() => setFilter(type)}
            style={{ textTransform: "capitalize" }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* TRANSACTION LIST */}
      <div className="hist-list">
        {filteredHistory.length === 0 ? (
          <div className="text-sm text-[var(--gray)] py-12 text-center">
            No transactions found for this filter.
          </div>
        ) : (
          filteredHistory.map((tx) => {
            const isReceived = tx.type === "received" || tx.type === "yield";
            const amtColor = isReceived ? "up" : "dn";
            const labelPrefix = isReceived ? "+" : "-";

            let icon = "💸";
            let iconClass = "send-ic";

            if (tx.type === "received") {
              icon = "💰";
              iconClass = "recv-ic";
            } else if (tx.type === "split") {
              icon = "⚖️";
              iconClass = "split-ic";
            } else if (tx.type === "yield") {
              icon = "📈";
              iconClass = "yield-ic";
            }

            const explorerUrl = tx.hash.startsWith("0x")
              ? `https://explorer.testnet.mezo.org/tx/${tx.hash}`
              : `#`;

            return (
              <div key={tx.id} className="hist-row">
                <div className={`hist-icon ${iconClass}`}>{icon}</div>
                <div className="hist-info">
                  <div className="hist-title">{tx.title}</div>
                  <div className="hist-detail">{tx.detail}</div>
                </div>
                <div className="hist-right">
                  <div className={`hist-amt ${amtColor}`}>
                    {labelPrefix}${Math.abs(tx.amount).toFixed(2)}
                  </div>
                  <div className="hist-date">{tx.date}</div>
                  {tx.hash && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hist-hash block"
                    >
                      {tx.hash}
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
