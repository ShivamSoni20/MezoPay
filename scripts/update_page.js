const fs = require('fs');
const path = 'd:/Nikhil Work/mezo hack/apps/web/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace CSS block
const oldCssStart = content.indexOf('/* TECH SECTION & BENTO GRID */');
const oldCssEnd = content.indexOf('/* FOOTER */');
if (oldCssStart !== -1 && oldCssEnd !== -1) {
  const newCss = `/* TECH SECTION & BENTO GRID */
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

        `;
  content = content.substring(0, oldCssStart) + newCss + content.substring(oldCssEnd);
}

// Replace JSX block
const oldJsxStart = content.indexOf('<section className="tech" id="tech">');
const oldJsxEnd = content.indexOf('<footer className="landing-footer">');
if (oldJsxStart !== -1 && oldJsxEnd !== -1) {
  const newJsx = `<div className="tech-wrapper">
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
              <div className="tc-badge">0x118917…c503 · Chain 31611</div>
            </div>

            <div className="tech-card">
              <div>
                <div className="tc-header">
                  <div className="tc-icon">🔑</div>
                  <div className="tc-title">Mezo Passport v0.17.2</div>
                </div>
                <div className="tc-desc">
                  Email/social authentication creates wallet silently. Zero seed phrase friction. Installed via @mezo-org/passport + RainbowKit + Wagmi.
                </div>
              </div>
              <div className="tc-badge">@mezo-org/passport</div>
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
              <div className="tc-badge">0x8eB4E6…3de8</div>
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
              <div className="tc-badge">0x9cd6D4…C10</div>
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
              <div className="tc-badge">0x72290E…bE87</div>
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
              <div className="tc-badge">mezosplit/v4 · Live endpoint</div>
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
        `;
  content = content.substring(0, oldJsxStart) + newJsx + content.substring(oldJsxEnd);
}

// Since we opened a tech-wrapper div, we need to close it after the footer.
content = content.replace('</footer>', '</footer></div>');

fs.writeFileSync(path, content);
console.log('Update complete.');
