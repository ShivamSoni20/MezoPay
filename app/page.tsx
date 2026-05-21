"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect to dashboard immediately if wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push("/app/dashboard");
    }
  }, [isConnected, router]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --orange: #F97316;
          --orange-light: #FFF7ED;
          --orange-mid: #FDBA74;
          --dark: #1A1108;
          --gray: #6B7280;
          --gray-light: #F9FAFB;
          --border: #E5E7EB;
          --white: #FFFFFF;
          --green: #22C55E;
          --green-light: #F0FDF4;
          --red: #EF4444;
          --blue: #3B82F6;
          --blue-light: #EFF6FF;
        }
        
        .landing-body {
          font-family: 'DM Sans', sans-serif;
          background: var(--white);
          color: var(--dark);
          overflow-x: hidden;
          padding-top: 68px;
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5%;
          height: 68px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--dark);
          text-decoration: none;
        }

        .nav-logo span {
          color: var(--orange);
        }

        .nav-links {
          display: flex;
          gap: 26px;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--gray);
          font-size: 0.87rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--dark);
        }

        .nav-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .nav-ghost {
          color: var(--dark);
          font-size: 0.87rem;
          font-weight: 600;
          text-decoration: none;
          padding: 9px 16px;
          border: 1px solid var(--border);
          border-radius: 9px;
          transition: all 0.2s;
        }

        .nav-ghost:hover {
          background: var(--gray-light);
        }

        .nav-cta {
          background: var(--orange);
          color: white;
          border: none;
          border-radius: 9px;
          padding: 10px 20px;
          font-size: 0.87rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .nav-cta:hover {
          background: #EA6500;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.3);
        }

        .hero {
          padding: 80px 5% 80px;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--orange-light);
          border: 1px solid var(--orange-mid);
          color: var(--orange);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.77rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--orange);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.35); }
        }

        .landing-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.5rem, 4.8vw, 3.9rem);
          font-weight: 800;
          line-height: 1.07;
          margin-bottom: 18px;
          color: var(--dark);
        }

        .landing-h1 .accent {
          color: var(--orange);
        }

        .hero-desc {
          font-size: 1.03rem;
          color: var(--gray);
          line-height: 1.72;
          max-width: 478px;
          margin-bottom: 30px;
        }

        .hero-ctas {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }

        .btn-primary {
          background: var(--orange);
          color: white;
          border: none;
          border-radius: 11px;
          padding: 13px 26px;
          font-size: 0.93rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary:hover {
          background: #EA6500;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(249, 115, 22, 0.35);
        }

        .btn-sec {
          color: var(--dark);
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: none;
          padding: 12px 18px;
          border: 1px solid var(--border);
          border-radius: 10px;
          transition: all 0.2s;
          display: inline-block;
        }

        .btn-sec:hover {
          background: var(--gray-light);
        }

        .badge-row {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--orange-light);
          border: 1px solid var(--orange-mid);
          color: var(--orange);
          border-radius: 999px;
          padding: 4px 11px;
          font-size: 0.71rem;
          font-weight: 700;
        }

        .net-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #1D4ED8;
          border-radius: 999px;
          padding: 4px 11px;
          font-size: 0.71rem;
          font-weight: 700;
        }

        .hero-stats {
          display: flex;
          gap: 26px;
          padding-top: 26px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
        }

        .stat-lbl {
          font-size: 0.73rem;
          color: var(--gray);
          margin-top: 2px;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          position: relative;
        }

        .phone-shell {
          width: 268px;
          height: 544px;
          background: var(--dark);
          border-radius: 38px;
          padding: 11px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.2), 0 0 0 2px #333;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-11px); }
        }

        .phone-screen {
          background: #F9F9F9;
          border-radius: 28px;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .p-status {
          background: white;
          padding: 11px 15px 4px;
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--dark);
        }

        .p-header {
          background: white;
          padding: 6px 15px 11px;
          border-bottom: 1px solid #F0F0F0;
        }

        .p-name {
          font-family: 'Syne', sans-serif;
          font-size: 0.97rem;
          font-weight: 800;
        }

        .p-balance {
          padding: 13px 15px;
          background: var(--orange);
          color: white;
          text-align: center;
        }

        .pbl {
          font-size: 0.63rem;
          opacity: 0.85;
          margin-bottom: 3px;
        }

        .pba {
          font-family: 'Syne', sans-serif;
          font-size: 1.65rem;
          font-weight: 800;
        }

        .pbs {
          font-size: 0.6 flex;
          opacity: 0.8;
          margin-top: 3px;
        }

        .p-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          padding: 9px;
        }

        .p-action {
          background: white;
          border-radius: 9px;
          padding: 8px 4px;
          text-align: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
        }

        .p-action .pi {
          font-size: 0.95rem;
        }

        .p-action .pl {
          font-size: 0.57rem;
          font-weight: 700;
          color: var(--gray);
          margin-top: 2px;
        }

        .p-slabel {
          padding: 3px 12px;
          font-size: 0.59rem;
          font-weight: 700;
          color: var(--gray);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .p-tx {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 11px;
          background: white;
          margin: 2px 9px;
          border-radius: 9px;
        }

        .p-tx .av {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.68rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .p-tx .txi {
          flex: 1;
        }

        .p-tx .txn {
          font-size: 0.65rem;
          font-weight: 700;
        }

        .p-tx .txs {
          font-size: 0.57rem;
          color: var(--gray);
        }

        .p-tx .txa {
          font-size: 0.68rem;
          font-weight: 800;
        }

        .p-tx .pos {
          color: var(--green);
        }

        .p-tx .neg {
          color: var(--red);
        }

        .fc {
          position: absolute;
          background: white;
          border-radius: 13px;
          padding: 10px 13px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          font-size: 0.73rem;
          font-weight: 700;
          animation: float 4s ease-in-out infinite;
        }

        .fc.l {
          left: -68px;
          top: 128px;
          animation-delay: -1s;
        }

        .fc.r {
          right: -58px;
          bottom: 148px;
          animation-delay: -2s;
        }

        .fcl {
          font-size: 0.6rem;
          color: var(--gray);
          font-weight: 400;
          margin-bottom: 2px;
        }

        .fcv {
          color: var(--orange);
          font-family: 'Syne', sans-serif;
          font-size: 0.93rem;
          font-weight: 800;
        }

        .sec-lbl {
          display: inline-block;
          font-size: 0.71rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 11px;
        }

        .sec-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.85rem, 3.4vw, 2.65rem);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 13px;
        }

        .sec-sub {
          font-size: 0.98rem;
          color: var(--gray);
          line-height: 1.72;
          max-width: 520px;
          margin-bottom: 50px;
        }

        /* HOW */
        .how {
          padding: 96px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }

        .step-card {
          padding: 28px;
          border: 1px solid var(--border);
          border-radius: 17px;
          background: white;
          transition: all 0.3s;
        }

        .step-card:hover {
          border-color: var(--orange-mid);
          box-shadow: 0 8px 32px rgba(249, 115, 22, 0.1);
          transform: translateY(-4px);
        }

        .step-num {
          font-family: 'Syne', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          color: var(--orange);
          line-height: 1;
          margin-bottom: 10px;
        }

        .step-card h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1.03rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .step-card p {
          font-size: 0.86rem;
          color: var(--gray);
          line-height: 1.65;
        }

        /* FEATURES */
        .features {
          padding: 78px 5%;
          background: var(--gray-light);
        }

        .features-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
          margin-top: 42px;
        }

        .feature-card {
          background: white;
          border-radius: 17px;
          padding: 26px;
          border: 1px solid var(--border);
          transition: all 0.3s;
        }

        .feature-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.07);
          transform: translateY(-3px);
        }

        .f-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: var(--orange-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.03rem;
          margin-bottom: 8px;
        }

        .feature-card p {
          color: var(--gray);
          font-size: 0.85rem;
          line-height: 1.65;
        }

        .f-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.69rem;
          font-weight: 700;
          background: var(--green-light);
          color: var(--green);
          border: 1px solid #86EFAC;
        }

        .f-pill.phase2 {
          background: #DBEAFE;
          color: #1D4ED8;
          border-color: #93C5FD;
        }

        /* EARN STRIP */
        .earn-strip {
          background: linear-gradient(135deg, #064E3B, #065F46);
          padding: 38px 5%;
        }

        .earn-strip-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
          flex-wrap: wrap;
        }

        .earn-strip h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: white;
          margin-bottom: 6px;
        }

        .earn-strip p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.86rem;
          max-width: 440px;
          line-height: 1.65;
        }

        .earn-stat-row {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }

        .es-v {
          font-family: 'Syne', sans-serif;
          font-size: 1.55rem;
          font-weight: 800;
          color: #6EE7B7;
        }

        .es-l {
          font-size: 0.71rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 2px;
        }

        /* TECH SECTION & BENTO GRID */
        .tech {
          padding: 78px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 42px;
        }

        .tech-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid var(--border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .tech-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(249, 115, 22, 0.08);
          border-color: var(--orange-mid);
        }

        .tech-card.large {
          grid-column: span 2;
          background: linear-gradient(145deg, #ffffff, #FFF7ED);
          border-color: var(--orange-mid);
        }

        .tech-card.medium {
          grid-column: span 1;
        }

        .tc-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .tc-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: var(--orange-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          border: 1px solid rgba(249, 115, 22, 0.15);
        }

        .tc-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--dark);
        }

        .tc-desc {
          font-size: 0.88rem;
          color: var(--gray);
          line-height: 1.6;
        }

        .tc-badge {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          margin-top: 16px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          background: var(--orange-light);
          color: var(--orange);
          border: 1px solid rgba(249, 115, 22, 0.2);
        }

        .tech-note {
          margin-top: 24px;
          padding: 14px 20px;
          background: var(--orange-light);
          border-left: 4px solid var(--orange);
          border-radius: 8px;
          font-size: 0.85rem;
          color: var(--dark);
          line-height: 1.6;
        }

        /* CTA */
        .cta-banner {
          margin: 56px 5%;
          border-radius: 21px;
          background: linear-gradient(135deg, var(--dark) 0%, #3D2000 100%);
          padding: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
          overflow: hidden;
          position: relative;
        }

        .cta-banner::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.22) 0%, transparent 70%);
        }

        .cta-banner h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.85rem;
          font-weight: 800;
          color: white;
          margin-bottom: 11px;
        }

        .cta-banner p {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.88rem;
          line-height: 1.65;
          max-width: 410px;
        }

        .cta-white {
          background: white;
          color: var(--dark);
          border: none;
          border-radius: 11px;
          padding: 13px 24px;
          font-size: 0.92rem;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .cta-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .landing-footer {
          background: var(--gray-light);
          border-top: 1px solid var(--border);
          padding: 36px 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .footer-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          color: var(--dark);
          font-size: 0.97rem;
        }

        .footer-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .footer-links a {
          text-decoration: none;
          color: var(--gray);
          font-size: 0.82rem;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--dark);
        }

        .footer-note {
          font-size: 0.77rem;
          color: var(--gray);
        }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; padding-top: 40px; padding-bottom: 40px; text-align: center; }
          .hero-desc { margin-left: auto; margin-right: auto; }
          .hero-ctas { justify-content: center; }
          .hero-visual { display: none; }
          .steps { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .tech-grid { grid-template-columns: 1fr; }
          .tech-card.large { grid-column: span 1 !important; }
          .cta-banner { flex-direction: column; padding: 38px 26px; text-align: center; }
          .phase-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .landing-nav { padding: 0 16px; height: 56px; }
          .landing-body { padding-top: 56px; }
          .nav-cta { padding: 8px 14px; font-size: 0.8rem; }
        }
      `}} />

      <div className="landing-body">
        <nav className="landing-nav">
          <Link href="/" className="nav-logo">
            MezoPay<span>.</span>
          </Link>
          <ul className="nav-links">
            <li><a href="#how">How it works</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#tech">Tech</a></li>
          </ul>
          <div className="nav-right">
            <ConnectButton.Custom>
              {({ openConnectModal, account, mounted }) => {
                const ready = mounted;
                const connected = ready && account;
                return (
                  <button
                    onClick={connected ? () => router.push("/app/dashboard") : openConnectModal}
                    className="nav-cta"
                  >
                    {connected ? "Enter App →" : "Connect Wallet →"}
                  </button>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="hero-badge">
              <span className="pulse"></span>Supernormal dApps · Self-service Bitcoin banking
            </div>
            <h1 className="landing-h1">
              Your Bitcoin bank.<br /><span className="accent">No bank required.</span>
            </h1>
            <p className="hero-desc" style={{ maxWidth: "540px" }}>
              Send MUSD to @username. Split dinner with friends. Save toward group goals — all with Bitcoin-backed money, no addresses, no gas warnings, no bank account.<br />
              <strong>MezoPay is self-service banking on Bitcoin rails: payments, splits, and savings in one app.</strong>
            </p>
            <div className="hero-ctas" style={{ marginBottom: "12px" }}>
              <ConnectButton.Custom>
                {({ openConnectModal, account, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account;
                  return (
                    <button
                      onClick={connected ? () => router.push("/app/dashboard") : openConnectModal}
                      className="btn-primary"
                    >
                      Try MezoPay Now →
                    </button>
                  );
                }}
              </ConnectButton.Custom>
              <a href="#how" className="btn-sec">Watch 45-sec Demo</a>
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--gray)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="net-dot" style={{ background: "var(--green)", width: "6px", height: "6px", borderRadius: "50%" }}></span> Built on Mezo • Testnet Live
            </div>
            <div className="badge-row">
              <span className="badge">⚡ EIP-712 Gasless</span>
              <span className="badge">🔒 Mezo Passport</span>
              <span className="badge">📊 Goldsky Feed</span>
              <span className="badge">📈 Mezo Earn</span>
              <span className="badge">🏺 Savings Pots</span>
              <span className="net-pill">🌐 Chain 31611 Testnet</span>
            </div>
            <div className="hero-stats">
              <div>
                <div className="stat-num">5</div>
                <div className="stat-lbl">Mezo primitives used</div>
              </div>
              <div>
                <div className="stat-num">$0</div>
                <div className="stat-lbl">Gas for receiver</div>
              </div>
              <div>
                <div className="stat-num">@username</div>
                <div className="stat-lbl">Not 0x addresses</div>
              </div>
              <div>
                <div className="stat-num">1 tx</div>
                <div className="stat-lbl">Group batch settle</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="fc l">
              <div className="fcl">Tab settled ✓</div>
              <div className="fcv">+$30.00 MUSD</div>
            </div>
            <div className="phone-shell">
              <div className="phone-screen">
                <div className="p-status">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                <div className="p-header">
                  <div className="p-name">MezoPay.</div>
                </div>
                <div className="p-balance">
                  <div className="pbl">MUSD Balance</div>
                  <div className="pba">$248.50</div>
                  <div className="pbs">Bitcoin-backed · Earning yield</div>
                </div>
                <div className="p-actions">
                  <div className="p-action">
                    <div className="pi">↑</div>
                    <div className="pl">Send</div>
                  </div>
                  <div className="p-action">
                    <div className="pi">↓</div>
                    <div className="pl">Request</div>
                  </div>
                  <div className="p-action">
                    <div className="pi">⚖</div>
                    <div className="pl">Split</div>
                  </div>
                </div>
                <div className="p-slabel">Recent Activity</div>
                <div className="p-tx">
                  <div className="av" style={{ background: "#F97316" }}>A</div>
                  <div className="txi">
                    <div className="txn">@alex</div>
                    <div className="txs">🍕 Dinner split</div>
                  </div>
                  <div className="txa pos">+$30.00</div>
                </div>
                <div className="p-tx">
                  <div className="av" style={{ background: "#8B5CF6" }}>S</div>
                  <div className="txi">
                    <div className="txn">@sarah</div>
                    <div className="txs">🎬 Movie</div>
                  </div>
                  <div className="txa neg">-$15.00</div>
                </div>
                <div className="p-tx">
                  <div className="av" style={{ background: "#06B6D4" }}>M</div>
                  <div className="txi">
                    <div className="txn">@mike</div>
                    <div className="txs">☕ Coffee</div>
                  </div>
                  <div className="txa pos">+$6.25</div>
                </div>
                <div className="p-tx">
                  <div className="av" style={{ background: "#10B981" }}>R</div>
                  <div className="txi">
                    <div className="txn">@raj</div>
                    <div className="txs">🏕 Camping trip</div>
                  </div>
                  <div className="txa neg">-$45.00</div>
                </div>
              </div>
            </div>
            <div className="fc r">
              <div className="fcl">Savings Pots</div>
              <div className="fcv">Live</div>
            </div>
          </div>
        </section>

        <section className="how" id="how">
          <div className="sec-lbl">How it works</div>
          <div className="sec-title">Four steps. Zero complexity.</div>
          <div className="sec-sub">
            Connect, claim, send, split — all on Mezo. No addresses, no gas popups, no jargon.
          </div>
          <div className="steps">
            <div className="step-card">
              <div className="step-num">01</div>
              <h3>Connect & Claim @handle</h3>
              <p>One-click RainbowKit login. Register your @username on-chain via UsernameRegistry.sol — instant, permanent.</p>
            </div>
            <div className="step-card">
              <div className="step-num">02</div>
              <h3>Send MUSD by @name</h3>
              <p>Type @friend, enter amount, done. Gasless EIP-712 permit — no approvals, no gas for receiver.</p>
            </div>
            <div className="step-card">
              <div className="step-num">03</div>
              <h3>Split Bills Instantly</h3>
              <p>Add friends, set total. SplitManager.sol splits shares and settles all members in a single transaction.</p>
            </div>
            <div className="step-card">
              <div className="step-num">04</div>
              <h3>Save & Track</h3>
              <p>Lock MUSD in solo or group Savings Pots. Goldsky subgraph powers your real-time activity feed.</p>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="features-inner">
            <div className="sec-lbl">Features</div>
            <div className="sec-title">Everything Venmo has.<br />Everything crypto never did.</div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="f-icon">🔐</div>
                <h3>Mezo Passport Identity</h3>
                <p>
                  @mezo-org/passport v0.1.0. Users sign up with email or social — wallet created silently. UsernameRegistry.sol maps @handles → addresses on-chain. Zero address friction.
                </p>
                <span className="f-pill">✓ MVP · Testnet ready</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">⚡</div>
                <h3>Gasless EIP-712 Permit2</h3>
                <p>
                  MUSD is permit2 + EIP-2612. Senders sign off-chain; gas is covered by sender — receivers never need BTC for gas. No approval transaction. Fully confirmed on Mezo testnet.
                </p>
                <span className="f-pill">✓ MVP · Testnet ready</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">⚖️</div>
                <h3>Group Tab Splitting</h3>
                <p>
                  SplitManager.sol stores tab state on-chain. createTab() + settleTab() loops MUSD.transferFrom for all members in 1 tx. Works for dinner, rent, trips — any group spend.
                </p>
                <span className="f-pill">✓ MVP · Testnet ready</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">📡</div>
                <h3>Goldsky Activity Feed</h3>
                <p>
                  Subgraph indexes all Transfer events on Chain 31611. Clean GraphQL powers real-time activity feed, balance history, and friends list. goldsky subgraph deploy mezopay/v1
                </p>
                <span className="f-pill">✓ MVP · Testnet ready</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">🏺</div>
                <h3>Savings Pots — solo & group</h3>
                <p>
                  Create time-locked MUSD savings goals on-chain via SavingsPot.sol. Solo pots for personal targets (house deposit, trip fund). Group pots invite friends via XMTP — everyone deposits their share, nobody can withdraw until the lock expires. Bitcoin-backed savings with social accountability.
                </p>
                <span className="f-pill">✓ Live on testnet · SavingsPot.sol deployed</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">💳</div>
                <h3>Virtual Debit Card</h3>
                <p>
                  Full card UI in MVP — card number, MUSD balance, simulated tap-to-pay. Real issuance via Marqeta/Lithic + Mastercard is Phase 2. Demo shows the full vision — Phase 2 with Marqeta/Lithic integration.
                </p>
                <span className="f-pill phase2">→ Phase 2 · Demo mode in MVP</span>
              </div>
            </div>
          </div>
        </section>

        <div className="earn-strip">
          <div className="earn-strip-inner">
            <div>
              <h3>🏺 Save together with Bitcoin-backed MUSD</h3>
              <p>
                Create a group savings pot, invite friends via encrypted XMTP messages, and lock MUSD toward a shared goal. Solo pots for personal targets, group pots for shared ones — all settled on-chain, no middleman, no bank.
              </p>
            </div>
            <div className="earn-stat-row">
              <div>
                <div className="es-v">Live</div>
                <div className="es-l">On testnet now</div>
              </div>
              <div>
                <div className="es-v">Solo + Group</div>
                <div className="es-l">Pot types</div>
              </div>
              <div>
                <div className="es-v">XMTP invite</div>
                <div className="es-l">Group coordination</div>
              </div>
              <div>
                <div className="es-v">Time lock</div>
                <div className="es-l">On-chain enforced</div>
              </div>
            </div>
          </div>
        </div>

        <section className="tech" id="tech">
          <div className="sec-lbl">Technical Stack</div>
          <div className="sec-title">Built on Mezo primitives</div>
          <div className="tech-grid">
            <div className="tech-card large">
              <div>
                <div className="tc-header">
                  <div className="tc-icon">🟠</div>
                  <div className="tc-title">MUSD Testnet 0x118917…</div>
                </div>
                <div className="tc-desc">
                  ERC-20 Bitcoin-backed stablecoin. Natively permit2 + EIP-2612. No approval tx needed. 18 decimals. Already deployed — just import the ABI.
                </div>
              </div>
              <div className="tc-badge">Deployed Primitive</div>
            </div>

            <div className="tech-card medium">
              <div>
                <div className="tc-header">
                  <div className="tc-icon">🔑</div>
                  <div className="tc-title">Mezo Passport v0.1.0</div>
                </div>
                <div className="tc-desc">
                  Email/social authentication creates wallet silently. Zero seed phrase friction. Installs via @mezo-org/passport + RainbowKit + Wagmi.
                </div>
              </div>
              <div className="tc-badge">Authentication</div>
            </div>

            <div className="tech-card medium">
              <div>
                <div className="tc-header">
                  <div className="tc-icon">📋</div>
                  <div className="tc-title">UsernameRegistry.sol</div>
                </div>
                <div className="tc-desc">
                  Mapping of string username to on-chain address. Custom contract deploying on EVM london version for CometBFT compatibility.
                </div>
              </div>
              <div className="tc-badge">Smart Contract (~0.5d)</div>
            </div>

            <div className="tech-card large">
              <div>
                <div className="tc-header">
                  <div className="tc-icon">⚖️</div>
                  <div className="tc-title">SplitManager.sol</div>
                </div>
                <div className="tc-desc">
                  Tab manager storing split balances on-chain. Loops MUSD.transferFrom inside a single transaction to batch-settle all members. Fully tested with Foundry.
                </div>
              </div>
              <div className="tc-badge">Smart Contract (~1.0d)</div>
            </div>

            <div className="tech-card medium">
              <div>
                <div className="tc-header">
                  <div className="tc-icon">📊</div>
                  <div className="tc-title">Goldsky Subgraph</div>
                </div>
                <div className="tc-desc">
                  Real-time indexer monitoring MUSD Transfer events on Chain 31611. Powers balance history and activity feeds with a clean GraphQL API.
                </div>
              </div>
              <div className="tc-badge">Data Indexing (~0.5d)</div>
            </div>

            <div className="tech-card large">
              <div>
                <div className="tc-header">
                  <div className="tc-icon">🏺</div>
                  <div className="tc-title">SavingsPot.sol</div>
                </div>
                <div className="tc-desc">
                  On-chain time-locked savings goals. Solo pots for personal targets, group pots with XMTP invites for shared ones.
                </div>
              </div>
              <div className="tc-badge">Smart Contract (~1.0d)</div>
            </div>
          </div>
          <div className="tech-note">
            <strong>✅ Testnet Build:</strong> All MVP features demo on Chain 31611 · RPC: rpc.test.mezo.org · Faucet: faucet.test.mezo.org · Explorer: explorer.test.mezo.org · Mainnet Chain 31612 for Phase 2.
          </div>
        </section>

        <div className="cta-banner">
          <div>
            <h2>The Venmo moment for Bitcoin finance.</h2>
            <p>
              80 million people just want to split dinner. MezoPay makes Bitcoin-backed MUSD as easy as typing @friend. No addresses. No gas warnings. Just money.
            </p>
          </div>
          <ConnectButton.Custom>
            {({ openConnectModal, account, mounted }) => {
              const ready = mounted;
              const connected = ready && account;
              return (
                <button
                  onClick={connected ? () => router.push("/app/dashboard") : openConnectModal}
                  className="cta-white"
                >
                  {connected ? "Enter App →" : "Connect Wallet →"}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>

        <footer className="landing-footer">
          <div className="footer-logo">MezoPay.</div>
          <div className="footer-links">
            <a href="https://x.com/GetMezoPay" target="_blank" rel="noreferrer">X</a>
            <a href="https://mezo.org/docs/developers/" target="_blank" rel="noreferrer">Mezo Docs</a>
            <a href="https://github.com/mezo-org" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://explorer.test.mezo.org" target="_blank" rel="noreferrer">Explorer</a>
          </div>
          <div className="footer-note">Built on Mezo · MUSD Track · Supernormal dApps</div>
        </footer>
      </div>
    </>
  );
}
