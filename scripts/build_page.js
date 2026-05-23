const fs = require('fs');

const transcriptPath = 'C:/Users/raikw/.gemini/antigravity-ide/brain/0d5e7ec9-f20f-48d2-91b0-9b8cdaa2f6c9/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
let htmlContent = '';
for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  const entry = JSON.parse(lines[i]);
  if (entry.source === 'USER' && entry.content && entry.content.includes('<!DOCTYPE html>')) {
    htmlContent = entry.content;
    break;
  }
}

if (!htmlContent) {
  console.error('HTML content not found in transcript.');
  process.exit(1);
}

// Extract CSS
const cssMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
let css = cssMatch ? cssMatch[1] : '';
css = css.replace(/body \{/g, '.landing-page-wrapper {'); // Scope it

// Extract Body Content
const bodyMatch = htmlContent.match(/<body>([\s\S]*?)<\/body>/);
let bodyHtml = bodyMatch ? bodyMatch[1] : '';

// Remove script tags if any
bodyHtml = bodyHtml.replace(/<script>[\s\S]*?<\/script>/g, '');

// Convert HTML to JSX
let jsx = bodyHtml
  .replace(/class=/g, 'className=')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/onclick=\"([^\"]*)\"/g, '')
  .replace(/style=\"([^\"]*)\"/g, (match, p1) => {
    const styleObj = {};
    p1.split(';').forEach(pair => {
      if (!pair.trim()) return;
      const [key, val] = pair.split(':');
      if (key && val) {
        const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
        styleObj[camelKey] = val.trim();
      }
    });
    return `style={{${Object.entries(styleObj).map(([k,v]) => `${k}: "${v}"`).join(', ')}}}`;
  })
  .replace(/<br>/g, '<br/>')
  .replace(/<input([^>]*[^\/])>/g, '<input$1 />')
  .replace(/<img([^>]*[^\/])>/g, '<img$1 />')
  .replace(/readonly/g, 'readOnly');

// We need to inject the React logic into the phone mockup.
const phoneScreenRegex = /<div className=\"phone-screen\" id=\"phoneScreen\">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;

jsx = jsx.replace(phoneScreenRegex, `
        <div className="phone-screen" id="phoneScreen">
          <div className="p-statusbar">
            <span>9:41</span>
            <span>●●● ▲ 🔋</span>
          </div>
          <div className="p-header">
            <div className="p-app-name">MezoPay<span>.</span></div>
            <div className="p-avatar">AJ</div>
          </div>
          
          {phoneScreen === 'home' && (
            <>
              <div className="p-balance-card">
                <div className="p-bal-lbl">MUSD Balance</div>
                <div className="p-bal-amt" id="balanceDisplay">\${simBalance.toFixed(2)}</div>
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
                <div className="p-tx">
                  <div className="p-tx-av" style={{background: '#F97316'}}>A</div>
                  <div className="p-tx-info">
                    <div className="p-tx-name">@alex</div>
                    <div className="p-tx-note">🍕 Pizza night</div>
                  </div>
                  <div className="p-tx-amt pos">+$30.00</div>
                </div>
                <div className="p-tx">
                  <div className="p-tx-av" style={{background: '#8B5CF6'}}>S</div>
                  <div className="p-tx-info">
                    <div className="p-tx-name">@sarah</div>
                    <div className="p-tx-note">🎬 Movie tickets</div>
                  </div>
                  <div className="p-tx-amt neg">-$15.00</div>
                </div>
                <div className="p-tx">
                  <div className="p-tx-av" style={{background: '#06B6D4'}}>M</div>
                  <div className="p-tx-info">
                    <div className="p-tx-name">@mike</div>
                    <div className="p-tx-note">☕ Coffee</div>
                  </div>
                  <div className="p-tx-amt pos">+$6.25</div>
                </div>
                <div className="p-tx">
                  <div className="p-tx-av" style={{background: '#10B981'}}>R</div>
                  <div className="p-tx-info">
                    <div className="p-tx-name">🏺 Savings Pot</div>
                    <div className="p-tx-note">Japan Trip fund</div>
                  </div>
                  <div className="p-tx-amt neg">-$50.00</div>
                </div>
              </div>
            </>
          )}

          {phoneScreen === 'send' && (
            <div className="p-send-form visible" style={{ margin: 'auto 12px' }}>
              <div className="p-form-label">To @username</div>
              <input className="p-form-input" value={sendTo} placeholder="@friend" readOnly />
              <div className="p-form-label">Amount (MUSD)</div>
              <input className="p-form-input amt" value={sendAmount} placeholder="$0.00" readOnly />
              <button className={\`p-send-btn \${isSending ? 'sending' : ''}\`}>
                {isSending ? 'Sending on Mezo...' : 'Send MUSD →'}
              </button>
            </div>
          )}

          {phoneScreen === 'success' && (
            <div className="p-toast show" style={{ margin: 'auto 12px' }}>
              ✅ Sent \${sendAmount} to {sendTo} — confirmed!
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
`);

jsx = jsx.replace(
  /<a href="#" className="nav-cta">Claim @username →<\/a>/g,
  `<ConnectButton.Custom>
  {({ openConnectModal, account, mounted }) => {
    const ready = mounted;
    const connected = ready && account;
    return (
      <button onClick={connected ? () => router.push('/app/dashboard') : openConnectModal} className="nav-cta">
        {connected ? 'Enter App →' : 'Connect Wallet →'}
      </button>
    );
  }}
</ConnectButton.Custom>`
);

jsx = jsx.replace(
  /<a href="#" className="btn-primary">🟠 Claim @username →<\/a>/g,
  `<ConnectButton.Custom>
  {({ openConnectModal, account, mounted }) => {
    const ready = mounted;
    const connected = ready && account;
    return (
      <button onClick={connected ? () => router.push('/app/dashboard') : openConnectModal} className="btn-primary">
        {connected ? 'Enter App →' : '🟠 Claim @username →'}
      </button>
    );
  }}
</ConnectButton.Custom>`
);

const finalCode = `"use client";

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
  const [simBalance, setSimBalance] = useState(248.50);

  useEffect(() => {
    let isCancelled = false;
    const runDemoLoop = async () => {
      await new Promise(r => setTimeout(r, 2000));
      while (!isCancelled) {
        if (isCancelled) break;
        setPhoneScreen("send");
        setSendTo("");
        setSendAmount("");
        
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
        setSimBalance(prev => prev - 15);
        
        await new Promise(r => setTimeout(r, 2500));
        if (isCancelled) break;
        
        setPhoneScreen("home");
        await new Promise(r => setTimeout(r, 3500));
      }
    };
    runDemoLoop();
    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    if (isConnected) {
      router.push("/app/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="landing-page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: \`\${css}\`}} />
      <div dangerouslySetInnerHTML={{ __html: \`<!-- -->\` }} />
      {/* We had to inject the raw CSS string here using template literal above, so let's use standard JSX below */}
      ${"${jsx}" /* This tells node to dump the jsx string right here */}
    </div>
  );
}
`.replace('// We had to inject the raw CSS string here using template literal above, so let\'s use standard JSX below */}', '// ...').replace('${"${jsx}" /* This tells node to dump the jsx string right here */}', jsx);

fs.writeFileSync('d:/Nikhil Work/mezo hack/apps/web/app/page.tsx', finalCode);
console.log('Successfully wrote page.tsx');
