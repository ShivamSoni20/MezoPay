"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const [phoneScreen, setPhoneScreen] = useState<"home" | "send" | "success">("home");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showNewTx, setShowNewTx] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const runDemoLoop = async () => {
      await new Promise(r => setTimeout(r, 2000));
      while (!isCancelled) {
        if (isCancelled) break;
        setPhoneScreen("send");
        setSendTo("");
        setSendAmount("");
        setShowNewTx(false);

        await new Promise(r => setTimeout(r, 800));
        if (isCancelled) break;

        const targetUser = "@satoshi";
        for (let i = 1; i <= targetUser.length; i++) {
          if (isCancelled) break;
          setSendTo(targetUser.slice(0, i));
          await new Promise(r => setTimeout(r, 100));
        }

        await new Promise(r => setTimeout(r, 400));
        if (isCancelled) break;

        const targetAmt = "15.00";
        for (let i = 1; i <= targetAmt.length; i++) {
          if (isCancelled) break;
          setSendAmount(targetAmt.slice(0, i));
          await new Promise(r => setTimeout(r, 150));
        }

        await new Promise(r => setTimeout(r, 800));
        if (isCancelled) break;

        setIsSending(true);
        await new Promise(r => setTimeout(r, 1200));
        if (isCancelled) break;

        setIsSending(false);
        setPhoneScreen("success");
        setShowNewTx(true);

        await new Promise(r => setTimeout(r, 2500));
        if (isCancelled) break;

        setPhoneScreen("home");
        await new Promise(r => setTimeout(r, 3500));
      }
    };
    runDemoLoop();
    return () => { isCancelled = true; };
  }, []);

  // Redirect to dashboard immediately if wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push("/app/dashboard");
    }
  }, [isConnected, router]);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
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
          align-items: start;
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
          margin-bottom: 12px;
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
          font-size: clamp(2.2rem, 3.8vw, 3.3rem);
          font-weight: 800;
          line-height: 1.07;
          margin-bottom: 8px;
          color: var(--dark);
        }

        .landing-h1 .accent {
          color: var(--orange);
        }

        .hero-desc {
          font-size: 0.95rem;
          color: var(--gray);
          line-height: 1.72;
          max-width: 478px;
          margin-bottom: 16px;
        }

        .hero-ctas {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
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
          margin-bottom: 16px;
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
          gap: 14px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          flex-wrap: nowrap;
          justify-content: space-between;
        }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
        }

        .stat-lbl {
          font-size: 0.68rem;
          color: var(--gray);
          margin-top: 2px;
          white-space: nowrap;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          margin-top: -35px;
        }

        .phone-shell {
          width: 310px;
          background: #111;
          border-radius: 42px;
          padding: 10px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.08),
            0 40px 80px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.12);
          position: relative;
          z-index: 2;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-11px); }
        }

        .phone-notch {
          width: 80px; height: 22px;
          background: #111;
          border-radius: 0 0 16px 16px;
          margin: 0 auto 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .notch-camera {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #000;
          border: 1px solid #222;
        }

        .notch-sensor {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #000;
        }

        .phone-screen {
          background: #0E0A05;
          border-radius: 34px;
          overflow: hidden;
          height: 560px;
          display: flex;
          flex-direction: column;
          color: white;
        }

        .p-statusbar {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px 4px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
        }

        .p-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
        }

        .p-app-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
        }
        .p-app-name span { color: #F97316; }

        .p-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #3B82F6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }

        .p-balance-card {
          margin: 0 12px 12px;
          background: linear-gradient(135deg, #1A1108 0%, #2D1A05 60%, rgba(249,115,22,0.15) 100%);
          border: 1px solid rgba(249,115,22,0.2);
          border-radius: 18px;
          padding: 18px;
        }

        .p-bal-lbl {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .p-bal-amt {
          font-family: 'Syne', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 8px;
        }

        .p-bal-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.5);
        }

        .p-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          padding: 0 12px;
          margin-bottom: 20px;
        }

        .p-action-btn {
          background: #1A1108;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 12px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .p-action-btn:hover {
          background: #2D1A05;
          border-color: rgba(249,115,22,0.3);
        }

        .p-action-icon {
          font-size: 18px;
          margin-bottom: 6px;
        }

        .p-action-lbl {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
        }

        .p-section-lbl {
          padding: 0 20px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          margin-bottom: 12px;
        }

        .p-tx-list {
          flex: 1;
          padding: 0 12px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .p-tx-list::-webkit-scrollbar {
          display: none;
        }

        .p-tx {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #1A1108;
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .p-tx-av {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .p-tx-info { flex: 1; }
        .p-tx-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
        .p-tx-note { font-size: 11px; color: rgba(255,255,255,0.5); }
        .p-tx-amt { font-size: 14px; font-weight: 700; }
        .p-tx-amt.pos { color: #22C55E; }
        .p-tx-amt.neg { color: #EF4444; }

        .p-send-form {
          margin: 0 12px;
          background: #1A1108;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 18px;
          padding: 20px;
        }

        .p-form-label {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .p-form-input {
          width: 100%;
          background: #0E0A05;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 14px;
          color: white;
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          margin-bottom: 16px;
          outline: none;
        }

        .p-form-input.amt {
          font-size: 24px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          padding: 16px 14px;
        }

        .p-form-input.typing {
          border-color: #F97316;
          box-shadow: 0 0 0 2px rgba(249,115,22,0.2);
        }

        .p-send-btn {
          width: 100%;
          background: #F97316;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }

        .p-send-btn.sending {
          background: #EA6500;
          opacity: 0.8;
        }

        .p-toast {
          margin: auto 12px;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22C55E;
          padding: 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          line-height: 1.4;
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
        .tech-wrapper {
          background: #0E0A05;
          padding-bottom: 60px;
        }

        .tech {
          padding: 78px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tech .sec-title {
          color: white;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 3.5rem;
        }

        .tech .sec-sub {
          color: rgba(255,255,255,0.6);
          font-size: 1rem;
          margin-top: 12px;
          max-width: 500px;
          line-height: 1.6;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 42px;
        }

        .tech-card {
          background: #1A1108;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid rgba(255,255,255,0.05);
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
          border-color: rgba(249, 115, 22, 0.3);
        }

        .tc-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .tc-icon {
          font-size: 1.35rem;
        }

        .tc-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: white;
        }

        .tc-desc {
          font-size: 0.88rem;
          color: rgba(255,255,255,0.6);
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
          background: rgba(249, 115, 22, 0.1);
          color: var(--orange);
          font-family: 'DM Mono', monospace;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .tc-badge:hover {
          background: var(--orange);
          color: white;
        }

        /* CTA */
        .cta-banner {
          margin: 56px auto;
          max-width: 1100px;
          width: 90%;
          border-radius: 21px;
          background: linear-gradient(135deg, #2D1A05 0%, #1A1108 100%);
          border: 1px solid rgba(249, 115, 22, 0.15);
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
          font-size: 2.2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
        }

        .cta-banner p {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.95rem;
          line-height: 1.65;
          max-width: 500px;
        }

        .cta-btns {
          display: flex;
          gap: 16px;
          align-items: center;
          z-index: 2;
        }

        .cta-orange {
          background: var(--orange);
          color: white;
          border: none;
          border-radius: 11px;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .cta-orange:hover {
          background: var(--orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
        }

        .cta-white {
          background: white;
          color: var(--dark);
          border: none;
          border-radius: 11px;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .cta-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,255,255,0.2);
        }

        /* FOOTER */
        .landing-footer {
          background: transparent;
          border-top: 1px solid rgba(255,255,255,0.05);
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
          color: white;
          font-size: 0.97rem;
        }

        .footer-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .footer-links a {
          text-decoration: none;
          color: rgba(255,255,255,0.5);
          font-size: 0.82rem;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: white;
        }

        .footer-note {
          font-size: 0.77rem;
          color: rgba(255,255,255,0.4);
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
        
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .hero > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-ctas, .badge-row {
            justify-content: center;
          }
          .hero-stats {
            justify-content: center;
            flex-wrap: wrap !important;
            gap: 20px;
          }
          .stat-lbl {
            white-space: normal !important;
          }
          .landing-h1 {
            font-size: clamp(2rem, 8vw, 2.5rem);
          }
          .hero-desc {
            margin: 0 auto 16px auto;
          }
          .nav-links {
            display: none;
          }
          .tech-grid, .features-grid, .how-grid, .earn-strip-inner {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .earn-stat-row {
            flex-wrap: wrap;
            justify-content: center;
          }
          .footer-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
          }
          .cta-btns {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
          }
          .cta-btns button, .cta-btns a {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
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
              <span className="pulse"></span>MezoPay is Live • Bitcoin-backed MUSD payments are here
            </div>
            <h1 className="landing-h1">
              Bitcoin as normal<br /><span className="accent">as your phone.</span>
            </h1>
            <p className="hero-desc" style={{ maxWidth: "620px" }}>
              The Venmo moment for Bitcoin. Pay @friends, split group tabs, and save in MUSD instantly. Zero gas fees, zero hex addresses. <strong style={{ whiteSpace: "nowrap" }}>True consumer banking on Bitcoin L2.</strong>
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

            <div className="badge-row">
              <span className="badge">⚡ EIP-712 Gasless</span>
              <span className="badge">🔒 Mezo Passport</span>
              <span className="badge">📊 Goldsky Feed</span>
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
            <div className="phone-shell">
              <div className="phone-notch">
                <div className="notch-camera"></div>
                <div className="notch-sensor"></div>
              </div>
              <div className="phone-screen" id="phoneScreen">
                <div className="p-statusbar">
                  <span>9:41</span>
                  <span>●●● ▲ 🔋</span>
                </div>
                <div className="p-header">
                  <div className="p-app-name">MezoPay<span>.</span></div>
                  <div className="p-avatar">AJ</div>
                </div>

                {phoneScreen === "home" && (
                  <>
                    <div className="p-balance-card">
                      <div className="p-bal-lbl">MUSD Balance</div>
                      <div className="p-bal-amt" id="balanceDisplay">$1,258.00</div>
                      <div className="p-bal-sub">⚡ Bitcoin-backed · EIP-2612 gasless</div>
                    </div>
                    <div className="p-actions">
                      <div className="p-action-btn">
                        <div className="p-action-icon">↑</div>
                        <div className="p-action-lbl">Send</div>
                      </div>
                      <div className="p-action-btn">
                        <div className="p-action-icon">↓</div>
                        <div className="p-action-lbl">Request</div>
                      </div>
                      <div className="p-action-btn">
                        <div className="p-action-icon">⚖️</div>
                        <div className="p-action-lbl">Split</div>
                      </div>
                    </div>
                    <div className="p-section-lbl" id="actLabel">Recent Activity</div>
                    <div className="p-tx-list" id="txList" style={{ overflowY: 'auto' }}>
                      {showNewTx && (
                        <div className="p-tx">
                          <div className="p-tx-av" style={{ background: '#EAB308' }}>S</div>
                          <div className="p-tx-info">
                            <div className="p-tx-name">@satoshi</div>
                            <div className="p-tx-note">Sent MUSD</div>
                          </div>
                          <div className="p-tx-amt neg">-$15.00</div>
                        </div>
                      )}
                      <div className="p-tx">
                        <div className="p-tx-av" style={{ background: '#F97316' }}>A</div>
                        <div className="p-tx-info">
                          <div className="p-tx-name">@alex</div>
                          <div className="p-tx-note">🍕 Pizza night</div>
                        </div>
                        <div className="p-tx-amt pos">+$30.00</div>
                      </div>
                      <div className="p-tx">
                        <div className="p-tx-av" style={{ background: '#8B5CF6' }}>S</div>
                        <div className="p-tx-info">
                          <div className="p-tx-name">@sarah</div>
                          <div className="p-tx-note">🎬 Movie tickets</div>
                        </div>
                        <div className="p-tx-amt neg">-$15.00</div>
                      </div>
                      <div className="p-tx">
                        <div className="p-tx-av" style={{ background: '#06B6D4' }}>M</div>
                        <div className="p-tx-info">
                          <div className="p-tx-name">@mike</div>
                          <div className="p-tx-note">☕ Coffee</div>
                        </div>
                        <div className="p-tx-amt pos">+$6.25</div>
                      </div>
                    </div>
                  </>
                )}

                {phoneScreen === "send" && (
                  <div className="p-send-form visible">
                    <div className="p-form-label">To @username</div>
                    <input className={`p-form-input ${sendTo ? 'typing' : ''}`} value={sendTo} placeholder="@friend" readOnly />
                    <div className="p-form-label">Amount (MUSD)</div>
                    <input className="p-form-input amt" value={sendAmount} placeholder="$0.00" readOnly />
                    <button className={`p-send-btn ${isSending ? 'sending' : ''}`}>
                      {isSending ? "Sending on Mezo..." : "Send MUSD →"}
                    </button>
                  </div>
                )}

                {phoneScreen === "success" && (
                  <div className="p-toast show">
                    ✅ Sent ${sendAmount} to {sendTo} — confirmed!
                  </div>
                )}
              </div>
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
              <p>Connect your wallet seamlessly via RainbowKit and <strong>Mezo Passport</strong>. Register your @username on-chain via UsernameRegistry.sol — instant, permanent.</p>
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
                <h3>Mezo Passport Integration</h3>
                <p>
                  Powered by the official @mezo-org/passport SDK. We wrap our Wagmi and RainbowKit configuration with the Passport provider, enabling a seamless and native connection to the Mezo testnet.
                </p>
                <span className="f-pill">✓ MVP · Testnet ready</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">💸</div>
                <h3>Username-Based MUSD Transfers</h3>
                <p>
                  Send MUSD to friends using just their @handle. No more copying complex 0x addresses. Fast, secure, and direct on-chain settlement on the Mezo network.
                </p>
                <span className="f-pill">✓ MVP · Testnet ready</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">⚖️</div>
                <h3>Group Tab Splitting</h3>
                <p>
                  Built for the Social & Creator Economy. Splitting dinner, rent, or trips is now a single tap. Our on-chain SplitManager contract batch-settles all group debts instantly in MUSD without middlemen.
                </p>
                <span className="f-pill">✓ MVP · Testnet ready</span>
              </div>
              <div className="feature-card">
                <div className="f-icon">📡</div>
                <h3>Real-time Activity Feed</h3>
                <p>
                  Money is social. Powered by a custom Goldsky subgraph, MezoPay features a fast activity feed so you can track your history and see when you or your friends interact with the protocol.
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
                <h3>Tap-to-Pay Virtual Card</h3>
                <p>
                  Bridging MUSD to the real world. A full virtual debit card UI designed for everyday commerce. Spend your Bitcoin-backed stablecoins at any physical merchant terminal (Phase 2 Marqeta integration).
                </p>
                <span className="f-pill phase2">→ Coming Soon · Phase 2</span>
              </div>
            </div>
          </div>
        </section>

        <div className="earn-strip">
          <div className="earn-strip-inner">
            <div>
              <h3>🏦 The Ultimate Venmo for Bitcoin L2</h3>
              <p>
                Say goodbye to clunky crypto UX. MezoPay transforms your MUSD into a seamless, everyday balance. Pay friends instantly via @usernames, split group bills, or lock funds in savings pots—all settling securely on the Mezo testnet.
              </p>
            </div>
            <div className="earn-stat-row">
              <div>
                <div className="es-v">Fast</div>
                <div className="es-l">Settlement time</div>
              </div>
              <div>
                <div className="es-v">$0 Gas</div>
                <div className="es-l">For the receiver</div>
              </div>
              <div>
                <div className="es-v">MUSD</div>
                <div className="es-l">Powered by Bitcoin L2</div>
              </div>
              <div>
                <div className="es-v">Global</div>
                <div className="es-l">Send anywhere, anytime</div>
              </div>
            </div>
          </div>
        </div>

        <div className="tech-wrapper">
          <section className="tech" id="tech">
            <div className="sec-lbl">TECHNICAL STACK</div>
            <div className="sec-title">Built on Mezo primitives</div>
            <div className="sec-sub">Every feature is backed by real on-chain contracts or official Mezo infrastructure — not simulated.</div>
            <div className="tech-grid">
              <div className="tech-card">
                <div>
                  <div className="tc-header">
                    <div className="tc-icon">🟠</div>
                    <div className="tc-title">MUSD (Official Testnet)</div>
                  </div>
                  <div className="tc-desc">
                    ERC-20 Bitcoin-backed stablecoin. Natively EIP-2612 + Permit2. No approval tx needed. 18 decimals. The primary currency for all MezoPay flows.
                  </div>
                </div>
                <a href="https://explorer.test.mezo.org/address/0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" target="_blank" rel="noreferrer" className="tc-badge">MUSD Contract ↗</a>
              </div>

              <div className="tech-card">
                <div>
                  <div className="tc-header">
                    <div className="tc-icon">🔑</div>
                    <div className="tc-title">Mezo Passport Integration</div>
                  </div>
                  <div className="tc-desc">
                    Seamless Web3 wallet connection powered by @mezo-org/passport and RainbowKit. Users connect their preferred wallet, which our Username Registry instantly maps to a human-readable @handle.
                  </div>
                </div>
                <a href="https://www.npmjs.com/package/@mezo-org/passport" target="_blank" rel="noreferrer" className="tc-badge">Mezo Passport ↗</a>
              </div>

              <div className="tech-card">
                <div>
                  <div className="tc-header">
                    <div className="tc-icon">📋</div>
                    <div className="tc-title">UsernameRegistry.sol</div>
                  </div>
                  <div className="tc-desc">
                    Custom on-chain handle registry. string → address and reverse lookup. Case-insensitive, 3-20 chars, deployed on Mezo testnet.
                  </div>
                </div>
                <a href="https://explorer.test.mezo.org/address/0x8eB4E69A550Dc63BaB674469eBC516d893793de8" target="_blank" rel="noreferrer" className="tc-badge">UsernameRegistry.sol ↗</a>
              </div>

              <div className="tech-card">
                <div>
                  <div className="tc-header">
                    <div className="tc-icon">⚖️</div>
                    <div className="tc-title">SplitManager.sol</div>
                  </div>
                  <div className="tc-desc">
                    Tab manager that batch-settles MUSD.transferFrom in a single transaction across all members. EIP-2612 permit path for gasless settlement.
                  </div>
                </div>
                <a href="https://explorer.test.mezo.org/address/0x9cd6D4A92939A1b93fBb3c848c2cF3e9f09D4C10" target="_blank" rel="noreferrer" className="tc-badge">SplitManager.sol ↗</a>
              </div>

              <div className="tech-card">
                <div>
                  <div className="tc-header">
                    <div className="tc-icon">🏺</div>
                    <div className="tc-title">SavingsPot.sol</div>
                  </div>
                  <div className="tc-desc">
                    On-chain time-locked savings goals. Solo pots for personal targets, group pots with XMTP invites. Strict unlock time enforced on-chain.
                  </div>
                </div>
                <a href="https://explorer.test.mezo.org/address/0x72290EB00a06c4a5582c64e8E336F6e4D242bE87" target="_blank" rel="noreferrer" className="tc-badge">SavingsPot.sol ↗</a>
              </div>

              <div className="tech-card">
                <div>
                  <div className="tc-header">
                    <div className="tc-icon">📊</div>
                    <div className="tc-title">Goldsky Subgraph</div>
                  </div>
                  <div className="tc-desc">
                    Real-time indexer monitoring MUSD Transfer events, tab creations, pot deposits on Chain 31611. Powers live activity feeds with GraphQL.
                  </div>
                </div>
                <a href="https://api.goldsky.com" target="_blank" rel="noreferrer" className="tc-badge">Goldsky Subgraph ↗</a>
              </div>
            </div>
          </section>

          <div className="cta-banner">
            <div>
              <h2>The Venmo<br />moment<br />for Bitcoin.</h2>
              <p>
                80 million Bitcoin holders want to split dinner, pay rent, and save for a trip. MezoPay makes Bitcoin-backed MUSD as easy as typing @friend. No addresses. No gas warnings. Just money.
              </p>
            </div>
            <div className="cta-btns">
              <ConnectButton.Custom>
                {({ openConnectModal, account, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account;
                  return (
                    <button
                      onClick={connected ? () => router.push("/app/dashboard") : openConnectModal}
                      className="cta-orange"
                    >
                      {connected ? "Enter App →" : "🟠 Claim @username"}
                    </button>
                  );
                }}
              </ConnectButton.Custom>
              <a href="https://mezo.org/docs" target="_blank" rel="noreferrer" className="cta-white">
                Read Mezo Docs →
              </a>
            </div>
          </div>
          <footer className="landing-footer">
            <div className="footer-logo">MezoPay.</div>
            <div className="footer-links">
              <a href="https://x.com/GetMezoPay" target="_blank" rel="noreferrer">X</a>
              <a href="https://mezo.org/docs/developers/" target="_blank" rel="noreferrer">Mezo Docs</a>
              <a href="https://github.com/NikhilRaikwar/MezoPay" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://explorer.test.mezo.org" target="_blank" rel="noreferrer">Explorer</a>
            </div>
            <div className="footer-note">Built on Mezo · MUSD Track · Supernormal dApps</div>
          </footer></div>
      </div>
    </>
  );
}
