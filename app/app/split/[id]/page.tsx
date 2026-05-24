"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "../../context";
import { useAccount, useWriteContract, usePublicClient, useReadContract } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, SPLIT_ABI, MUSD_ABI, REGISTRY_ABI } from "@/lib/contracts";

export default function SplitDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { tabs, showToast, sendPaymentRequest, address: contextAddress, username } = useApp();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [tabData, setTabData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReminding, setIsReminding] = useState(false);

  // Determine if we should use local state or fetch from contract
  useEffect(() => {
    async function loadTab() {
      if (!publicClient || !address) return;

      // Try local first
      const localTab = tabs.find((t) => t.id === id);
      if (localTab && localTab.membersDetail) {
        setTabData(localTab);
        setIsLoading(false);
        return;
      }

      try {
        if (id.startsWith("0x")) {
          // Fetch from contract
          const data = await publicClient.readContract({
            address: CONTRACTS.SPLIT_MANAGER,
            abi: parseAbi(SPLIT_ABI),
            functionName: "getTab",
            args: [id as `0x${string}`],
          });

          const [creator, title, members, shares, settled, createdAt] = data as any;
          
          let total = BigInt(0);
          const membersDetail = [];
          
          const goldskyUrl = process.env.NEXT_PUBLIC_GOLDSKY_URL;
          let tabPayments: any[] = [];
          if (goldskyUrl) {
            const query = `
              query GetPayments($tabId: String!) {
                tabPayments(where: { tab: $tabId }) {
                  member
                  timestamp
                }
              }
            `;
            try {
              const res = await fetch(goldskyUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, variables: { tabId: id.toLowerCase() } })
              });
              const { data } = await res.json();
              if (data?.tabPayments) tabPayments = data.tabPayments;
            } catch (e) {}
          }
          
          for (let i = 0; i < members.length; i++) {
            total += shares[i];
            
            const isCreator = members[i].toLowerCase() === creator.toLowerCase();
            let hasPaid = isCreator; // Creator is implicitly paid
            if (!isCreator) {
              hasPaid = await publicClient.readContract({
                address: CONTRACTS.SPLIT_MANAGER,
                abi: parseAbi(SPLIT_ABI),
                functionName: "hasPaid",
                args: [id as `0x${string}`, members[i]],
              }) as boolean;
            }

            // Find payment date
            let paymentDate = "";
            if (hasPaid && !isCreator) {
               const pRec = tabPayments.find((p) => p.member.toLowerCase() === members[i].toLowerCase());
               if (pRec) {
                 const d = new Date(Number(pRec.timestamp) * 1000);
                 paymentDate = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
               }
            }

            // Try to resolve username
            let memberUsername = members[i];
            try {
               const resolvedUsername = await publicClient.readContract({
                  address: CONTRACTS.USERNAME_REGISTRY,
                  abi: parseAbi(REGISTRY_ABI),
                  functionName: "reverseLookup",
                  args: [members[i]],
               });
               if (resolvedUsername) memberUsername = resolvedUsername as string;
            } catch (e) {}

            membersDetail.push({
              address: members[i],
              username: memberUsername,
              share: Number(shares[i]) / 1e18,
              paid: hasPaid,
              paymentDate
            });
          }

          setTabData({
            id,
            title,
            creator,
            total: Number(total) / 1e18,
            settled,
            membersDetail,
          });
        } else {
          // local dummy tab
          setTabData(localTab);
        }
      } catch (e) {
        console.error("Failed to load tab", e);
        showToast("Error loading tab details");
      } finally {
        setIsLoading(false);
      }
    }
    loadTab();
  }, [id, tabs, publicClient, address]);

  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading split details...</div>;
  }

  if (!tabData) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Split not found.</div>;
  }

  const isCreator = tabData.creator?.toLowerCase() === address?.toLowerCase();
  
  // Find current user's detail
  const myDetail = tabData.membersDetail?.find((m: any) => m.address.toLowerCase() === address?.toLowerCase());
  const iAmOwed = isCreator && !tabData.settled;
  const iOwe = myDetail && !myDetail.paid && !isCreator;

  const handlePayShare = async () => {
    if (!myDetail) return;
    setIsProcessing(true);
    try {
      showToast("Approving MUSD...");
      const amountWei = parseUnits(myDetail.share.toString(), 18);
      
      const approveHash = await writeContractAsync({
        address: CONTRACTS.MUSD,
        abi: parseAbi(MUSD_ABI),
        functionName: "approve",
        args: [CONTRACTS.SPLIT_MANAGER, amountWei],
      });
      await publicClient?.waitForTransactionReceipt({ hash: approveHash });

      showToast("Paying share...");
      const payHash = await writeContractAsync({
        address: CONTRACTS.SPLIT_MANAGER,
        abi: parseAbi(SPLIT_ABI),
        functionName: "payShare",
        args: [id as `0x${string}`],
      });
      await publicClient?.waitForTransactionReceipt({ hash: payHash });
      
      showToast("Share paid successfully!");
      
      // Update local state
      setTabData({
        ...tabData,
        membersDetail: tabData.membersDetail.map((m: any) => 
          m.address.toLowerCase() === address?.toLowerCase() ? { ...m, paid: true } : m
        )
      });
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to pay share");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendReminder = async (memberAddress: string, memberUsername: string, amount: number) => {
    setIsReminding(true);
    try {
      const success = await sendPaymentRequest(
        memberAddress,
        memberUsername,
        amount,
        `Reminder for Split Tab: ${tabData.title}`,
        id
      );
      if (success) {
        showToast(`Reminder sent to @${memberUsername}!`);
      }
    } catch (e) {
      showToast("Failed to send reminder");
    } finally {
      setIsReminding(false);
    }
  };

  const totalPaid = tabData.membersDetail?.filter((m: any) => m.paid).reduce((sum: number, m: any) => sum + m.share, 0) || 0;
  const pct = Math.min(100, Math.round((totalPaid / tabData.total) * 100)) || 0;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <style>{`
        .sd-wrap { background: white; border-radius: 16px; border: 1px solid var(--border); overflow: hidden; }
        .sd-hero { background: linear-gradient(135deg, #1A1108, #3D2000); color: white; padding: 30px; }
        .sd-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; margin-bottom: 5px; }
        .sd-meta { font-size: 0.85rem; opacity: 0.8; }
        .sd-amt { font-size: 2.5rem; font-weight: 800; color: #FDBA74; margin: 15px 0 5px; }
        
        .sd-bar-wrap { background: rgba(255,255,255,0.15); border-radius: 999px; height: 10px; margin: 15px 0 8px; }
        .sd-bar { height: 10px; border-radius: 999px; background: #F97316; }
        
        .sd-section { padding: 25px; }
        .sd-stitle { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gray); margin-bottom: 15px; }
        
        .sd-row { display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; }
        .sd-av { width: 36px; height: 36px; border-radius: 50%; background: #F97316; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 15px; }
        
        .btn-pay { background: #F97316; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; }
        .btn-remind { background: white; color: var(--dark); border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
        .badge-paid { background: #F0FDF4; color: #15803D; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
        
        .back-btn { display: inline-block; margin-bottom: 20px; font-weight: 700; color: var(--gray); cursor: pointer; }
      `}</style>
      
      <div className="back-btn" onClick={() => router.push("/app/split")}>← Back to Splits</div>
      
      <div className="sd-wrap">
        <div className="sd-hero">
          <div className="sd-title">{tabData.title}</div>
          <div className="sd-meta">Created by {isCreator ? "You" : `${tabData.creator?.slice(0,6)}...`}</div>
          
          <div className="sd-amt">${tabData.total.toFixed(2)} MUSD</div>
          <div className="sd-meta">Total amount to be collected</div>
          
          <div className="sd-bar-wrap">
            <div className="sd-bar" style={{ width: `${pct}%` }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
            <span>${totalPaid.toFixed(2)} Paid</span>
            <span>${(tabData.total - totalPaid).toFixed(2)} Remaining</span>
          </div>
        </div>
        
        <div className="sd-section">
          <div className="sd-stitle">Participants</div>
          
          {tabData.membersDetail?.map((m: any) => (
            <div key={m.address} className="sd-row">
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="sd-av" style={{ background: m.address.toLowerCase() === tabData.creator.toLowerCase() ? "#3D2000" : "#F97316" }}>
                  {m.username?.charAt(0).toUpperCase() || m.address.slice(2,3).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {m.address.toLowerCase() === address?.toLowerCase() ? "You" : `@${m.username || m.address.slice(0,6)}`}
                    {m.address.toLowerCase() === tabData.creator.toLowerCase() && " (Creator)"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray)" }}>${m.share.toFixed(2)}</div>
                </div>
              </div>
              
              <div style={{ textAlign: "right" }}>
                {m.paid ? (
                  <>
                    <span className="badge-paid">✓ Paid</span>
                    {m.paymentDate && (
                      <div style={{ fontSize: "0.65rem", color: "var(--gray)", marginTop: "4px" }}>
                        {m.paymentDate}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* If current user needs to pay */}
                    {m.address.toLowerCase() === address?.toLowerCase() && !isCreator && (
                      <button className="btn-pay" onClick={handlePayShare} disabled={isProcessing}>
                        {isProcessing ? "Processing..." : `Pay $${m.share.toFixed(2)}`}
                      </button>
                    )}
                    
                    {/* If creator is viewing someone else who hasn't paid */}
                    {isCreator && m.address.toLowerCase() !== address?.toLowerCase() && (
                      <button 
                        className="btn-remind" 
                        onClick={() => handleSendReminder(m.address, m.username, m.share)}
                        disabled={isReminding}
                      >
                        🔔 Remind
                      </button>
                    )}
                    
                    {/* Default pending state */}
                    {(!isCreator && m.address.toLowerCase() !== address?.toLowerCase()) && (
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--orange)" }}>Pending</span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}
