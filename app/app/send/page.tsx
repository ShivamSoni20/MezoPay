"use client";

import { useState, useEffect } from "react";
import { useApp } from "../context";
import { usePublicClient, useWriteContract } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, MUSD_ABI, REGISTRY_ABI } from "@/lib/contracts";
import { getRequestById, updateRequestStatus } from "@/lib/requests";

export default function SendPage() {
  const {
    balanceFormatted,
    friends,
    setHistory,
    showToast,
    refetchData,
    notifyPaymentCompleted,
    refreshRequests,
  } = useApp();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [toHandle, setToHandle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const to = params.get("to");
      const amt = params.get("amount");
      const nt = params.get("note");
      const reqId = params.get("requestId");
      if (to) setToHandle(to.startsWith("0x") ? to : `@${to}`);
      if (amt) setAmount(amt);
      if (nt) setNote(nt);
      if (reqId) setLinkedRequestId(reqId);
    }
  }, []);

  const handleSend = async () => {
    if (!toHandle || !amount) {
      showToast("Please fill in username and amount");
      return;
    }

    const cleanHandle = toHandle.replace("@", "").trim().toLowerCase();
    setIsLoading(true);

    try {
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
          detail: note || "Direct Payment",
          amount: -parseFloat(amount),
          date: "Just now",
          hash: hash,
        },
        ...prev,
      ]);

      if (linkedRequestId) {
        updateRequestStatus(linkedRequestId, "accepted");
        const linked = getRequestById(linkedRequestId);
        if (linked?.fromAddress) {
          await notifyPaymentCompleted(linkedRequestId, linked.fromAddress);
        }
        setLinkedRequestId(null);
        refreshRequests();
      }

      setToHandle("");
      setAmount("");
      setNote("");
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactClick = (handle: string) => {
    setToHandle(`@${handle}`);
  };

  return (
    <div className="send-page-grid">
      <div className="sc">
        <div className="sc-head">
          <span className="sc-title">Send MUSD</span>
        </div>
        <div className="big-form">
          <div className="fg">
            <label>To @username</label>
            <input
              className="fi"
              type="text"
              placeholder="@friend"
              value={toHandle}
              onChange={(e) => setToHandle(e.target.value)}
              style={{ fontSize: ".95rem", padding: "12px 14px" }}
            />
          </div>
          <div className="fg">
            <label>Amount (MUSD)</label>
            <div className="amt-wrap">
              <span className="amt-pre" style={{ fontSize: "1rem" }}>
                $
              </span>
              <input
                className="fi"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="f-note">Balance: ${balanceFormatted} MUSD</div>
          </div>
          <div className="fg">
            <label>Note (optional)</label>
            <input
              className="fi"
              type="text"
              placeholder="What's this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ padding: "12px 14px" }}
            />
          </div>
          <button
            className="f-submit"
            style={{ fontSize: ".95rem", padding: "14px" }}
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Send MUSD → (EIP-712 gasless)"}
          </button>
          <div className="gasless-note" style={{ marginTop: "10px" }}>
            ⚡ MUSD permit2 + EIP-2612 · Receiver never pays gas
          </div>
        </div>
      </div>

      <div className="sc">
        <div className="sc-head">
          <span className="sc-title">Recent Contacts</span>
        </div>
        <div className="recent-contacts">
          {friends.map((contact, i) => {
            const letter = contact.name[0] || "?";
            const colors = ["#F97316", "#8B5CF6", "#06B6D4", "#EC4899", "#10B981"];
            const avBg = colors[i % colors.length];

            return (
              <div
                key={contact.handle}
                className="contact-row"
                onClick={() => handleContactClick(contact.handle)}
              >
                <div className="c-av" style={{ background: avBg }}>
                  {letter}
                </div>
                <div className="c-info">
                  <div className="c-name">{contact.name}</div>
                  <div className="c-handle">@{contact.handle}</div>
                </div>
                <div className="c-last">Last active</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
