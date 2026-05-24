"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../context";
import { useReadContract, useWriteContract, usePublicClient, useAccount } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, MUSD_ABI, SAVINGS_POT_ABI, REGISTRY_ABI } from "@/lib/contracts";
import { canRecipientMessage } from "@/lib/xmtp";

export default function SavingsPage() {
  const { balanceFormatted, showToast, refetchData, xmtpClient, xmtpStatus, initXmtp } = useApp();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [pots, setPots] = useState<any[]>([]);
  const [activeView, setActiveView] = useState("main"); // 'main' or 'activity'
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Create Pot State
  const [createStep, setCreateStep] = useState(1);
  const [potType, setPotType] = useState("solo");
  const [potEmoji, setPotEmoji] = useState("✈️");
  const [potName, setPotName] = useState("");
  const [potTarget, setPotTarget] = useState("");
  const [potUnlockDate, setPotUnlockDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Withdraw / Settle
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Deposit State
  const [depositAmt, setDepositAmt] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  
  // Invite State
  const [inviteHandle, setInviteHandle] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  
  // Fetch pot count
  const { data: potCount } = useReadContract({
    address: CONTRACTS.SAVINGS_POT,
    abi: SAVINGS_POT_ABI,
    functionName: "potCount",
  });

  // Load pots (real chain data augmented with fallback mock data)
  useEffect(() => {
    async function loadPots() {
      if (!publicClient) return;
      
      try {
        let realPots = [];
        const goldskyUrl = process.env.NEXT_PUBLIC_GOLDSKY_URL;
        
        if (goldskyUrl) {
          const query = `
            {
              savingsPots(orderBy: createdAt, orderDirection: desc) {
                id
                creator
                name
                targetAmount
                totalDeposited
                unlockTime
                createdAt
                deposits {
                  user
                  amount
                }
                withdrawals {
                  user
                  amount
                }
              }
            }
          `;
          const res = await fetch(goldskyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          const { data } = await res.json();
          if (data && data.savingsPots && data.savingsPots.length > 0) {
            realPots = data.savingsPots.map((p: any) => {
              const target = Number(p.targetAmount) / 1e18;
              const saved = Number(p.totalDeposited) / 1e18;
              const unlockDateObj = new Date(Number(p.unlockTime) * 1000);
              const unlockDate = unlockDateObj.toISOString().split('T')[0];
              const daysLeft = Math.max(0, Math.ceil((unlockDateObj.getTime() - Date.now()) / 86400000));
              const type = p.creator.toLowerCase() === address?.toLowerCase() ? 'solo' : 'group';
              
              const userAddress = address?.toLowerCase() || "";
              
              // Calculate user's net balance in the pot
              const userDeposits = (p.deposits || [])
                .filter((d: any) => d.user.toLowerCase() === userAddress)
                .reduce((sum: number, d: any) => sum + (Number(d.amount) / 1e18), 0);
                
              const userWithdrawals = (p.withdrawals || [])
                .filter((w: any) => w.user.toLowerCase() === userAddress)
                .reduce((sum: number, w: any) => sum + (Number(w.amount) / 1e18), 0);
                
              const userBalance = Math.max(0, userDeposits - userWithdrawals);
              const hasClaimed = userWithdrawals > 0 && userBalance === 0;
              
              return {
                id: p.id,
                type,
                emoji: '🏺',
                name: p.name,
                target,
                saved,
                unlockDate,
                daysLeft,
                userBalance,
                hasClaimed,
                members: [{ handle: type === 'solo' ? 'you' : p.creator.slice(0, 6), color: '#F97316', paid: true, share: target }]
              };
            });
          }
        }
        
        if (realPots.length > 0) {
          setPots(realPots);
        } else {
          setPots([{
            id: 'mock-1', type: 'solo', emoji: '🏺', name: 'My First Pot',
            target: 1000, saved: 0, unlockDate: '2027-01-01',
            daysLeft: 365,
            members: [{ handle: 'you', color: '#F97316', paid: true, share: 1000 }]
          }]);
        }
      } catch (e) {
        console.error("Failed to fetch pots", e);
      }
    }
    loadPots();
  }, [publicClient, address]);

  const handleCreatePot = async () => {
    if (!potName || !potTarget || !potUnlockDate || !publicClient) return;
    setIsCreating(true);
    try {
      const unlockTimeMs = new Date(potUnlockDate).getTime();
      if (unlockTimeMs <= Date.now()) throw new Error("Unlock date must be in future");
      const lockSeconds = Math.floor((unlockTimeMs - Date.now()) / 1000);
      
      showToast("Creating Saving Pot on-chain...");
      
      const hash = await writeContractAsync({
        address: CONTRACTS.SAVINGS_POT,
        abi: parseAbi(SAVINGS_POT_ABI),
        functionName: "createPot",
        args: [potName, parseUnits(potTarget, 18), BigInt(lockSeconds)],
      });
      
      showToast("Waiting for confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      let onChainPotId = hash; // fallback
      const log = receipt.logs.find(l => l.address.toLowerCase() === CONTRACTS.SAVINGS_POT.toLowerCase());
      if (log && log.topics[1]) {
        onChainPotId = log.topics[1];
      }
      
      showToast("Pot created successfully!");
      setShowCreateModal(false);
      
      const daysLeft = Math.ceil(lockSeconds / 86400);
      
      // Add a dummy pot to state to show it immediately
      setPots([{
        id: onChainPotId, type: potType, emoji: potEmoji, name: potName,
        target: Number(potTarget), saved: 0, unlockDate: potUnlockDate,
        daysLeft,
        members: [{ handle: 'you', color: '#F97316', paid: true, share: Number(potTarget) }],
        isReal: true
      }, ...pots]);
      
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to create pot");
    } finally {
      setIsCreating(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedPotId || !publicClient) return;
    if (!selectedPotId.startsWith("0x")) return showToast("This is a mock pot!");
    setIsWithdrawing(true);
    try {
      showToast("Withdrawing funds...");
      const hash = await writeContractAsync({
        address: CONTRACTS.SAVINGS_POT,
        abi: parseAbi(SAVINGS_POT_ABI),
        functionName: "withdraw",
        args: [selectedPotId as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      showToast("Withdrawn successfully!");
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to withdraw");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleCreatorSettle = async () => {
    if (!selectedPotId || !publicClient) return;
    if (!selectedPotId.startsWith("0x")) return showToast("This is a mock pot!");
    setIsSettling(true);
    try {
      showToast("Unlocking pot early...");
      const hash = await writeContractAsync({
        address: CONTRACTS.SAVINGS_POT,
        abi: parseAbi(SAVINGS_POT_ABI),
        functionName: "creatorUnlock",
        args: [selectedPotId as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      showToast("Pot unlocked successfully!");
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to unlock");
    } finally {
      setIsSettling(false);
    }
  };

  const handleClaim = async () => {
    if (!selectedPotId || !publicClient) return;
    if (!selectedPotId.startsWith("0x")) return showToast("This is a mock pot!");
    setIsClaiming(true);
    try {
      showToast("Unlocking pot (Goal Met)...");
      const unlockHash = await writeContractAsync({
        address: CONTRACTS.SAVINGS_POT,
        abi: parseAbi(SAVINGS_POT_ABI),
        functionName: "creatorUnlock",
        args: [selectedPotId as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: unlockHash });

      showToast("Claiming funds...");
      const withdrawHash = await writeContractAsync({
        address: CONTRACTS.SAVINGS_POT,
        abi: parseAbi(SAVINGS_POT_ABI),
        functionName: "withdraw",
        args: [selectedPotId as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: withdrawHash });
      
      showToast("Goal funds claimed successfully! 🎉");
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to claim");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmt || !selectedPotId || !publicClient) return;
    if (!selectedPotId.startsWith("0x")) {
      return showToast("Cannot deposit into a mock pot! Create a real one first.");
    }
    setIsDepositing(true);
    try {
      showToast("Approving MUSD...");
      const amountWei = parseUnits(depositAmt, 18);
      const approveHash = await writeContractAsync({
        address: CONTRACTS.MUSD,
        abi: parseAbi(MUSD_ABI),
        functionName: "approve",
        args: [CONTRACTS.SAVINGS_POT, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      
      showToast("Depositing to pot...");
      const depositHash = await writeContractAsync({
        address: CONTRACTS.SAVINGS_POT,
        abi: parseAbi(SAVINGS_POT_ABI),
        functionName: "deposit",
        args: [selectedPotId as `0x${string}`, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      
      showToast(`Deposited $${depositAmt} MUSD!`);
      setShowDepositModal(false);
      setDepositAmt("");
      refetchData();
      
      // Optimistic update
      setPots(pots.map(p => p.id === selectedPotId ? { ...p, saved: p.saved + Number(depositAmt) } : p));
      
    } catch (err) {
      console.error(err);
      showToast("Failed to deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteHandle || !activePot || !publicClient) return;
    setIsInviting(true);
    try {
      let xmtpReady = xmtpStatus === "connected";
      if (!xmtpReady) {
        showToast("Please enable XMTP to send invites");
        xmtpReady = await initXmtp();
        if (!xmtpReady) {
          setIsInviting(false);
          return;
        }
      }

      const cleanHandle = inviteHandle.replace("@", "").trim().toLowerCase();
      let resolvedAddress: `0x${string}` = "0x0000000000000000000000000000000000000000";
      const isDirectAddress = cleanHandle.startsWith("0x") && cleanHandle.length === 42;

      if (isDirectAddress) {
        resolvedAddress = cleanHandle as `0x${string}`;
      } else {
        showToast(`Resolving @${cleanHandle}...`);
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

      if (resolvedAddress === "0x0000000000000000000000000000000000000000") {
        showToast(`Error: User not registered.`);
        setIsInviting(false);
        return;
      }

      const reachable = await canRecipientMessage(resolvedAddress);
      if (!reachable) {
        showToast(`Recipient is not on XMTP network yet.`);
        setIsInviting(false);
        return;
      }

      if (xmtpClient) {
        const conversation = await xmtpClient.conversations.createGroup([resolvedAddress]);
        const inviteMessage = `Join my Savings Pot! 🏺 ${activePot.emoji} ${activePot.name}\nTarget: $${activePot.target} MUSD\nPot ID: ${activePot.id}\nLet's save together on MezoPay!`;
        await conversation.sendText(inviteMessage);
        
        showToast(`Invite sent to ${isDirectAddress ? "wallet" : `@${cleanHandle}`} via XMTP!`);
        setShowInviteModal(false);
        setInviteHandle("");
      } else {
        showToast("XMTP client not ready");
      }
    } catch (e: any) {
      console.error("Invite error", e);
      showToast(e.message || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const activePot = pots.find(p => p.id === selectedPotId);
  const totalSaved = pots.reduce((sum, p) => sum + p.saved, 0);

  return (
    <div className="savings-wrapper">
      <style>{`
        .savings-wrapper { font-family: 'DM Sans', sans-serif; color: #1A1108; }
        .tb-right { display: flex; gap: 10px; margin-bottom: 20px; justify-content: flex-end; }
        .tb-btn { padding: 8px 15px; border-radius: 8px; border: 1px solid #E5E7EB; background: white; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .tb-btn:hover { background: #F9FAFB; }
        .tb-btn.primary { background: #F97316; color: white; border-color: #F97316; }
        .tb-btn.primary:hover { background: #EA6500; }
        
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
        .stat-card { background: white; border-radius: 14px; border: 1px solid #E5E7EB; padding: 18px 20px; }
        .stat-card.accent { background: linear-gradient(135deg, #1A1108, #3D2000); border-color: #3D2000; color: white; }
        .sc-lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; margin-bottom: 7px; }
        .sc-val { font-family: 'Syne', sans-serif; font-size: 1.55rem; font-weight: 800; line-height: 1; }
        .sc-sub { font-size: 0.72rem; margin-top: 5px; color: #6B7280; }
        .stat-card.accent .sc-sub { color: rgba(255,255,255,0.7); }
        .sc-chg { font-size: 0.74rem; font-weight: 700; margin-top: 4px; color: #22C55E; }

        .savings-layout { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; margin-bottom: 18px; }
        
        .sc { background: white; border-radius: 14px; border: 1px solid #E5E7EB; overflow: hidden; }
        .sc-head { display: flex; align-items: center; justify-content: space-between; padding: 15px 18px; border-bottom: 1px solid #E5E7EB; }
        .sc-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.92rem; }
        
        .pots-grid { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
        .pot-card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 15px; cursor: pointer; transition: all 0.2s; background: white; }
        .pot-card:hover { border-color: #FDBA74; box-shadow: 0 4px 16px rgba(249,115,22,0.08); }
        .pot-card.selected { border-color: #F97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
        .pot-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .pot-emoji { font-size: 1.4rem; margin-right: 10px; flex-shrink: 0; }
        .pot-info { flex: 1; }
        .pot-name { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; margin-bottom: 2px; }
        .pot-meta { font-size: 0.72rem; color: #6B7280; }
        .pot-badge { font-size: 0.62rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .pot-badge.solo { background: #EFF6FF; color: #1D4ED8; }
        .pot-badge.group { background: #FFF7ED; color: #F97316; }
        .pot-badge.locked { background: #FEF2F2; color: #EF4444; }
        .pot-badge.unlocked { background: #F0FDF4; color: #15803D; }
        
        .pot-bar-wrap { background: #F9FAFB; border-radius: 999px; height: 7px; margin: 10px 0 6px; overflow: hidden; }
        .pot-bar { height: 7px; border-radius: 999px; background: linear-gradient(90deg, #F97316, #EA580C); }
        .pot-stats { display: flex; justify-content: space-between; font-size: 0.71rem; color: #6B7280; }
        .pot-stats b { color: #1A1108; }
        
        .pot-members { display: flex; align-items: center; gap: 4px; margin-top: 10px; }
        .pm-av { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; color: white; border: 2px solid white; margin-left: -5px; }
        .pm-av:first-child { margin-left: 0; }
        
        .new-pot-btn { border: 2px dashed #E5E7EB; border-radius: 12px; padding: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: #6B7280; font-size: 0.85rem; font-weight: 700; }
        .new-pot-btn:hover { border-color: #F97316; color: #F97316; background: #FFF7ED; }

        .pot-detail { display: flex; flex-direction: column; gap: 12px; }
        .detail-hero { background: linear-gradient(135deg, #1A1108 0%, #3D2000 100%); padding: 20px; color: white; border-radius: 14px 14px 0 0; position: relative; overflow: hidden; }
        .dh-emoji { font-size: 2rem; margin-bottom: 8px; }
        .dh-name { font-family: 'Syne', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 4px; }
        .dh-meta { font-size: 0.78rem; opacity: 0.75; }
        .dh-amount { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #FDBA74; margin: 10px 0 2px; }
        .dh-bar-wrap { background: rgba(255,255,255,0.15); border-radius: 999px; height: 8px; margin: 12px 0 6px; }
        .dh-bar { height: 8px; border-radius: 999px; background: #F97316; }
        .dh-pct { font-size: 0.75rem; opacity: 0.8; }
        
        .detail-section { padding: 14px 16px; border-bottom: 1px solid #E5E7EB; background: white; }
        .ds-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6B7280; margin-bottom: 10px; }
        
        .action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px 16px; background: white; border-radius: 0 0 14px 14px; }
        .act-btn { padding: 10px; border-radius: 9px; border: 1px solid #E5E7EB; font-size: 0.83rem; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.2s; }
        .act-btn.primary { background: #F97316; color: white; border-color: #F97316; }
        .act-btn.primary:hover { background: #EA6500; }
        
        .empty-state { text-align: center; padding: 40px 24px; color: #6B7280; }
        .es-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .es-title { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; color: #1A1108; margin-bottom: 6px; }

        /* Modals */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; }
        .modal { background: white; border-radius: 18px; padding: 24px; width: 100%; max-width: 480px; margin: 16px; max-height: 90vh; overflow-y: auto; }
        .modal-title { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
        .modal-close { background: #F9FAFB; border: none; border-radius: 7px; width: 26px; height: 26px; cursor: pointer; color: #6B7280; }
        
        .fg { margin-bottom: 14px; }
        .fg label { font-size: 0.74rem; font-weight: 700; color: #6B7280; margin-bottom: 5px; display: block; text-transform: uppercase; }
        .fi { width: 100%; padding: 10px 13px; border-radius: 9px; border: 1px solid #E5E7EB; font-size: 0.88rem; outline: none; }
        .fi:focus { border-color: #F97316; }
        .amt-wrap { position: relative; }
        .amt-pre { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-weight: 700; color: #6B7280; }
        .amt-wrap .fi { padding-left: 26px; font-weight: 700; }
        
        .emoji-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
        .emoji-opt { font-size: 1.3rem; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1.5px solid #E5E7EB; }
        .emoji-opt.active { border-color: #F97316; background: #FFF7ED; }
        
        .pot-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .pot-type-btn { padding: 10px 8px; border-radius: 9px; border: 1.5px solid #E5E7EB; cursor: pointer; text-align: center; }
        .pot-type-btn.active { border-color: #F97316; background: #FFF7ED; color: #F97316; }
        
        .f-submit { width: 100%; padding: 12px; background: #F97316; color: white; border: none; border-radius: 9px; font-weight: 700; cursor: pointer; margin-top: 4px; }
        .f-submit:hover { background: #EA6500; }
      `}</style>

      {/* TOP ACTIONS */}
      <div className="tb-right">
        <button className="tb-btn" onClick={() => setActiveView("activity")}>Activity log</button>
        <button className="tb-btn primary" onClick={() => setShowCreateModal(true)}>+ Create Pot</button>
      </div>

      {/* STATS ROW */}
      <div className="stats-row">
        <div className="stat-card accent">
          <div className="sc-lbl">Total in Pots</div>
          <div className="sc-val">${totalSaved.toFixed(2)}</div>
          <div className="sc-sub">MUSD · Bitcoin-backed savings</div>
        </div>
        <div className="stat-card">
          <div className="sc-lbl">Active Pots</div>
          <div className="sc-val">{pots.length}</div>
          <div className="sc-sub">Solo + Group</div>
          <div className="sc-chg">↑ 1 new this month</div>
        </div>
        <div className="stat-card">
          <div className="sc-lbl">Auto-Pay Active</div>
          <div className="sc-val" style={{ color: "#0D9488", opacity: 0.5 }}>$0/mo</div>
          <div className="sc-sub">Scheduled across 0 pots</div>
          <div className="sc-chg" style={{ color: "#F97316" }}>🚀 Coming in V2 Roadmap</div>
        </div>
        <div className="stat-card">
          <div className="sc-lbl">Unlocking Soon</div>
          <div className="sc-val" style={{ color: "#F97316" }}>
            {pots.length > 0 ? `${Math.min(...pots.map(p => p.daysLeft))}d` : "-"}
          </div>
          <div className="sc-sub">Closest goal</div>
        </div>
      </div>

      {/* MAIN SAVINGS LAYOUT */}
      <div className="savings-layout">
        {/* LEFT: POT LIST */}
        <div className="sc">
          <div className="sc-head">
            <span className="sc-title">Your Pots</span>
          </div>
          <div className="pots-grid">
            {pots.map(p => {
              const pct = Math.min(100, Math.round(p.saved / p.target * 100));
              return (
                <div key={p.id} className={`pot-card ${selectedPotId === p.id ? 'selected' : ''}`} onClick={() => setSelectedPotId(p.id)}>
                  <div className="pot-top">
                    <span className="pot-emoji">{p.emoji}</span>
                    <div className="pot-info">
                      <div className="pot-name">{p.name}</div>
                      <div className="pot-meta">{p.members.length} member{p.members.length > 1 ? 's' : ''} · Unlocks {p.unlockDate}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <span className={`pot-badge ${p.type}`}>{p.type === 'group' ? 'Group' : 'Solo'}</span>
                      {p.hasClaimed ? (
                        <span className="pot-badge" style={{ background: "#F3F4F6", color: "#4B5563" }}>Claimed</span>
                      ) : (
                        <span className={`pot-badge ${p.daysLeft === 0 ? 'unlocked' : 'locked'}`}>
                          {p.daysLeft === 0 ? 'Unlocked!' : `${p.daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pot-bar-wrap"><div className="pot-bar" style={{ width: `${pct}%` }}></div></div>
                  <div className="pot-stats">
                    <span><b>${p.saved.toLocaleString()}</b> saved</span>
                    <span>{pct}%</span>
                    <span><b>${p.target.toLocaleString()}</b> goal</span>
                  </div>
                </div>
              )
            })}
            
            <div className="new-pot-btn" onClick={() => setShowCreateModal(true)}>
              <span style={{ fontSize: "1.3rem" }}>+</span>
              <span>Create New Savings Pot</span>
            </div>
          </div>
        </div>

        {/* RIGHT: POT DETAIL */}
        <div className="pot-detail">
          {!activePot ? (
            <div className="sc">
              <div className="empty-state">
                <div className="es-icon">👆</div>
                <div className="es-title">Select a pot</div>
                <div className="es-sub">Click any pot on the left to see details, manage members, and deposit MUSD.</div>
              </div>
            </div>
          ) : (
            <div className="sc" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="detail-hero">
                <div className="dh-emoji">{activePot.emoji}</div>
                <div className="dh-name">{activePot.name}</div>
                <div className="dh-meta">{activePot.members.length} member{activePot.members.length > 1 ? 's' : ''} · {activePot.hasClaimed ? 'Already Claimed' : `Unlocks ${activePot.unlockDate}`}</div>
                <div className="dh-amount">${activePot.saved.toLocaleString()} <span style={{ fontSize: "1rem", opacity: 0.6 }}>MUSD</span></div>
                <div className="dh-pct">{Math.min(100, Math.round(activePot.saved / activePot.target * 100))}% funded · ${(activePot.target - activePot.saved).toLocaleString()} remaining</div>
              </div>
              
              <div className="detail-section">
                <div className="ds-title">Members</div>
                {activePot.members.map((m: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0" }}>
                    <div className="pm-av" style={{ background: m.color, margin: 0 }}>{m.handle[0].toUpperCase()}</div>
                    <div style={{ flex: 1, fontSize: "0.83rem", fontWeight: 700 }}>@{m.handle}</div>
                  </div>
                ))}
              </div>
              
              <div className="action-row">
                {activePot.type === 'solo' && activePot.saved >= activePot.target ? (
                  <>
                    <div style={{ padding: "10px", fontSize: "0.85rem", color: "#15803D", fontWeight: 700, background: "#F0FDF4", borderRadius: "9px", textAlign: "center", gridColumn: "span 2" }}>
                      🎉 Goal Fully Funded! No need to deposit more.
                    </div>
                    {activePot.hasClaimed ? (
                      <div style={{ padding: "12px", fontSize: "0.85rem", color: "#6B7280", fontWeight: 700, background: "#F9FAFB", borderRadius: "9px", textAlign: "center", gridColumn: "span 2", border: "1px solid #E5E7EB" }}>
                        ✅ You have already claimed this pot.
                      </div>
                    ) : (
                      <button className="act-btn primary" style={{ gridColumn: "span 2", padding: "12px" }} onClick={handleClaim} disabled={isClaiming}>
                        {isClaiming ? "Processing..." : "🏆 Claim Full Amount to Wallet"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button className="act-btn primary" onClick={() => setShowDepositModal(true)}>💰 Deposit MUSD</button>
                    {activePot.type === 'group' && (
                      <button className="act-btn" style={{ background: "white" }} onClick={() => setShowInviteModal(true)}>👥 Invite via XMTP</button>
                    )}
                    <button className="act-btn" style={{ background: "white", color: "#EF4444", borderColor: "#EF4444" }} onClick={handleWithdraw} disabled={isWithdrawing}>
                      {isWithdrawing ? "Processing..." : "Withdraw (5% Fine if Early)"}
                    </button>
                    <button className="act-btn" style={{ background: "white", color: "#1D4ED8", borderColor: "#1D4ED8" }} onClick={handleCreatorSettle} disabled={isSettling}>
                      {isSettling ? "Processing..." : "Creator: Settle Early"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE POT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">
              Create Savings Pot
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <div className="fg">
              <label>Pot Type</label>
              <div className="pot-type-grid">
                <div className={`pot-type-btn ${potType === 'solo' ? 'active' : ''}`} onClick={() => setPotType('solo')}>
                  <div style={{ fontSize: '1.2rem' }}>🐷</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Solo</div>
                </div>
                <div className="pot-type-btn" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                  <div style={{ fontSize: '1.2rem' }}>👥</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Group <span style={{color: "#F97316", fontSize: "0.55rem", display: "block"}}>(Coming Soon)</span></div>
                </div>
              </div>
            </div>

            <div className="fg">
              <label>Pot Icon</label>
              <div className="emoji-row">
                {['✈️','🏠','🎓','🎂','💍','🚗','💻','🌴','🏋️','🎸'].map(e => (
                  <div key={e} className={`emoji-opt ${potEmoji === e ? 'active' : ''}`} onClick={() => setPotEmoji(e)}>{e}</div>
                ))}
              </div>
            </div>

            <div className="fg">
              <label>Pot Name</label>
              <input className="fi" type="text" placeholder="e.g. Japan Trip 2025" value={potName} onChange={e => setPotName(e.target.value)} />
            </div>

            <div className="fg">
              <label>Target Amount (MUSD)</label>
              <div className="amt-wrap">
                <span className="amt-pre">$</span>
                <input className="fi" type="number" placeholder="0.00" value={potTarget} onChange={e => setPotTarget(e.target.value)} />
              </div>
            </div>
            
            <div className="fg">
              <label>Unlock Date</label>
              <input className="fi" type="date" value={potUnlockDate} onChange={e => setPotUnlockDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>

            <button className="f-submit" onClick={handleCreatePot} disabled={isCreating}>
              {isCreating ? "Creating on-chain..." : "Create Pot"}
            </button>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && activePot && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "380px" }}>
            <div className="modal-title">
              Deposit to {activePot.name}
              <button className="modal-close" onClick={() => setShowDepositModal(false)}>×</button>
            </div>
            <div className="fg">
              <label>Amount (MUSD)</label>
              <div className="amt-wrap">
                <span className="amt-pre">$</span>
                <input className="fi" type="number" placeholder="0.00" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
              </div>
              <div style={{ fontSize: "0.71rem", color: "#6B7280", marginTop: "4px" }}>Wallet balance: ${balanceFormatted} MUSD</div>
            </div>
            <button className="f-submit" onClick={handleDeposit} disabled={isDepositing}>
              {isDepositing ? "Processing..." : "Deposit MUSD →"}
            </button>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && activePot && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "380px" }}>
            <div className="modal-title">
              Invite to Pot
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>×</button>
            </div>
            <div className="fg">
              <label>@Username</label>
              <input 
                className="fi" 
                type="text" 
                placeholder="@friend" 
                value={inviteHandle}
                onChange={(e) => setInviteHandle(e.target.value)}
              />
            </div>
            <button className="f-submit" onClick={handleInvite} disabled={isInviting}>
              {isInviting ? "Sending..." : "Send Invite via XMTP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
