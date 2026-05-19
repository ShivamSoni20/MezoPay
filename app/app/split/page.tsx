"use client";

import { useState } from "react";
import { useApp } from "../context";
import { usePublicClient, useWriteContract, useAccount } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, SPLIT_ABI, REGISTRY_ABI } from "@/lib/contracts";

interface Participant {
  name: string;
  handle: string;
  address: `0x${string}`;
  share: number;
}

export default function SplitPage() {
  const { tabs, setTabs, showToast, friends } = useApp();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [memberHandle, setMemberHandle] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "You", handle: "you", address: (userAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`, share: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-calculate split shares when total or participants change
  const handleCalculateSplits = (total: string, parts: Participant[]) => {
    const numericTotal = parseFloat(total) || 0;
    if (parts.length === 0 || numericTotal === 0) return parts;

    const evenShare = numericTotal / parts.length;
    return parts.map((p) => ({
      ...p,
      share: parseFloat(evenShare.toFixed(2)),
    }));
  };

  const addMember = async () => {
    if (!memberHandle) return;
    const cleanHandle = memberHandle.replace("@", "").trim().toLowerCase();

    // Check if duplicate
    if (participants.some((p) => p.handle === cleanHandle)) {
      showToast(`@${cleanHandle} is already in the split`);
      return;
    }

    let resolvedAddr: `0x${string}` = "0x0000000000000000000000000000000000000000";
    const isDirectAddress = memberHandle.startsWith("0x") && memberHandle.length === 42;

    if (isDirectAddress) {
      resolvedAddr = memberHandle as `0x${string}`;
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
          resolvedAddr = result as `0x${string}`;
        } catch (err) {
          console.error("Resolve failed", err);
        }
      }
    }

    if (resolvedAddr === "0x0000000000000000000000000000000000000000") {
      showToast(`Error: @${cleanHandle} is not registered on the Mezo Username Registry.`);
      return;
    }

    // Lookup friend info or fallback
    const friendInfo = friends.find((f) => f.handle === cleanHandle);
    const newParticipant: Participant = {
      name: friendInfo ? friendInfo.name : (isDirectAddress ? `${memberHandle.slice(0, 6)}...${memberHandle.slice(-4)}` : `@${cleanHandle}`),
      handle: cleanHandle,
      address: resolvedAddr,
      share: 0,
    };

    const nextParticipants = [...participants, newParticipant];
    setParticipants(handleCalculateSplits(totalAmount, nextParticipants));
    setMemberHandle("");
    showToast(`Added ${isDirectAddress ? "address" : `@${cleanHandle}`}`);
  };

  const removeMember = (handle: string) => {
    if (handle === "you") return;
    const nextParticipants = participants.filter((p) => p.handle !== handle);
    setParticipants(handleCalculateSplits(totalAmount, nextParticipants));
  };

  const handleTotalChange = (val: string) => {
    setTotalAmount(val);
    setParticipants(handleCalculateSplits(val, participants));
  };

  const createTabOnChain = async () => {
    if (!title || !totalAmount) {
      showToast("Please fill in title and amount");
      return;
    }
    if (participants.length < 2) {
      showToast("Please add at least one other participant");
      return;
    }

    setIsLoading(true);

    try {
      showToast("Deploying tab to Mezo Network...");

      // Prepare contract args: title, members, shares in Wei
      const memberAddresses = participants.map((p) => p.address);
      const memberShares = participants.map((p) => parseUnits(p.share.toString(), 18));

      // Real on-chain creation
      const hash = await writeContractAsync({
        address: CONTRACTS.SPLIT_MANAGER,
        abi: parseAbi(SPLIT_ABI),
        functionName: "createTab",
        args: [title, memberAddresses, memberShares],
      });

      showToast("Waiting for transaction confirmation...");
      let onChainTabId = `tab-${Date.now()}`;
      if (publicClient) {
        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          const splitManagerLog = receipt.logs.find(
            (log) => log.address.toLowerCase() === CONTRACTS.SPLIT_MANAGER.toLowerCase()
          );
          if (splitManagerLog && splitManagerLog.topics[1]) {
            onChainTabId = splitManagerLog.topics[1];
          }
        } catch (receiptErr) {
          console.error("Failed to fetch transaction receipt", receiptErr);
        }
      }

      showToast("Group tab created on-chain!", title);

      // Add to local state
      setTabs((prev) => [
        {
          id: onChainTabId,
          title,
          members: participants.map((p) => `@${p.handle}`),
          total: parseFloat(totalAmount),
          paid: participants.find((p) => p.handle === "you")?.share || 0,
          settled: false,
          onChainHash: hash,
        },
        ...prev,
      ]);

      // Reset
      setTitle("");
      setTotalAmount("");
      setParticipants([{ name: "You", handle: "you", address: userAddress || "0x0000000000000000000000000000000000000000", share: 0 }]);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to create tab");
    } finally {
      setIsLoading(false);
    }
  };

  const settleTabLocal = async (tabId: string, isCreator: boolean) => {
    showToast("Settling split balances on Mezo...");
    try {
      if (tabId.startsWith("0x") && tabId.length === 66) {
        showToast("Sending transaction...");
        const hash = await writeContractAsync({
          address: CONTRACTS.SPLIT_MANAGER,
          abi: parseAbi(SPLIT_ABI),
          functionName: "settleTab",
          args: [tabId as `0x${string}`],
        });
        showToast("Split tab settled on-chain!", hash.slice(0, 8));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        showToast("Split tab settled successfully!");
      }

      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, settled: true, paid: t.total } : t))
      );
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Settling failed");
    }
  };

  return (
    <div className="split-builder">
      {/* LEFT COLUMN: BUILDER */}
      <div className="sc">
        <div className="sc-head">
          <span className="sc-title">Create Group Tab</span>
        </div>
        <div className="big-form" style={{ padding: "20px" }}>
          <div className="fg">
            <label>Tab Title</label>
            <input
              className="fi"
              type="text"
              placeholder="e.g. Pizza Night 🍕"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="fg">
            <label>Total Amount (MUSD)</label>
            <div className="amt-wrap">
              <span className="amt-pre">$</span>
              <input
                className="fi"
                type="number"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => handleTotalChange(e.target.value)}
              />
            </div>
          </div>

          <div className="fg">
            <label>Add Friends</label>
            <div className="add-person">
              <input
                className="fi"
                type="text"
                placeholder="@username"
                value={memberHandle}
                onChange={(e) => setMemberHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMember()}
              />
              <button className="add-btn" onClick={addMember}>
                Add
              </button>
            </div>
          </div>

          <div className="fg">
            <label>Split Details</label>
            <div className="split-people-list">
              {participants.map((p) => (
                <div key={p.handle} className="sp-row">
                  <div
                    className="sp-av"
                    style={{
                      background: p.handle === "you" ? "var(--orange)" : "#8B5CF6",
                    }}
                  >
                    {p.handle === "you" ? "Y" : p.handle[0].toUpperCase()}
                  </div>
                  <div className="sp-name">
                    {p.name} <span style={{ opacity: 0.6 }}>@{p.handle}</span>
                  </div>
                  <div className="sp-share">${p.share.toFixed(2)}</div>
                  {p.handle !== "you" && (
                    <span className="sp-remove" onClick={() => removeMember(p.handle)}>
                      ✕
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="split-total">
            <span>Total Split</span>
            <span>${(parseFloat(totalAmount) || 0).toFixed(2)} MUSD</span>
          </div>

          <button className="f-submit" onClick={createTabOnChain} disabled={isLoading}>
            {isLoading ? "Creating tab on-chain..." : "Create Split Tab →"}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE TABS */}
      <div className="sc">
        <div className="sc-head">
          <span className="sc-title">Active Tabs</span>
        </div>
        <div className="active-tabs-list">
          {tabs.map((tab) => {
            const pct = Math.min(100, Math.round((tab.paid / tab.total) * 100));
            const isCreator = tab.members.includes("@you");

            return (
              <div key={tab.id} className="at-row">
                <div className="at-header">
                  <div>
                    <div className="at-name">{tab.title}</div>
                    <div className="at-meta">
                      {tab.members.length} people · {tab.members.join(", ")}
                    </div>
                  </div>
                  <div className="at-amt">${tab.total.toFixed(2)}</div>
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: "12px" }}>
                  <div className="text-xs font-bold text-[var(--gray)]">
                    Paid: ${tab.paid.toFixed(2)} of ${tab.total.toFixed(2)} ({pct}%)
                  </div>

                  {!tab.settled && (
                    <button
                      className="pr-btn pr-accept"
                      onClick={() => settleTabLocal(tab.id, isCreator)}
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                    >
                      {isCreator ? "Settle Tab" : "Pay Share"}
                    </button>
                  )}

                  {tab.settled && (
                    <span className="text-xs font-bold text-[var(--green)]">
                      ✓ Settled
                    </span>
                  )}
                </div>

                <div className="at-progress">
                  <div className="at-prog-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
