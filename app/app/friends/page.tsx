"use client";

import { useState } from "react";
import { useApp } from "../context";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const { friends } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sc max-w-[800px]">
      <div className="sc-head">
        <span className="sc-title">Friends & Contacts</span>
      </div>

      <div className="friends-search">
        <input
          className="fi"
          type="text"
          placeholder="Search by name or @username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="friends-list">
        {filteredFriends.length === 0 ? (
          <div className="text-sm text-[var(--gray)] py-12 text-center">
            No friends found matching "{search}".
          </div>
        ) : (
          filteredFriends.map((f, i) => {
            const letter = f.name[0] || "?";
            const colors = ["#F97316", "#8B5CF6", "#06B6D4", "#EC4899", "#10B981"];
            const avBg = colors[i % colors.length];

            const owesYou = f.status === "owes";
            const youOwe = f.status === "owed";

            let balColor = "var(--dark)";
            let balText = "Settled up";

            if (owesYou) {
              balColor = "var(--green)";
              balText = `owes you $${f.balance.toFixed(2)}`;
            } else if (youOwe) {
              balColor = "var(--red)";
              balText = `you owe $${Math.abs(f.balance).toFixed(2)}`;
            }

            return (
              <div key={f.handle} className="friend-row">
                <div className="fr-av" style={{ background: avBg }}>
                  {letter}
                </div>
                <div className="fr-info">
                  <div className="fr-name">{f.name}</div>
                  <div className="fr-handle">@{f.handle}</div>
                </div>

                <div className="fr-balance">
                  <div className="fr-bal-amt" style={{ color: balColor }}>
                    {balText}
                  </div>
                  <div className="fr-bal-lbl">{f.note}</div>
                </div>

                <div className="fr-action-btns">
                  <button
                    className="fr-act-btn"
                    onClick={() => router.push(`/app/send?to=@${f.handle}`)}
                  >
                    Pay
                  </button>
                  <button
                    className="fr-act-btn"
                    onClick={() => router.push(`/app/request?to=@${f.handle}`)}
                  >
                    Request
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
