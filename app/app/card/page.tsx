"use client";

import { useState } from "react";
import { useApp } from "../context";

export default function CardPage() {
  const { balanceFormatted, showToast } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(150);
  const [cardStatus, setCardStatus] = useState("Active");

  // Simulated virtual card transactions
  const cardTransactions = [
    { merchant: "Starbucks Coffee", amount: 6.85, date: "Today, 9:24 AM", category: "Food & Drink" },
    { merchant: "Target Store #1024", amount: 42.19, date: "Yesterday, 3:12 PM", category: "Shopping" },
    { merchant: "Netflix Premium Subscription", amount: 15.49, date: "May 15", category: "Entertainment" },
  ];

  const handleFreezeToggle = () => {
    if (cardStatus === "Active") {
      setCardStatus("Frozen");
      showToast("Virtual card frozen successfully");
    } else {
      setCardStatus("Active");
      showToast("Virtual card activated");
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .card-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .credit-card {
          width: 100%;
          max-width: 380px;
          height: 220px;
          border-radius: 18px;
          background: linear-gradient(135deg, #1A1108 0%, #3D2000 100%);
          position: relative;
          color: white;
          padding: 24px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          margin-bottom: 20px;
          border: 1px solid rgba(249, 115, 22, 0.15);
          transition: all 0.3s;
        }

        .credit-card.frozen {
          background: linear-gradient(135deg, #374151 0%, #1F2937 100%);
          opacity: 0.85;
          border-color: rgba(156, 163, 175, 0.15);
        }

        .credit-card::before {
          content: "";
          position: absolute;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, transparent 70%);
          top: -100px;
          right: -100px;
        }

        .cc-brand {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 38px;
        }

        .cc-brand span {
          color: #F97316;
        }

        .cc-chip {
          width: 34px;
          height: 26px;
          background: linear-gradient(135deg, #FDBA74, #EA580C);
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .cc-num {
          font-family: monospace;
          font-size: 1.25rem;
          letter-spacing: 0.18em;
          margin-bottom: 26px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .cc-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.85;
        }

        .card-ctrl {
          background: white;
          border-radius: 14px;
          border: 1px solid var(--border);
          padding: 20px;
          margin-bottom: 20px;
        }

        .ctrl-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 14px;
          color: var(--dark);
        }

        .ctrl-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .ctrl-row:last-child {
          border-bottom: none;
        }

        .ctrl-label {
          font-size: 0.86rem;
          font-weight: 600;
        }

        .ctrl-desc {
          font-size: 0.73rem;
          color: var(--gray);
          margin-top: 2px;
        }

        .badge-active {
          background: var(--green-light);
          color: var(--green);
          padding: 3px 8px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.71rem;
        }

        .badge-frozen {
          background: var(--red-light);
          color: var(--red);
          padding: 3px 8px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.71rem;
        }

        /* Toggle switch */
        .toggle-wrap {
          display: inline-flex;
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--border);
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .toggle-wrap.active {
          background: var(--orange);
        }

        .toggle-dot {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .toggle-wrap.active .toggle-dot {
          transform: translateX(20px);
        }

        .slider-fg {
          margin-top: 14px;
        }

        .slider-h {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .limit-slider {
          width: 100%;
          accent-color: var(--orange);
          height: 5px;
          border-radius: 3px;
          outline: none;
        }

        @media (max-width: 900px) {
          .card-container {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      <div className="card-container">
        {/* LEFT COLUMN: INTERACTIVE CARD & CONTROLS */}
        <div>
          <div className={`credit-card ${cardStatus === "Frozen" ? "frozen" : ""}`}>
            <div className="cc-brand">
              <span>MezoPay.</span>
              <div style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.15)", padding: "2px 7px", borderRadius: "999px" }}>
                Debit
              </div>
            </div>
            <div className="cc-chip"></div>
            <div className="cc-num">
              {showDetails ? "4285 9182 7304 9021" : "•••• •••• •••• 9021"}
            </div>
            <div className="cc-meta">
              <div>
                <div style={{ fontSize: "0.55rem", opacity: 0.6 }}>Cardholder</div>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", marginTop: "2px" }}>Mezo User</div>
              </div>
              <div style={{ display: "flex", gap: "18px" }}>
                <div>
                  <div style={{ fontSize: "0.55rem", opacity: 0.6 }}>Expires</div>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", marginTop: "2px" }}>09/29</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", opacity: 0.6 }}>CVV</div>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", marginTop: "2px" }}>
                    {showDetails ? "492" : "•••"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-ctrl">
            <div className="ctrl-title">Card Actions</div>
            <div className="ctrl-row">
              <div>
                <div className="ctrl-label">Reveal Card Details</div>
                <div className="ctrl-desc">Show card number, CVV, and expiration</div>
              </div>
              <div 
                className={`toggle-wrap ${showDetails ? "active" : ""}`}
                onClick={() => setShowDetails(!showDetails)}
              >
                <div className="toggle-dot"></div>
              </div>
            </div>

            <div className="ctrl-row">
              <div>
                <div className="ctrl-label">Freeze Card</div>
                <div className="ctrl-desc">Temporarily lock transactions on this card</div>
              </div>
              <div 
                className={`toggle-wrap ${cardStatus === "Frozen" ? "active" : ""}`}
                onClick={handleFreezeToggle}
              >
                <div className="toggle-dot"></div>
              </div>
            </div>
          </div>

          <div className="card-ctrl">
            <div className="ctrl-title">Spending Limits</div>
            <div className="slider-fg">
              <div className="slider-h">
                <span>Daily Spending Limit</span>
                <span style={{ color: "var(--orange)", fontWeight: 700 }}>${dailyLimit} MUSD</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="1000" 
                step="10"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="limit-slider" 
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--gray)", marginTop: "6px" }}>
                <span>Min: $10</span>
                <span>Max: $1,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CARD TRANSACTIONS */}
        <div>
          <div className="sc">
            <div className="sc-head">
              <span className="sc-title">Card Activity</span>
            </div>
            <div className="act-list">
              {cardTransactions.map((tx, idx) => (
                <div key={idx} className="act-row">
                  <div className="act-av" style={{ background: "var(--dark)" }}>
                    💳
                  </div>
                  <div className="act-info">
                    <div className="act-name">{tx.merchant}</div>
                    <div className="act-note">{tx.category}</div>
                  </div>
                  <div className="act-right">
                    <div className="act-amt dn">
                      -${tx.amount.toFixed(2)}
                    </div>
                    <div className="act-time">{tx.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sc" style={{ marginTop: "24px" }}>
            <div className="sc-head">
              <span className="sc-title">Card Details</span>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--gray)" }}>Status</span>
                <span className={cardStatus === "Active" ? "badge-active" : "badge-frozen"}>
                  {cardStatus}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--gray)" }}>Network</span>
                <span style={{ fontWeight: 700 }}>Mastercard (Simulated)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--gray)" }}>Funding Account</span>
                <span style={{ fontWeight: 700 }}>MUSD Wallet</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--gray)" }}>Available Funds</span>
                <span style={{ color: "var(--green)", fontWeight: 700 }}>${balanceFormatted} MUSD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
