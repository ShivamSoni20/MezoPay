"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useDisconnect, useReadContract, usePublicClient, useWalletClient } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ConsentState,
  type AsyncStreamProxy,
  type Client,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { CONTRACTS, MUSD_ABI, REGISTRY_ABI } from "@/lib/contracts";
import { parseAbi } from "viem";
import {
  buildSignerFromWalletClient,
  handleIncomingMessage,
  registerXmtpClient,
  resumeXmtpClient,
  sendDmJson,
} from "@/lib/xmtp";

import { AppContext, type XmtpStatus } from "./context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const pathname = usePathname();
  const router = useRouter();

  // Toast state
  const [toastMsg, setToastMsg] = useState("");
  const [toastAmt, setToastAmt] = useState("");
  const [showToastBar, setShowToastBar] = useState(false);
  const [showXmtpModal, setShowXmtpModal] = useState(false);

  // Custom data states (empty by default, no fake data!)
  const [tabs, setTabs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  // XMTP state (OPFS: one tab per browser profile)
  const [xmtpClient, setXmtpClient] = useState<Client<unknown> | null>(null);
  const [xmtpStatus, setXmtpStatus] = useState<XmtpStatus>("disconnected");
  const [requestsVersion, setRequestsVersion] = useState(0);
  const xmtpClientRef = useRef<Client<unknown> | null>(null);
  const messageStreamRef = useRef<AsyncStreamProxy<DecodedMessage> | null>(null);
  const initInFlightRef = useRef(false);

  const { data: walletClient } = useWalletClient();

  const refreshRequests = useCallback(() => {
    setRequestsVersion((v) => v + 1);
  }, []);

  // Read Username
  const { data: rawUsername, refetch: refetchUsername, isLoading: isLoadingUsername } = useReadContract({
    address: CONTRACTS.USERNAME_REGISTRY,
    abi: parseAbi(REGISTRY_ABI),
    functionName: "reverseLookup",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Read MUSD Balance
  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.MUSD,
    abi: parseAbi(MUSD_ABI),
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const username = rawUsername ? (rawUsername as string) : null;
  const balance = rawBalance ? (rawBalance as bigint) : BigInt(0);
  const balanceFormatted = (Number(balance) / 1e18).toFixed(2);

  const [refetchGoldskyCount, setRefetchGoldskyCount] = useState(0);

  const refetchData = () => {
    refetchUsername();
    refetchBalance();
    setRefetchGoldskyCount((prev) => prev + 1);
  };


  // Compute dynamic split stats from active tabs state
  const owedAmount = tabs
    .filter((t) => !t.settled)
    .reduce((sum, t) => {
      const isCreator = t.creator?.toLowerCase() === address?.toLowerCase();
      if (isCreator) {
        return sum + (t.total - t.paid);
      }
      return sum;
    }, 0);

  const oweAmount = tabs
    .filter((t) => !t.settled)
    .reduce((sum, t) => {
      const isCreator = t.creator?.toLowerCase() === address?.toLowerCase();
      const isMember = t.members?.some((m: string) => m.toLowerCase().includes(address?.toLowerCase() || "") || m.toLowerCase() === username?.toLowerCase());
      
      if (!isCreator && isMember && t.paid === 0) {
        return sum + (t.total / (t.members.length || 1));
      }
      return sum;
    }, 0);

  const showToast = (message: string, amount?: string) => {
    setToastMsg(message);
    setToastAmt(amount || "");
    setShowToastBar(true);
  };

  useEffect(() => {
    if (showToastBar) {
      const timer = setTimeout(() => setShowToastBar(false), 3200);
      return () => clearTimeout(timer);
    }
  }, [showToastBar]);

  // Redirect to landing page if wallet is disconnected
  useEffect(() => {
    if (!isConnected || !address) {
      router.push("/");
    }
  }, [isConnected, address, router]);

  const cleanupXmtp = useCallback(async () => {
    if (messageStreamRef.current) {
      try {
        await messageStreamRef.current.return();
      } catch {
        // stream may already be closed
      }
      messageStreamRef.current = null;
    }
    if (xmtpClientRef.current) {
      try {
        xmtpClientRef.current.close();
      } catch {
        // ignore
      }
      xmtpClientRef.current = null;
    }
    setXmtpClient(null);
    setXmtpStatus("disconnected");
    initInFlightRef.current = false;
  }, []);

  const attachXmtpClient = useCallback(
    async (client: Client<unknown>, silent: boolean) => {
      await client.conversations.syncAll([ConsentState.Allowed, ConsentState.Unknown]);

      xmtpClientRef.current = client;
      setXmtpClient(client);
      setXmtpStatus("connected");

      const stream = await client.conversations.streamAllMessages({
        consentStates: [ConsentState.Allowed, ConsentState.Unknown],
        onValue: (message) => {
          if (!address) return;
          handleIncomingMessage(message, {
            connectedAddress: address,
            onRequestReceived: (amount, fromLabel) => {
              showToast(`Payment request from ${fromLabel}`, `$${amount.toFixed(2)}`);
              refetchData();
            },
            onPaymentCompleted: () => {
              showToast("Payment request settled!");
              refetchData();
            },
            onRequestsUpdated: refreshRequests,
          });
        },
        onError: (error) => {
          console.error("XMTP message stream error:", error);
        },
      });
      messageStreamRef.current = stream;

      if (!silent) {
        showToast("XMTP notifications enabled");
      }
    },
    [address, refreshRequests],
  );

  const resumeXmtp = useCallback(async (): Promise<boolean | null> => {
    if (!address || !walletClient || xmtpClientRef.current) {
      return !!xmtpClientRef.current;
    }
    if (initInFlightRef.current) {
      return null;
    }

    initInFlightRef.current = true;
    setXmtpStatus("connecting");

    try {
      const signer = buildSignerFromWalletClient(walletClient);
      const client = await resumeXmtpClient(signer);
      if (!client) {
        setXmtpStatus("disconnected");
        return false;
      }
      await attachXmtpClient(client, true);
      return true;
    } catch (err) {
      console.error("XMTP resume failed:", err);
      setXmtpStatus("disconnected");
      return false;
    } finally {
      initInFlightRef.current = false;
    }
  }, [address, walletClient, attachXmtpClient]);

  const initXmtp = useCallback(async (): Promise<boolean> => {
    if (!address || !walletClient) {
      showToast("Connect your wallet first");
      return false;
    }
    if (initInFlightRef.current) return false;
    if (xmtpClientRef.current) {
      showToast("XMTP notifications already enabled");
      return true;
    }

    initInFlightRef.current = true;
    setXmtpStatus("connecting");

    try {
      if (messageStreamRef.current) {
        try {
          await messageStreamRef.current.return();
        } catch {
          // ignore
        }
        messageStreamRef.current = null;
      }

      const signer = buildSignerFromWalletClient(walletClient);
      const resumed = await resumeXmtpClient(signer);
      if (!resumed) {
        showToast("Approve the XMTP signature in MetaMask");
      }
      const client = resumed ?? (await registerXmtpClient(signer));
      await attachXmtpClient(client, !!resumed);
      return true;
    } catch (err) {
      console.error("XMTP init failed:", err);
      setXmtpStatus("error");
      xmtpClientRef.current = null;
      setXmtpClient(null);
      const msg = err instanceof Error ? err.message : "XMTP setup failed";
      showToast(
        msg.includes("10/10")
          ? "XMTP installation limit reached — click Enable again to reset old devices"
          : msg.slice(0, 120),
      );
      return false;
    } finally {
      initInFlightRef.current = false;
    }
  }, [address, walletClient, attachXmtpClient]);

  // Silent resume when wallet connects (one-time MetaMask was already done).
  useEffect(() => {
    const checkXmtp = async () => {
      if (address && walletClient) {
        const success = await resumeXmtp();
        if (success === false) {
          const dismissed = sessionStorage.getItem(`xmtp_dismiss_${address}`);
          if (!dismissed) {
            setShowXmtpModal(true);
          }
        }
      } else {
        cleanupXmtp();
      }
    };
    checkXmtp();
  }, [address, walletClient?.account?.address]);

  const sendPaymentRequest = useCallback(
    async (
      toAddress: string,
      toUsername: string,
      amount: number,
      note: string,
      requestId?: string,
    ): Promise<boolean> => {
      const client = xmtpClientRef.current;
      if (!client || !address) return false;

      const id = requestId ?? `req-${Date.now()}`;
      const payload = {
        type: "mezopay_request" as const,
        id,
        fromAddress: address.toLowerCase(),
        fromUsername: username || "",
        toAddress: toAddress.toLowerCase(),
        toUsername,
        amount,
        note,
        timestamp: Math.floor(Date.now() / 1000),
      };

      try {
        await sendDmJson(client, toAddress, payload);
        return true;
      } catch (err) {
        console.error("Failed to send payment request via XMTP:", err);
        return false;
      }
    },
    [address, username],
  );

  const notifyPaymentCompleted = useCallback(
    async (requestId: string, toAddress: string) => {
      const client = xmtpClientRef.current;
      if (!client || !address) return;

      try {
        await sendDmJson(client, toAddress, {
          type: "mezopay_payment_completed",
          requestId,
          fromAddress: address.toLowerCase(),
          timestamp: Math.floor(Date.now() / 1000),
        });
      } catch (err) {
        console.error("Failed to notify payment completion via XMTP:", err);
      }
    },
    [address],
  );

  // Load real-time indexed records from Goldsky
  useEffect(() => {
    if (!address) return;

    const fetchGoldskyData = async () => {
      try {
        const query = `
          query GetUserData($user: String!, $userBytes: Bytes!) {
            users(where: { id: $user }) {
              id
              username
              createdAt
            }
            tabs(first: 100, orderBy: createdAt, orderDirection: desc) {
              id
              creator
              title
              members
              shares
              settled
              paidCount
              createdAt
            }
            tabPayments(where: { member: $userBytes }) {
              id
              amount
              timestamp
              member
              tab {
                id
                title
                creator
              }
            }
            receivedTabPayments: tabPayments(first: 100, orderBy: timestamp, orderDirection: desc) {
              id
              amount
              timestamp
              member
              tab {
                id
                title
                creator
              }
            }
            sentTransfers: transfers(
              first: 100,
              orderBy: timestamp,
              orderDirection: desc,
              where: { from: $userBytes }
            ) {
              id
              from
              to
              amount
              txHash
              timestamp
              blockNumber
            }
            receivedTransfers: transfers(
              first: 100,
              orderBy: timestamp,
              orderDirection: desc,
              where: { to: $userBytes }
            ) {
              id
              from
              to
              amount
              txHash
              timestamp
              blockNumber
            }
            potDeposits(where: { user: $userBytes }) {
              id
              amount
              timestamp
              pot {
                id
                name
              }
            }
            potWithdrawals(where: { user: $userBytes }) {
              id
              amount
              timestamp
              pot {
                id
                name
              }
            }
          }
        `;

        const goldskyUrl = process.env.NEXT_PUBLIC_GOLDSKY_URL;
        if (!goldskyUrl) return;

        const response = await fetch(goldskyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            variables: {
              user: address.toLowerCase(),
              userBytes: address.toLowerCase(),
            },
          }),
        });

        const result = await response.json();
        if (result.data) {
          const { tabs: fetchedTabs, tabPayments, receivedTabPayments, sentTransfers, receivedTransfers, potDeposits, potWithdrawals } = result.data;
          
          if (fetchedTabs && fetchedTabs.length > 0) {
            // Filter tabs where user is either creator OR a member
            const relevantTabs = fetchedTabs.filter((t: any) => {
              const isCreator = t.creator.toLowerCase() === address.toLowerCase();
              const isMember = t.members.some((m: string) => m.toLowerCase() === address.toLowerCase() || (username && m.toLowerCase() === username.toLowerCase()));
              return isCreator || isMember;
            });

            const formattedTabs = relevantTabs.map((t: any) => {
              const totalAmount = Number(t.shares.reduce((a: string, b: string) => BigInt(a) + BigInt(b), BigInt(0))) / 1e18;
              const isCreator = t.creator.toLowerCase() === address.toLowerCase();
              
              let totalPaid = 0;
              const creatorIndex = t.members.findIndex((m: string) => m.toLowerCase() === t.creator.toLowerCase());
              if (creatorIndex >= 0) {
                totalPaid += Number(t.shares[creatorIndex]) / 1e18;
              }
              
              if (t.settled) {
                totalPaid = totalAmount;
              } else if (tabPayments) {
                const paymentsForTab = tabPayments.filter((p: any) => p.tab.id === t.id);
                totalPaid += paymentsForTab.reduce((sum: number, p: any) => sum + (Number(p.amount) / 1e18), 0);
              }

              return {
                id: t.id,
                title: t.title,
                creator: t.creator,
                members: t.members.map((m: string) => m.startsWith("0x") ? (m.slice(0, 6) + "..." + m.slice(-4)) : m),
                total: totalAmount,
                paid: totalPaid,
                settled: t.settled,
              };
            });

            setTabs((prev) => {
              const ids = new Set(formattedTabs.map((t: any) => t.id));
              return [...formattedTabs, ...prev.filter((t) => !ids.has(t.id))];
            });
          }

          const dynamicHistory: any[] = [];
          
          if (fetchedTabs) {
            const relevantTabs = fetchedTabs.filter((t: any) => {
              const isCreator = t.creator.toLowerCase() === address.toLowerCase();
              const isMember = t.members.some((m: string) => m.toLowerCase() === address.toLowerCase() || (username && m.toLowerCase() === username.toLowerCase()));
              return isCreator || isMember;
            });

            relevantTabs.forEach((t: any) => {
              const isCreator = t.creator.toLowerCase() === address.toLowerCase();
              dynamicHistory.push({
                id: `goldsky-tab-${t.id}`,
                type: "split",
                title: `Split: ${t.title}`,
                detail: isCreator ? "Group Tab Created" : "Invited to Bill Split",
                amount: isCreator ? (Number(t.shares.reduce((a: string, b: string) => BigInt(a) + BigInt(b), BigInt(0))) / 1e18) : -(Number(t.shares[0] || 0) / 1e18),
                date: new Date(Number(t.createdAt) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hash: t.id,
                timestamp: Number(t.createdAt),
              });
            });
          }

          if (tabPayments) {
            tabPayments.forEach((p: any) => {
              dynamicHistory.push({
                id: `goldsky-pay-${p.id}`,
                type: "split",
                title: `Paid for Split: ${p.tab.title}`,
                detail: `Sent to ${p.tab.creator.slice(0, 6)}...${p.tab.creator.slice(-4)}`,
                amount: -(Number(p.amount) / 1e18),
                date: new Date(Number(p.timestamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hash: p.id.split("-")[0],
                timestamp: Number(p.timestamp),
              });
            });
          }

          if (receivedTabPayments) {
            // Filter locally to only include payments for tabs created by this user
            const myReceived = receivedTabPayments.filter((p: any) => p.tab.creator.toLowerCase() === address.toLowerCase());
            myReceived.forEach((p: any) => {
              dynamicHistory.push({
                id: `goldsky-recv-pay-${p.id}`,
                type: "split",
                title: `Received Split Payment`,
                detail: `From ${p.member.slice(0, 6)}...${p.member.slice(-4)} for ${p.tab.title}`,
                amount: Number(p.amount) / 1e18,
                date: new Date(Number(p.timestamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hash: p.id.split("-")[0],
                timestamp: Number(p.timestamp),
              });
            });
          }

          // Process MUSD sent transfers (user is sender)
          if (sentTransfers) {
            for (const tx of sentTransfers) {
              const toAddr = tx.to as string;
              // Resolve username for the receiver
              let toLabel = `${toAddr.slice(0, 6)}...${toAddr.slice(-4)}`;
              if (publicClient) {
                try {
                  const rUsername = await publicClient.readContract({
                    address: CONTRACTS.USERNAME_REGISTRY,
                    abi: parseAbi(REGISTRY_ABI),
                    functionName: "reverseLookup",
                    args: [toAddr as `0x${string}`],
                  }) as string;
                  if (rUsername) toLabel = `@${rUsername}`;
                } catch {}
              }
              dynamicHistory.push({
                id: `goldsky-sent-${tx.id}`,
                type: "sent",
                title: `Sent to ${toLabel}`,
                detail: "MUSD Transfer",
                amount: -(Number(tx.amount) / 1e18),
                date: new Date(Number(tx.timestamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hash: tx.txHash,
                timestamp: Number(tx.timestamp),
              });
            }
          }

          // Process MUSD received transfers (user is receiver)
          if (receivedTransfers) {
            for (const tx of receivedTransfers) {
              const fromAddr = tx.from as string;
              // Resolve username for the sender
              let fromLabel = `${fromAddr.slice(0, 6)}...${fromAddr.slice(-4)}`;
              if (publicClient) {
                try {
                  const sUsername = await publicClient.readContract({
                    address: CONTRACTS.USERNAME_REGISTRY,
                    abi: parseAbi(REGISTRY_ABI),
                    functionName: "reverseLookup",
                    args: [fromAddr as `0x${string}`],
                  }) as string;
                  if (sUsername) fromLabel = `@${sUsername}`;
                } catch {}
              }
              dynamicHistory.push({
                id: `goldsky-recv-${tx.id}`,
                type: "received",
                title: `Received from ${fromLabel}`,
                detail: "MUSD Transfer",
                amount: Number(tx.amount) / 1e18,
                date: new Date(Number(tx.timestamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hash: tx.txHash,
                timestamp: Number(tx.timestamp),
              });
            }
          }

          if (potDeposits) {
            potDeposits.forEach((d: any) => {
              dynamicHistory.push({
                id: `goldsky-pot-dep-${d.id}`,
                type: "saving pots history",
                title: `Deposited to ${d.pot.name}`,
                detail: "Savings Pot",
                amount: -(Number(d.amount) / 1e18),
                date: new Date(Number(d.timestamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hash: d.id.split("-")[0],
                timestamp: Number(d.timestamp),
              });
            });
          }

          if (potWithdrawals) {
            potWithdrawals.forEach((w: any) => {
              dynamicHistory.push({
                id: `goldsky-pot-with-${w.id}`,
                type: "saving pots history",
                title: `Withdrew from ${w.pot.name}`,
                detail: "Savings Pot",
                amount: Number(w.amount) / 1e18,
                date: new Date(Number(w.timestamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                hash: w.id.split("-")[0],
                timestamp: Number(w.timestamp),
              });
            });
          }

          // Load off-chain requests from LocalStorage
          let localRequests: any[] = [];
          if (typeof window !== "undefined") {
            try {
              const reqsStr = localStorage.getItem("mezopay_requests");
              if (reqsStr) {
                localRequests = JSON.parse(reqsStr);
              }
            } catch (err) {}
          }

          // Format pending requests for history
          for (const req of localRequests) {
            if (req.status !== "pending") continue;

            const isRequester = req.fromAddress?.toLowerCase() === address.toLowerCase();
            const isRequestee = req.toAddress?.toLowerCase() === address.toLowerCase();

            if (isRequester) {
              const toLabel = req.toUsername ? `@${req.toUsername}` : `${req.toAddress.slice(0, 6)}...${req.toAddress.slice(-4)}`;
              dynamicHistory.push({
                id: `local-req-${req.id}`,
                type: "received", // Positive/incoming for the requester
                title: `Requested from ${toLabel}`,
                detail: req.note || "Quick Request",
                amount: req.amount,
                date: "Pending",
                hash: req.id,
                timestamp: req.timestamp,
              });
            } else if (isRequestee) {
              const fromLabel = req.fromUsername ? `@${req.fromUsername}` : `${req.fromAddress.slice(0, 6)}...${req.fromAddress.slice(-4)}`;
              dynamicHistory.push({
                id: `local-req-${req.id}`,
                type: "sent", // Negative/outgoing for the requestee
                title: `Request from ${fromLabel}`,
                detail: req.note || "Quick Request",
                amount: -req.amount,
                date: "Pending",
                hash: req.id,
                timestamp: req.timestamp,
              });
            }
          }

          // Build dynamic friends list
          const friendMap = new Map<string, { address: string; name: string; handle: string; balance: number; status: "owes" | "owed" | "settled"; note: string }>();

          // 1. Process transfers to populate contacts
          if (sentTransfers) {
            for (const tx of sentTransfers) {
              const target = tx.to.toLowerCase();
              if (target === address.toLowerCase()) continue;
              if (!friendMap.has(target)) {
                friendMap.set(target, {
                  address: target,
                  name: `${target.slice(0, 6)}...${target.slice(-4)}`,
                  handle: target,
                  balance: 0,
                  status: "settled",
                  note: "Active contact",
                });
              }
            }
          }

          if (receivedTransfers) {
            for (const tx of receivedTransfers) {
              const target = tx.from.toLowerCase();
              if (target === address.toLowerCase()) continue;
              if (!friendMap.has(target)) {
                friendMap.set(target, {
                  address: target,
                  name: `${target.slice(0, 6)}...${target.slice(-4)}`,
                  handle: target,
                  balance: 0,
                  status: "settled",
                  note: "Active contact",
                });
              }
            }
          }

          // 2. Process tabs to populate contacts and calculate debt
          if (fetchedTabs) {
            for (const t of fetchedTabs) {
              const creator = t.creator.toLowerCase();
              const isCreator = creator === address.toLowerCase();

              // Add creator as contact if it's someone else
              if (!isCreator) {
                if (!friendMap.has(creator)) {
                  friendMap.set(creator, {
                    address: creator,
                    name: `${creator.slice(0, 6)}...${creator.slice(-4)}`,
                    handle: creator,
                    balance: 0,
                    status: "settled",
                    note: "Group tab creator",
                  });
                }
              }

              // Add members as contacts
              for (let idx = 0; idx < t.members.length; idx++) {
                const member = t.members[idx].toLowerCase();
                if (member === address.toLowerCase()) continue;

                if (!friendMap.has(member)) {
                  friendMap.set(member, {
                    address: member,
                    name: member.startsWith("0x") ? `${member.slice(0, 6)}...${member.slice(-4)}` : member,
                    handle: member,
                    balance: 0,
                    status: "settled",
                    note: "Tab member",
                  });
                }
              }

              // Calculate debt if tab is unsettled
              if (!t.settled) {
                const totalAmount = Number(t.shares.reduce((a: string, b: string) => BigInt(a) + BigInt(b), BigInt(0))) / 1e18;
                
                if (isCreator) {
                  const shareCount = t.members.length || 1;
                  const perMemberShare = totalAmount / shareCount;

                  for (let idx = 0; idx < t.members.length; idx++) {
                    const member = t.members[idx].toLowerCase();
                    if (member === address.toLowerCase()) continue;

                    const contact = friendMap.get(member);
                    if (contact) {
                      contact.balance += perMemberShare;
                      contact.status = "owes";
                      contact.note = `owes share for "${t.title}"`;
                    }
                  }
                } else {
                  const hasPaidThisTab = tabPayments && tabPayments.some((p: any) => p.tab.id === t.id);
                  if (!hasPaidThisTab) {
                    const shareCount = t.members.length || 1;
                    const userIndex = t.members.findIndex((m: string) => m.toLowerCase() === address.toLowerCase() || (username && m.toLowerCase() === username.toLowerCase()));
                    const userShare = userIndex !== -1 && t.shares[userIndex] 
                      ? Number(t.shares[userIndex]) / 1e18 
                      : totalAmount / shareCount;

                    const creatorContact = friendMap.get(creator);
                    if (creatorContact) {
                      creatorContact.balance -= userShare;
                      creatorContact.status = "owed";
                      creatorContact.note = `you owe for "${t.title}"`;
                    }
                  }
                }
              }
            }
          }

          // 3. Resolve usernames asynchronously
          const resolvedFriends = Array.from(friendMap.values());
          Promise.all(resolvedFriends.map(async (friend) => {
            if (friend.address.startsWith("0x") && publicClient) {
              try {
                const u = await publicClient.readContract({
                  address: CONTRACTS.USERNAME_REGISTRY,
                  abi: parseAbi(REGISTRY_ABI),
                  functionName: "reverseLookup",
                  args: [friend.address as `0x${string}`],
                }) as string;
                if (u) {
                  friend.name = `@${u}`;
                  friend.handle = u;
                }
              } catch {}
            }
          })).then(() => {
            setFriends(resolvedFriends);
          });

          if (dynamicHistory.length > 0) {
            setHistory((prev) => {
              const ids = new Set(dynamicHistory.map((h) => h.id));
              const merged = [...dynamicHistory, ...prev.filter((h) => !ids.has(h.id))];

              // Sort entire merged history: Pending first, then by timestamp desc
              merged.sort((a, b) => {
                const aPending = a.date === "Pending";
                const bPending = b.date === "Pending";
                if (aPending && !bPending) return -1;
                if (!aPending && bPending) return 1;

                const aTime = a.timestamp || (a.id.startsWith("tx-") ? Number(a.id.split("-")[1]) / 1000 : 0);
                const bTime = b.timestamp || (b.id.startsWith("tx-") ? Number(b.id.split("-")[1]) / 1000 : 0);
                return bTime - aTime;
              });

              return merged;
            });
          }
        }
      } catch (err) {
        console.error("Goldsky indexing fetch failed:", err);
      }
    };

    fetchGoldskyData();
  }, [address, refetchGoldskyCount]);

  // Loading state while redirecting
  if (!isConnected || !address) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Sidebar items
  const menuItems = [
    { label: "Dashboard", icon: "🏠", path: "/app/dashboard" },
    { label: "Send MUSD", icon: "↑", path: "/app/send" },
    { label: "Request", icon: "↓", path: "/app/request" },
    { label: "Split Tab", icon: "⚖️", path: "/app/split" },
    { label: "Savings Pots", icon: "🏺", path: "/app/earn", badge: "Live", badgeClass: "green" },
    { label: "Virtual Card", icon: "💳", path: "/app/card", badge: "Demo", badgeClass: "blue" },
    { label: "History", icon: "📋", path: "/app/history" },
    { label: "Friends", icon: "👥", path: "/app/friends" },
    { label: "Settings", icon: "⚙️", path: "/app/settings" },
  ];

  return (
    <AppContext.Provider
      value={{
        address,
        username,
        balance,
        balanceFormatted,
        refetchData,
        showToast,
        tabs,
        setTabs,
        history,
        setHistory,
        friends,
        setFriends,
        owedAmount,
        oweAmount,
        xmtpClient,
        xmtpStatus,
        requestsVersion,
        initXmtp,
        sendPaymentRequest,
        notifyPaymentCompleted,
        refreshRequests,
      }}
    >
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="s-logo">
            MezoPay<span>.</span>
          </div>
          <div className="s-user">
            <div className="s-av">
              {username ? username[0].toUpperCase() : (address ? address.slice(2, 4).toUpperCase() : "M")}
            </div>
            <div>
              <div className="s-name" style={{ color: "var(--orange)", fontWeight: 800 }}>
                {username ? `@${username}` : "No Username"}
              </div>
              <div className="s-addr" style={{ fontSize: "0.72rem", color: "var(--gray)", marginTop: "2px", fontFamily: "monospace" }}>
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
              </div>
              <div className="s-bal" style={{ marginTop: "4px" }}>${balanceFormatted} MUSD</div>
            </div>
          </div>
          <nav className="s-nav">
            <div className="s-sec-lbl">Main</div>
            {menuItems.slice(0, 4).map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${pathname === item.path ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div className="s-sec-lbl" style={{ marginTop: "8px" }}>
              Finance
            </div>
            {menuItems.slice(4, 6).map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${pathname === item.path ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className={`n-badge ${item.badgeClass === "green" ? "green" : item.badgeClass === "blue" ? "blue" : ""}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="s-sec-lbl" style={{ marginTop: "8px" }}>
              Activity
            </div>
            {menuItems.slice(6, 8).map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${pathname === item.path ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div className="s-sec-lbl" style={{ marginTop: "8px" }}>
              Account
            </div>
            {menuItems.slice(8).map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${pathname === item.path ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="s-footer" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="net-chip">
              <span className="net-dot"></span>Mezo Testnet · 31611
            </div>
            <button
              type="button"
              className="net-chip"
              disabled={xmtpStatus === "connecting" || xmtpStatus === "connected"}
              onClick={() => initXmtp()}
              style={{
                cursor:
                  xmtpStatus === "connected" || xmtpStatus === "connecting"
                    ? "default"
                    : "pointer",
                border: "none",
                width: "100%",
                textAlign: "left",
                opacity: xmtpStatus === "connecting" ? 0.7 : 1,
              }}
              title={
                xmtpStatus === "connected"
                  ? "XMTP notifications active"
                  : xmtpStatus === "connecting"
                    ? "Confirm the signature in MetaMask"
                    : "Enable encrypted payment request notifications (MetaMask signature)"
              }
            >
              <span
                className="net-dot"
                style={{
                  background:
                    xmtpStatus === "connected"
                      ? "var(--green)"
                      : xmtpStatus === "connecting"
                        ? "var(--orange)"
                        : xmtpStatus === "error"
                          ? "var(--red)"
                          : "var(--gray)",
                }}
              ></span>
              {xmtpStatus === "connected"
                ? "XMTP · Live"
                : xmtpStatus === "connecting"
                  ? "XMTP · Confirm in wallet"
                  : xmtpStatus === "error"
                    ? "Enable XMTP · Retry"
                    : "Enable XMTP Notifications"}
            </button>
            <button
              onClick={() => {
                disconnect();
                router.push("/");
              }}
              style={{
                width: "100%",
                background: "var(--red-light)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: "9px",
                padding: "8px 12px",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--red)",
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.15s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#FEE2E2";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "var(--red-light)";
              }}
            >
              🚪 Disconnect Wallet
            </button>
          </div>
        </aside>

        {/* MAIN SHELL */}
        <main className="main">
          <div className="topbar">
            <div className="tb-title">
              {menuItems.find((item) => item.path === pathname)?.label || "Dashboard"}
            </div>
            <div className="tb-right"></div>
          </div>

          {/* PAGE CONTENT */}
          <div className="page">
            {!isLoadingUsername && !username && pathname !== "/app/settings" ? (
              <div style={{ textAlign: "center", padding: "100px 20px", background: "white", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>👋</div>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>Welcome to MezoPay</h2>
                <p style={{ color: "var(--gray)", marginBottom: "24px" }}>You need to claim a @username to start sending and receiving money.</p>
                <button 
                  onClick={() => router.push("/app/settings")}
                  style={{ background: "var(--orange)", color: "white", padding: "12px 24px", borderRadius: "8px", fontWeight: 700 }}
                >
                  Claim @username →
                </button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <div className="mobile-bottom-nav" style={{ display: "none" }}>
          {menuItems.slice(0, 6).map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`m-nav-item ${pathname === item.path ? "active" : ""}`}
            >
              <span className="m-icon">{item.icon}</span>
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          ))}
          <Link
            href="/app/settings"
            className={`m-nav-item ${pathname === "/app/settings" ? "active" : ""}`}
          >
            <span className="m-icon">⚙️</span>
            <span>Settings</span>
          </Link>
        </div>

        {/* XMTP Enable Modal */}
        {showXmtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white p-6 rounded-xl shadow-xl" style={{ background: "white", padding: "24px", borderRadius: "14px", border: "1px solid var(--border)", maxWidth: "400px", width: "100%", margin: "0 16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
              <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.25rem", fontWeight: 800, marginBottom: "8px" }}>Enable XMTP Messages</h3>
              <p className="text-sm mb-6" style={{ fontSize: "0.875rem", color: "var(--gray)", marginBottom: "24px" }}>
                Sign a message in your wallet to enable encrypted notifications and payment requests via XMTP.
              </p>
              <div className="flex gap-3" style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    if (address) sessionStorage.setItem(`xmtp_dismiss_${address}`, "1");
                    setShowXmtpModal(false);
                  }}
                  style={{ flex: 1, padding: "10px 16px", background: "var(--gray-light)", border: "1px solid var(--border)", borderRadius: "9px", fontSize: "0.875rem", fontWeight: 700, color: "var(--dark)", cursor: "pointer" }}
                >
                  Skip for now
                </button>
                <button
                  onClick={async () => {
                    setShowXmtpModal(false);
                    await initXmtp();
                  }}
                  style={{ flex: 1, padding: "10px 16px", background: "var(--orange)", border: "none", borderRadius: "9px", fontSize: "0.875rem", fontWeight: 700, color: "white", cursor: "pointer", boxShadow: "0 4px 12px rgba(249,115,22,0.2)" }}
                >
                  Enable XMTP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST SYSTEM */}
        <div id="toast" className={showToastBar ? "show" : ""}>
          <span id="toastMsg">{toastMsg}</span>
          {toastAmt && <span className="t-amt">{toastAmt}</span>}
        </div>
      </div>
    </AppContext.Provider>
  );
}
