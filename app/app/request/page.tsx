"use client";

import { useState } from "react";
import { useApp } from "../context";
import { usePublicClient, useWriteContract } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, MUSD_ABI, REGISTRY_ABI } from "@/lib/contracts";

export default function RequestPage() {
  const { username, address, setHistory, showToast, refetchData } = useApp();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Create request link state
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [requestUrl, setRequestUrl] = useState("");

  // Pending incoming requests state
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const generateLink = () => {
    if (!amount) {
      showToast("Please enter an amount to request");
      return;
    }
    const handle = username || address?.slice(0, 8) || "user";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://mezosplit.app";
    const url = `${origin}/app/send?to=${handle}&amount=${amount}${note ? `&note=${encodeURIComponent(note)}` : ""}`;
    setRequestUrl(url);
    showToast("Payment link generated!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(requestUrl);
    showToast("Link copied to clipboard!");
  };

  const acceptRequest = async (reqId: string, fromHandle: string, amt: number, desc: string) => {
    const cleanHandle = fromHandle.replace("@", "").trim().toLowerCase();
    showToast(`Resolving @${cleanHandle}...`);

    try {
      let resolvedAddress: `0x${string}` = "0x0000000000000000000000000000000000000000";
      const isDirectAddress = fromHandle.startsWith("0x") && fromHandle.length === 42;

      if (isDirectAddress) {
        resolvedAddress = fromHandle as `0x${string}`;
      } else {
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
        return;
      }

      showToast("Sending payment transaction...");
      const amountWei = parseUnits(amt.toString(), 18);
      const hash = await writeContractAsync({
        address: CONTRACTS.MUSD,
        abi: parseAbi(MUSD_ABI),
        functionName: "transfer",
        args: [resolvedAddress, amountWei],
      });

      showToast(`Paid $${amt.toFixed(2)} to ${fromHandle}!`, `$${amt.toFixed(2)}`);

      setHistory((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "sent",
          title: `Paid request from ${fromHandle}`,
          detail: desc,
          amount: -amt,
          date: "Just now",
          hash: `${hash.slice(0, 6)}...${hash.slice(-4)}`,
        },
        ...prev,
      ]);

      setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Payment failed");
    }
  };

  const declineRequest = (reqId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
    showToast("Request declined");
  };

  return (
    <div className="request-wrap">
      {/* GENERATE REQUEST LINK */}
      <div className="sc" style={{ marginBottom: "20px" }}>
        <div className="sc-head">
          <span className="sc-title">Create Request Link</span>
        </div>
        <div className="big-form" style={{ padding: "20px" }}>
          <p className="text-sm text-[var(--gray)] mb-4 leading-normal">
            Generate a shareable payment link. Anyone who clicks this link can pay you instantly with gasless MUSD.
          </p>
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
            <label>Note (What is this request for?)</label>
            <input
              className="fi"
              type="text"
              placeholder="e.g. Dinner, Rent split..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button className="f-submit" onClick={generateLink}>
            Generate Payment Link
          </button>

          {requestUrl && (
            <div className="req-link-box">
              <div className="req-link-url">{requestUrl}</div>
              <button className="copy-btn" onClick={copyToClipboard}>
                Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PENDING REQUESTS */}
      <div className="sc">
        <div className="sc-head">
          <span className="sc-title">Pending Requests</span>
        </div>
        <div style={{ padding: "0 18px" }}>
          {pendingRequests.length === 0 ? (
            <div className="text-sm text-[var(--gray)] py-6 text-center">
              No pending requests. You're all settled up!
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="pr-row">
                <div className="pr-info">
                  <div className="pr-name">{req.name}</div>
                  <div className="pr-note">
                    {req.note} · {req.date}
                  </div>
                </div>
                <div className="pr-amt">${req.amount.toFixed(2)}</div>
                <div className="flex">
                  <button
                    className="pr-btn pr-accept"
                    onClick={() => acceptRequest(req.id, req.from, req.amount, req.note)}
                  >
                    Pay
                  </button>
                  <button
                    className="pr-btn pr-decline"
                    onClick={() => declineRequest(req.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
