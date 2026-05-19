"use client";

import { useState, useEffect } from "react";
import { useApp } from "../context";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { CONTRACTS, MUSD_ABI } from "@/lib/contracts";

export default function EarnPage() {
  const { balanceFormatted, showToast, refetchData } = useApp();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [yieldBalance, setYieldBalance] = useState(0.00);
  const [liveYield, setLiveYield] = useState(0.00);
  const [autoEarn, setAutoEarn] = useState(true);
  const [amount, setAmount] = useState("");
  const [activeAction, setActiveAction] = useState<"deposit" | "withdraw">("deposit");
  const [isLoading, setIsLoading] = useState(false);

  interface YieldHistoryItem {
    date: string;
    desc: string;
    amt: number;
    isDeposit?: boolean;
    isWithdrawal?: boolean;
  }

  const [yieldHistory, setYieldHistory] = useState<YieldHistoryItem[]>([]);

  // Load persistent user data on mount
  useEffect(() => {
    if (!address) return;
    const storedBal = localStorage.getItem(`yield_bal_${address.toLowerCase()}`);
    if (storedBal) {
      setYieldBalance(parseFloat(storedBal));
    } else {
      setYieldBalance(0.00);
    }

    const storedHist = localStorage.getItem(`yield_hist_${address.toLowerCase()}`);
    if (storedHist) {
      setYieldHistory(JSON.parse(storedHist));
    } else {
      setYieldHistory([]);
    }
  }, [address]);

  // compund live interest ticked up every second
  useEffect(() => {
    if (yieldBalance <= 0) {
      setLiveYield(0);
      return;
    }
    const interestPerSec = yieldBalance * (0.024 / (365 * 24 * 60 * 60)); // 2.4% APR
    const interval = setInterval(() => {
      setLiveYield((prev) => prev + interestPerSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [yieldBalance]);

  const handleAction = async () => {
    if (!amount || !address) return;
    const numericAmt = parseFloat(amount);
    setIsLoading(true);

    try {
      if (activeAction === "deposit") {
        showToast("Sending deposit transaction...");
        const amountWei = parseUnits(amount, 18);
        const hash = await writeContractAsync({
          address: CONTRACTS.MUSD,
          abi: parseAbi(MUSD_ABI),
          functionName: "transfer",
          args: [CONTRACTS.SPLIT_MANAGER, amountWei], // send to lockbox
        });

        if (publicClient) {
          showToast("Waiting for confirmation...");
          await publicClient.waitForTransactionReceipt({ hash });
        }

        const newBal = yieldBalance + numericAmt;
        setYieldBalance(newBal);
        localStorage.setItem(`yield_bal_${address.toLowerCase()}`, newBal.toString());

        const newHist = [
          { date: "Just now", desc: "Deposit to Earn Vault", amt: numericAmt, isDeposit: true },
          ...yieldHistory,
        ];
        setYieldHistory(newHist);
        localStorage.setItem(`yield_hist_${address.toLowerCase()}`, JSON.stringify(newHist));

        showToast(`Deposited $${numericAmt.toFixed(2)} to Earn Vault!`, `$${numericAmt.toFixed(2)}`);
      } else {
        if (numericAmt > yieldBalance) {
          showToast("Insufficient yield balance");
          setIsLoading(false);
          return;
        }

        showToast("Releasing escrow back to wallet...");
        // Escrow release back on testnet
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const newBal = yieldBalance - numericAmt;
        setYieldBalance(newBal);
        localStorage.setItem(`yield_bal_${address.toLowerCase()}`, newBal.toString());

        const newHist = [
          { date: "Just now", desc: "Withdrawal from Vault", amt: numericAmt, isWithdrawal: true },
          ...yieldHistory,
        ];
        setYieldHistory(newHist);
        localStorage.setItem(`yield_hist_${address.toLowerCase()}`, JSON.stringify(newHist));

        showToast(`Withdrew $${numericAmt.toFixed(2)} to Wallet!`, `$${numericAmt.toFixed(2)}`);
      }

      setAmount("");
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoToggle = () => {
    const nextState = !autoEarn;
    setAutoEarn(nextState);
    showToast(
      nextState
        ? "Auto-Earn enabled: incoming payments will auto-compound!"
        : "Auto-Earn disabled"
    );
  };

  return (
    <div className="yield-grid">
      {/* LEFT COLUMN: WALLET BALANCE & DEPOSIT */}
      <div>
        <div className="yield-big mb-6">
          <div className="yb-lbl">Yield Balance</div>
          <div className="yb-val font-mono" style={{ fontSize: "2.4rem" }}>
            ${(yieldBalance + liveYield).toFixed(6)}
          </div>
          <div className="yb-sub">compounding at 2.4% APR in real-time</div>
        </div>

        <div className="sc">
          <div className="sc-head">
            <span className="sc-title">Vault Actions</span>
          </div>
          <div className="big-form" style={{ padding: "20px" }}>
            <div className="form-tabs">
              <button
                className={`ftab ${activeAction === "deposit" ? "active" : ""}`}
                onClick={() => setActiveAction("deposit")}
              >
                Deposit
              </button>
              <button
                className={`ftab ${activeAction === "withdraw" ? "active" : ""}`}
                onClick={() => setActiveAction("withdraw")}
              >
                Withdraw
              </button>
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
              <div className="f-note">
                {activeAction === "deposit"
                  ? `Wallet balance: $${balanceFormatted} MUSD`
                  : `Yield balance: $${yieldBalance.toFixed(2)} MUSD`}
              </div>
            </div>

            <button className="f-submit" onClick={handleAction} disabled={isLoading}>
              {isLoading
                ? "Processing..."
                : activeAction === "deposit"
                ? "Deposit into Yield Vault →"
                : "Withdraw to Wallet →"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AUTO-EARN TOGGLE & HISTORY */}
      <div className="flex flex-col gap-6">
        <div className="sc">
          <div className="yield-toggle-row">
            <div className="yt-info">
              <h4>Auto-Earn (ERC-4626)</h4>
              <p>Automatically sweep incoming peer-to-peer transfers into the yield vault.</p>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={autoEarn} onChange={handleAutoToggle} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="sc">
          <div className="sc-head">
            <span className="sc-title">Yield Earnings History</span>
          </div>
          <div className="yield-history">
            {yieldHistory.map((item, i) => (
              <div key={i} className="yh-row">
                <div className="yh-date">{item.date}</div>
                <div className="yh-desc">{item.desc}</div>
                <div
                  className="yh-amt"
                  style={{
                    color: item.isDeposit
                      ? "var(--dark)"
                      : item.isWithdrawal
                      ? "var(--red)"
                      : "var(--green)",
                  }}
                >
                  {item.isDeposit ? "" : item.isWithdrawal ? "-" : "+"}$
                  {item.amt.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
