"use client";

import { useState } from "react";
import { useApp } from "../context";
import { useRouter } from "next/navigation";
import { usePublicClient, useWriteContract } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, MUSD_ABI, REGISTRY_ABI } from "@/lib/contracts";

export default function DashboardPage() {
  const {
    balanceFormatted,
    username,
    friends,
    history,
    setHistory,
    tabs,
    showToast,
    refetchData,
    yieldEarned,
    owedAmount,
    oweAmount,
  } = useApp();

  const router = useRouter();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Quick Send Form state
  const [activeTab, setActiveTab] = useState<"send" | "request" | "split">("send");
  const [toHandle, setToHandle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Recalculate owed stats from context lists or fallback to match HTML values
  const owedByFriends = friends
    .filter((f) => f.status === "owes")
    .reduce((sum, f) => sum + f.balance, 0);

  const owesToFriends = Math.abs(
    friends.filter((f) => f.status === "owed").reduce((sum, f) => sum + f.balance, 0)
  );

  const handleQuickAction = async () => {
    if (activeTab === "split") {
      router.push(`/app/split?amount=${amount}&title=${encodeURIComponent(note)}&members=${encodeURIComponent(toHandle)}`);
      return;
    }

    if (!toHandle || !amount) {
      showToast("Please fill in username and amount");
      return;
    }

    const cleanHandle = toHandle.replace("@", "").trim().toLowerCase();
    setIsLoading(true);

    try {
      if (activeTab === "send") {
        // Check if it's a direct address or a handle
        let resolvedAddress: `0x${string}` = "0x0000000000000000000000000000000000000000";
        const isDirectAddress = toHandle.startsWith("0x") && toHandle.length === 42;

        if (isDirectAddress) {
          resolvedAddress = toHandle as `0x${string}`;
        } else {
          showToast(`Resolving @${cleanHandle}...`);
          if (publicClient) {
            try {
              const result = await publicClient.readContract({
                address: CONTRACTS.USERNAME_REGISTRY,
                abi: parseAbi(REGISTRY_ABI),
                functionName: "resolve",
                args: [cleanHandle],
              });
              resolvedAddress = result as `0x${string}`;
            } catch (err) {
              console.error("Registry lookup failed", err);
            }
          }
        }

        if (resolvedAddress === "0x0000000000000000000000000000000000000000") {
          showToast(`Error: @${cleanHandle} is not registered on the Mezo Username Registry.`);
          setIsLoading(false);
          return;
        }

        // 2. Direct transfer on-chain
        const amountWei = parseUnits(amount, 18);
        showToast("Sending transaction...");
        const hash = await writeContractAsync({
          address: CONTRACTS.MUSD,
          abi: parseAbi(MUSD_ABI),
          functionName: "transfer",
          args: [resolvedAddress, amountWei],
        });

        showToast("Transaction sent successfully!", `$${amount}`);
        setHistory((prev) => [
          {
            id: `tx-${Date.now()}`,
            type: "sent",
            title: isDirectAddress ? `Sent to ${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}` : `Sent to @${cleanHandle}`,
            detail: note || "Quick Payment",
            amount: -parseFloat(amount),
            date: "Just now",
            hash: `${hash.slice(0, 6)}...${hash.slice(-4)}`,
          },
          ...prev,
        ]);

        // Clean inputs
        setToHandle("");
        setAmount("");
        setNote("");
        refetchData();
      } else if (activeTab === "request") {
          // Request flow
          await new Promise((resolve) => setTimeout(resolve, 1000));
          showToast(`Request for $${amount} sent to @${cleanHandle}!`, `$${amount}`);
          setHistory((prev) => [
            {
              id: `tx-${Date.now()}`,
              type: "sent",
              title: `Requested from @${cleanHandle}`,
              detail: note || "Quick Request",
              amount: parseFloat(amount),
              date: "Pending",
              hash: "0xrequest...tx",
            },
            ...prev,
          ]);
          setToHandle("");
          setAmount("");
          setNote("");
        } else if (activeTab === "split") {
          // Split flow
          await new Promise((resolve) => setTimeout(resolve, 1200));
          showToast(`Created split of $${amount} with @${cleanHandle}!`, `$${(parseFloat(amount) / 2).toFixed(2)}`);
          setHistory((prev) => [
            {
              id: `tx-${Date.now()}`,
              type: "split",
              title: `Split with @${cleanHandle}`,
              detail: note || "Quick Split",
              amount: -parseFloat(amount) / 2,
              date: "Just now",
              hash: "0xsplit...tx",
            },
            ...prev,
          ]);
          setToHandle("");
          setAmount("");
          setNote("");
        }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* BALANCES ROW */}
      <div className="bal-row">
        <div className="bal-card primary">
          <div className="bc-lbl">MUSD Balance</div>
          <div className="bc-val">${balanceFormatted}</div>
          <div className="bc-sub">Bitcoin-backed · Earning 2.4% APR</div>
        </div>
        <div className="bal-card">
          <div className="bc-lbl">You Are Owed</div>
          <div className="bc-val" style={{ color: "var(--green)" }}>
            ${owedAmount.toFixed(2)}
          </div>
          <div className="bc-sub">Calculated from live splits</div>
          <div className="bc-chg up">↑ Dynamic Feed</div>
        </div>
        <div className="bal-card">
          <div className="bc-lbl">You Owe</div>
          <div className="bc-val" style={{ color: "var(--red)" }}>
            ${oweAmount.toFixed(2)}
          </div>
          <div className="bc-sub">Calculated from live splits</div>
          <div className="bc-chg dn">Due soon</div>
        </div>
        <div className="bal-card">
          <div className="bc-lbl">Yield Earned (Live)</div>
          <div className="bc-val font-mono" style={{ color: "var(--teal)", fontSize: "1.35rem" }}>
            ${yieldEarned.toFixed(6)}
          </div>
          <div className="bc-sub">Mezo Earn vault (2.4% APR)</div>
          <div className="bc-chg up">↑ Real-Time Ticking</div>
        </div>
      </div>

      {/* TWO COLUMN ROW */}
      <div className="two-col">
        {/* QUICK SEND WIDGET */}
        <div className="sc">
          <div className="sc-head">
            <span className="sc-title">
              {activeTab === "send" ? "Quick Send" : activeTab === "request" ? "Quick Request" : "Quick Split"}
            </span>
            <span className="sc-act" onClick={() => router.push(activeTab === "split" ? "/app/dashboard" : "/app/split")}>
              {activeTab === "send" ? "Split a tab instead →" : activeTab === "request" ? "Send money instead →" : "Detailed split page →"}
            </span>
          </div>
          <div className="send-form">
            <div className="form-tabs">
              <div
                className={`ftab ${activeTab === "send" ? "active" : ""}`}
                onClick={() => setActiveTab("send")}
              >
                Send
              </div>
              <div
                className={`ftab ${activeTab === "request" ? "active" : ""}`}
                onClick={() => setActiveTab("request")}
              >
                Request
              </div>
              <div
                className={`ftab ${activeTab === "split" ? "active" : ""}`}
                onClick={() => setActiveTab("split")}
              >
                Split
              </div>
            </div>
            <div className="fg">
              <label>
                {activeTab === "send" ? "To @username" : activeTab === "request" ? "Request from @username" : "Split with @username"}
              </label>
              <input
                className="fi"
                type="text"
                placeholder="@friend"
                value={toHandle}
                onChange={(e) => setToHandle(e.target.value)}
              />
            </div>
            <div className="fg">
              <label>Amount (MUSD)</label>
              <div className="amt-wrap">
                <span className="amt-pre">$</span>
                <input
                  className="fi"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="fg">
              <label>Note</label>
              <input
                className="fi"
                type="text"
                placeholder={activeTab === "send" ? "🍕 Pizza night, ☕ Coffee..." : activeTab === "request" ? "💸 Request note..." : "⚖️ Dinner split..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button className="f-submit" onClick={handleQuickAction} disabled={isLoading}>
              {isLoading
                ? "Processing..."
                : activeTab === "send"
                ? "Send MUSD →"
                : activeTab === "request"
                ? "Request MUSD →"
                : "Create Split Tab →"}
            </button>
            <div className="gasless-note">
              {activeTab === "send" 
                ? "⚡ EIP-712 permit2 · Receiver pays zero gas" 
                : activeTab === "request" 
                ? "⚡ Requests are gasless to create" 
                : "⚡ Split equally between you and your friend"}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="sc">
          <div className="sc-head">
            <span className="sc-title">Recent Activity</span>
            <span className="sc-act" onClick={() => router.push("/app/history")}>
              View all →
            </span>
          </div>
          <div className="act-list">
            {history.slice(0, 5).map((tx) => {
              const isReceived = tx.type === "received" || tx.type === "yield";
              const labelPrefix = isReceived ? "+" : "-";
              const amtColor = isReceived ? "up" : "dn";

              // Clean name format
              let displayName = tx.title
                .replace("Received from ", "")
                .replace("Sent to ", "")
                .replace("Split: ", "");

              // Letter avatar
              const avLetter = displayName.replace("@", "")[0] || "?";

              let avBg = "#F97316";
              if (tx.type === "yield") avBg = "#10B981";
              else if (tx.type === "split") avBg = "#8B5CF6";

              return (
                <div key={tx.id} className="act-row">
                  <div className="act-av" style={{ background: avBg }}>
                    {avLetter.toUpperCase()}
                  </div>
                  <div className="act-info">
                    <div className="act-name">{displayName}</div>
                    <div className="act-note">{tx.detail}</div>
                  </div>
                  <div className="act-right">
                    <div className={`act-amt ${amtColor}`}>
                      {labelPrefix}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className="act-time">{tx.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE TABS ROW */}
      <div className="sc">
        <div className="sc-head">
          <span className="sc-title">Group Tabs</span>
          <span className="sc-act" onClick={() => router.push("/app/split")}>
            Create new →
          </span>
        </div>
        <div className="tabs-grid">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="tab-card"
              onClick={() => router.push("/app/split")}
            >
              <div className="tc-name">{tab.title}</div>
              <div className="tc-meta">
                {tab.members.length} people · {tab.members.join(", ")}
              </div>
              <div className="tc-amt">${tab.total.toFixed(2)} MUSD</div>
              <div className={`tc-status ${tab.settled ? "tc-done" : "tc-open"}`}>
                {tab.settled ? "✓ Settled" : "● Pending 2"}
              </div>
            </div>
          ))}
          <div className="new-tab-btn" onClick={() => router.push("/app/split")}>
            <span style={{ fontSize: "1.3rem" }}>+</span>
            <span>New Group Tab</span>
          </div>
        </div>
      </div>
    </div>
  );
}
