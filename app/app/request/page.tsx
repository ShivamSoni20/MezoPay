"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context";
import { usePublicClient, useWriteContract } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, MUSD_ABI, REGISTRY_ABI, SPLIT_ABI } from "@/lib/contracts";
import {
  loadRequests,
  updateRequestStatus,
  upsertRequest,
  type MezoPayRequest,
} from "@/lib/requests";
import { canRecipientMessage } from "@/lib/xmtp";

export default function RequestPage() {
  const {
    username,
    address,
    setHistory,
    showToast,
    refetchData,
    xmtpStatus,
    requestsVersion,
    initXmtp,
    sendPaymentRequest,
    notifyPaymentCompleted,
    refreshRequests,
  } = useApp();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [recipientHandle, setRecipientHandle] = useState("");
  const [resolvedRecipient, setResolvedRecipient] = useState("");
  const [recipientOnXmtp, setRecipientOnXmtp] = useState<boolean | null>(null);
  const [requestUrl, setRequestUrl] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<
    {
      id: string;
      name: string;
      from: string;
      fromAddress: string;
      amount: number;
      note: string;
      date: string;
    }[]
  >([]);

  const loadPendingRequests = useCallback(() => {
    if (!address) return;
    const incoming = loadRequests().filter(
      (r) =>
        r.toAddress?.toLowerCase() === address.toLowerCase() &&
        r.status === "pending",
    );
    setPendingRequests(
      incoming.map((r) => ({
        id: r.id,
        name: r.fromUsername
          ? `@${r.fromUsername}`
          : `${r.fromAddress.slice(0, 6)}...${r.fromAddress.slice(-4)}`,
        from: r.fromUsername ? `@${r.fromUsername}` : r.fromAddress,
        fromAddress: r.fromAddress,
        amount: r.amount,
        note: r.note,
        date: new Date(r.timestamp * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })),
    );
  }, [address]);

  useEffect(() => {
    loadPendingRequests();
  }, [address, requestsVersion, loadPendingRequests]);

  useEffect(() => {
    const onUpdate = () => loadPendingRequests();
    window.addEventListener("mezopay_requests_updated", onUpdate);
    return () => window.removeEventListener("mezopay_requests_updated", onUpdate);
  }, [loadPendingRequests]);

  const resolveRecipient = async (): Promise<{
    address: `0x${string}`;
    username: string;
    isDirect: boolean;
  } | null> => {
    const raw = recipientHandle.replace("@", "").trim();
    if (!raw) {
      showToast("Enter a recipient @username or address");
      return null;
    }

    const isDirect = raw.startsWith("0x") && raw.length === 42;
    if (isDirect) {
      return {
        address: raw as `0x${string}`,
        username: "",
        isDirect: true,
      };
    }

    const cleanHandle = raw.toLowerCase();
    if (!publicClient) return null;

    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.USERNAME_REGISTRY,
        abi: parseAbi(REGISTRY_ABI),
        functionName: "resolve",
        args: [cleanHandle],
      });
      const resolved = result as `0x${string}`;
      if (resolved === "0x0000000000000000000000000000000000000000") {
        showToast(`@${cleanHandle} is not registered on Mezo`);
        return null;
      }
      return { address: resolved, username: cleanHandle, isDirect: false };
    } catch {
      showToast(`Could not resolve @${cleanHandle}`);
      return null;
    }
  };

  const checkRecipientXmtp = async () => {
    const resolved = await resolveRecipient();
    if (!resolved) {
      setResolvedRecipient("");
      setRecipientOnXmtp(null);
      return;
    }
    setResolvedRecipient(resolved.address);
    try {
      const reachable = await canRecipientMessage(resolved.address);
      setRecipientOnXmtp(reachable);
    } catch {
      setRecipientOnXmtp(false);
    }
  };

  const buildRequestRecord = (
    reqId: string,
    toAddress: string,
    toUsername: string,
  ): MezoPayRequest => ({
    id: reqId,
    fromAddress: (address || "0x0000000000000000000000000000000000000000").toLowerCase(),
    fromUsername: username || "",
    toAddress: toAddress.toLowerCase(),
    toUsername,
    amount: parseFloat(amount),
    note: note || "Quick Request",
    timestamp: Math.floor(Date.now() / 1000),
    status: "pending",
  });

  const sendDirectRequest = async () => {
    if (!amount) {
      showToast("Please enter an amount to request");
      return;
    }
    setIsSending(true);
    try {
      if (xmtpStatus !== "connected") {
        const ok = await initXmtp();
        if (!ok) return;
      }

      const resolved = await resolveRecipient();
      if (!resolved) return;

      const reqId = `req-${Date.now()}`;
      const record = buildRequestRecord(
        reqId,
        resolved.address,
        resolved.isDirect ? "" : resolved.username,
      );
      upsertRequest(record);

      const sent = await sendPaymentRequest(
        resolved.address,
        resolved.isDirect ? "" : resolved.username,
        record.amount,
        record.note,
        reqId,
      );

      if (sent) {
        showToast(
          `Direct request sent to ${resolved.isDirect ? resolved.address.slice(0, 6) + "..." : "@" + resolved.username}!`,
          `$${record.amount.toFixed(2)}`,
        );
        setAmount("");
        setNote("");
        setRecipientHandle("");
        setRecipientOnXmtp(null);
        setResolvedRecipient("");
        refreshRequests();
        refetchData();
      } else {
        showToast("Request saved locally but XMTP delivery failed");
      }
    } finally {
      setIsSending(false);
    }
  };

  const generateLink = async () => {
    if (!amount) {
      showToast("Please enter an amount to request");
      return;
    }

    const reqId = `req-${Date.now()}`;
    const handle = username || address?.slice(0, 8) || "user";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://mezosplit.app";

    if (recipientHandle.trim()) {
      const resolved = await resolveRecipient();
      if (resolved) {
        const record = buildRequestRecord(
          reqId,
          resolved.address,
          resolved.isDirect ? "" : resolved.username,
        );
        upsertRequest(record);
      }
    }

    const url = `${origin}/app/send?to=${handle}&amount=${amount}&requestId=${reqId}${note ? `&note=${encodeURIComponent(note)}` : ""}`;
    setRequestUrl(url);
    showToast("Payment link generated!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(requestUrl);
    showToast("Link copied to clipboard!");
  };

  const acceptRequest = async (
    reqId: string,
    fromHandle: string,
    fromAddr: string,
    amt: number,
    desc: string,
  ) => {
    const cleanHandle = fromHandle.replace("@", "").trim().toLowerCase();
    showToast(`Resolving ${fromHandle.startsWith("0x") ? "address" : `@${cleanHandle}`}...`);

    try {
      let resolvedAddress: `0x${string}` =
        "0x0000000000000000000000000000000000000000";
      const isDirectAddress = fromHandle.startsWith("0x") && fromHandle.length === 42;

      if (isDirectAddress) {
        resolvedAddress = fromHandle as `0x${string}`;
      } else if (fromAddr.startsWith("0x") && fromAddr.length === 42) {
        resolvedAddress = fromAddr as `0x${string}`;
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
        showToast(`Error: ${fromHandle} could not be resolved.`);
        return;
      }

      const amountWei = parseUnits(amt.toString(), 18);
      let hash;

      if (reqId.startsWith("0x") && reqId.length === 66) {
        // It's a Split Tab reminder! Route payment through SplitManager
        showToast("Approving MUSD for Split Tab...");
        const approveHash = await writeContractAsync({
          address: CONTRACTS.MUSD,
          abi: parseAbi(MUSD_ABI),
          functionName: "approve",
          args: [CONTRACTS.SPLIT_MANAGER, amountWei],
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
        
        showToast("Paying Split Tab share...");
        hash = await writeContractAsync({
          address: CONTRACTS.SPLIT_MANAGER,
          abi: parseAbi(SPLIT_ABI),
          functionName: "payShare",
          args: [reqId as `0x${string}`],
        });
      } else {
        // Standard P2P Transfer
        showToast("Sending payment transaction...");
        hash = await writeContractAsync({
          address: CONTRACTS.MUSD,
          abi: parseAbi(MUSD_ABI),
          functionName: "transfer",
          args: [resolvedAddress, amountWei],
        });
      }

      showToast(`Paid $${amt.toFixed(2)} to ${fromHandle}!`, `$${amt.toFixed(2)}`);

      setHistory((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "sent",
          title: `Paid request from ${fromHandle}`,
          detail: desc,
          amount: -amt,
          date: "Just now",
          hash: hash,
        },
        ...prev,
      ]);

      updateRequestStatus(reqId, "accepted");
      await notifyPaymentCompleted(reqId, fromAddr);

      loadPendingRequests();
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Payment failed");
    }
  };

  const declineRequest = (reqId: string) => {
    updateRequestStatus(reqId, "declined");
    loadPendingRequests();
    refetchData();
    showToast("Request declined");
  };

  return (
    <div className="request-wrap">
      <div className="sc" style={{ marginBottom: "20px" }}>
        <div className="sc-head">
          <span className="sc-title">Request Payment</span>
        </div>
        <div className="big-form" style={{ padding: "20px" }}>
          <p className="text-sm text-[var(--gray)] mb-4 leading-normal">
            Send an encrypted XMTP request for instant notification, or share a payment link if they are not on XMTP.
          </p>
          <div className="fg">
            <label>Request from @username or address</label>
            <input
              className="fi"
              type="text"
              placeholder="@friend or 0x..."
              value={recipientHandle}
              onChange={(e) => {
                setRecipientHandle(e.target.value);
                setRecipientOnXmtp(null);
              }}
              onBlur={() => recipientHandle.trim() && checkRecipientXmtp()}
            />
            {recipientOnXmtp === true && (
              <div className="f-note" style={{ color: "var(--green)" }}>
                Recipient can receive XMTP messages
              </div>
            )}
            {recipientOnXmtp === false && (
              <div className="f-note" style={{ color: "var(--gray)" }}>
                Not on XMTP yet — use payment link below
              </div>
            )}
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
            <label>Note (What is this request for?)</label>
            <input
              className="fi"
              type="text"
              placeholder="e.g. Dinner, Rent split..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {recipientOnXmtp === true && (
            <button
              className="f-submit"
              onClick={sendDirectRequest}
              disabled={isSending || xmtpStatus !== "connected"}
              style={{ marginBottom: "10px" }}
            >
              {isSending ? "Sending..." : "Send Direct Request (XMTP)"}
            </button>
          )}

          {xmtpStatus === "connecting" && (
            <div className="gasless-note" style={{ marginBottom: "10px" }}>
              Enabling secure XMTP inbox…
            </div>
          )}

          <button
            className="f-submit"
            onClick={generateLink}
            style={
              recipientOnXmtp === true
                ? { background: "var(--gray-light)", color: "var(--ink)" }
                : undefined
            }
          >
            {recipientOnXmtp === true ? "Or Generate Payment Link" : "Generate Payment Link"}
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

      <div className="sc">
        <div className="sc-head">
          <span className="sc-title">Pending Requests</span>
        </div>
        <div style={{ padding: "0 18px" }}>
          {pendingRequests.length === 0 ? (
            <div className="text-sm text-[var(--gray)] py-6 text-center">
              No pending requests. You&apos;re all settled up!
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
                    onClick={() =>
                      acceptRequest(
                        req.id,
                        req.from,
                        req.fromAddress,
                        req.amount,
                        req.note,
                      )
                    }
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
