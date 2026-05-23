const fs = require('fs');
const path = 'd:/Nikhil Work/mezo hack/apps/web/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace CSS
const oldCssStart = content.indexOf('/* TECH SECTION & BENTO GRID */');
const oldCssEnd = content.indexOf('@media (max-width: 900px)');
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

        `;
  content = content.substring(0, oldCssStart) + newCss + content.substring(oldCssEnd);
}

// Replace JSX to add links to badges
const oldJsxStart = content.indexOf('<div className="tc-badge">0x118917…c503 · Chain 31611</div>');
const oldJsxEnd = content.indexOf('<div className="tc-badge">mezosplit/v4 · Live endpoint</div>') + 60;

if (oldJsxStart !== -1 && oldJsxEnd !== -1) {
  const newJsx = `<a href="https://explorer.test.mezo.org/address/0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" target="_blank" rel="noreferrer" className="tc-badge">0x118917…c503 · Chain 31611</a>
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
              <a href="https://www.npmjs.com/package/@mezo-org/passport" target="_blank" rel="noreferrer" className="tc-badge">@mezo-org/passport</a>
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
              <a href="https://explorer.test.mezo.org/address/0x8eB4E69A550Dc63BaB674469eBC516d893793de8" target="_blank" rel="noreferrer" className="tc-badge">0x8eB4E6…3de8</a>
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
              <a href="https://explorer.test.mezo.org/address/0x9cd6D4A92939A1b93fBb3c848c2cF3e9f09D4C10" target="_blank" rel="noreferrer" className="tc-badge">0x9cd6D4…C10</a>
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
              <a href="https://explorer.test.mezo.org/address/0x72290EB00a06c4a5582c64e8E336F6e4D242bE87" target="_blank" rel="noreferrer" className="tc-badge">0x72290E…bE87</a>
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
              <a href="https://api.goldsky.com" target="_blank" rel="noreferrer" className="tc-badge">mezosplit/v4 · Live endpoint</a>`;
  content = content.substring(0, oldJsxStart) + newJsx + content.substring(oldJsxEnd);
}

fs.writeFileSync(path, content);
console.log('Update Phase 2 complete.');
