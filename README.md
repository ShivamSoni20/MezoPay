<div align="center">

# MezoPay

**Self-service Bitcoin banking — send, request, split, and save MUSD by @username. No addresses, no banks, no gas confusion.**

[![Mezo](https://img.shields.io/badge/Mezo-Testnet-F97316?style=for-the-badge&logo=bitcoin&logoColor=white)](https://mezo.org)
[![Track](https://img.shields.io/badge/Hackathon-Supernormal%20dApps%20(MUSD)-22C55E?style=for-the-badge)](https://supernormal.foundation)
[![MUSD](https://img.shields.io/badge/Currency-MUSD-1A1108?style=for-the-badge)](https://mezo.org/docs/developers/musd)
[![Chain](https://img.shields.io/badge/Chain-31611-6B7280?style=for-the-badge)](https://explorer.test.mezo.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![XMTP](https://img.shields.io/badge/XMTP-v7-3B82F6?style=for-the-badge)](https://xmtp.org)
[![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge)](LICENSE)

[Live Demo](#-quick-start) · [Architecture](#-architecture) · [Contracts](./contracts/README.md) · [Mezo Docs](https://mezo.org/docs/developers/) · [Supernormal](https://supernormal.foundation)

</div>

---

## Overview

**MezoPay** is a consumer payments app built for the **Supernormal dApps — MUSD Track** at the Mezo hackathon. It turns Bitcoin-backed **MUSD** into something people actually use: pay a friend, request dinner money, or split a group tab — all with `@username`, not hex addresses.

Mezo lets Bitcoin holders mint MUSD against BTC collateral at transparent, onchain terms. MezoPay sits on top as the consumer banking layer: send to @username, split group bills, and save toward goals — all in MUSD, all on Bitcoin rails.

> **Hackathon focus:** Self-service banking on Bitcoin rails — MUSD as the primary medium of exchange for real-world payment flows (P2P send, requests, splits, merchant-ready primitives).

---

## Why Mezo + MUSD

| Mezo principle | How MezoPay applies it |
|----------------|------------------------|
| Bitcoin-backed stablecoin | All flows settle in **MUSD** on Mezo testnet |
| User-controlled, onchain | Transfers & splits via smart contracts; positions auditable on explorer |
| Productive capital | Dashboard surfaces live yield accrual (Mezo Earn narrative) |
| No selling BTC | Spend/split/request in MUSD while keeping BTC exposure via Mezo’s model |
| Superdapp vision | Payments + group splits + savings pots = full self-service Bitcoin banking |

---

## Features

| Feature | Description |
|---------|-------------|
| **Quick Send** | Send MUSD to `@username` or `0x` address via onchain `transfer` |
| **Payment Requests** | Request MUSD with **XMTP** instant notifications, or share a payment link fallback |
| **Group Split Tabs** | Onchain `SplitManager` — create tabs, track shares, settle with MUSD (+ EIP-2612 permit path) |
| **@username Registry** | `UsernameRegistry.sol` maps handles → wallets (3–20 chars, lowercase) |
| **Live Activity** | Goldsky subgraph indexes transfers, tabs, and registry events |
| **Savings Pots** | SavingsPot.sol — solo or group time-locked MUSD savings goals. XMTP invites for group coordination. Deposit, lock, withdraw on unlock date. |
| **Wallet UX** | [@mezo-org/passport](https://www.npmjs.com/package/@mezo-org/passport) + RainbowKit — email/social-friendly onboarding |

---

## Savings Pots

On-chain time-locked savings goals via `SavingsPot.sol`:
- **Solo pots** — personal goals (house deposit, trip fund) with configurable lock duration
- **Group pots** — invite friends via XMTP, everyone deposits their share, time lock enforced on-chain
- **No custody risk** — MUSD stays in the contract, not with any intermediary
- Deployed at `0x72290EB00a06c4a5582c64e8E336F6e4D242bE87` on Mezo testnet

---

## Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'DM Sans, sans-serif', 'primaryColor': '#FFF7ED', 'primaryTextColor': '#1A1108', 'primaryBorderColor': '#F97316', 'secondaryColor': '#F0FDF4', 'secondaryBorderColor': '#22C55E', 'tertiaryColor': '#EFF6FF', 'tertiaryBorderColor': '#3B82F6', 'lineColor': '#F97316'}}}%%
flowchart TB
    subgraph users["👤 Users"]
        U1[Sender]
        U2[Recipient]
    end

    subgraph frontend["🟠 MezoPay Frontend — Next.js 14"]
        UI[Landing + App Shell]
        DASH[Dashboard · Send · Request · Split · Save]
        XMTP_UI[XMTP Enable + Request Stream]
        WALLET[Mezo Passport + RainbowKit + Wagmi]
    end

    subgraph offchain["🔵 Real-time Layer"]
        XMTP[XMTP Browser SDK<br/>Encrypted payment requests]
        GOLDSKY[Goldsky Subgraph<br/>GraphQL indexer]
        LS[(Browser localStorage<br/>Request state)]
    end

    subgraph mezo["🟢 Mezo Testnet — Chain 31611"]
        MUSD[(MUSD ERC-20<br/>0x1189…c503)]
        REG[UsernameRegistry]
        SPLIT[SplitManager]
        POT[SavingsPot]
    end

    U1 --> UI
    U2 --> UI
    UI --> DASH
    DASH --> WALLET
    DASH --> XMTP_UI
    WALLET --> MUSD
    WALLET --> REG
    WALLET --> SPLIT
    WALLET --> POT
    XMTP_UI --> XMTP
    XMTP --> LS
    DASH --> GOLDSKY
    GOLDSKY --> MUSD
    GOLDSKY --> REG
    GOLDSKY --> SPLIT
    GOLDSKY --> POT
    SPLIT --> MUSD
    SPLIT --> REG
    POT --> MUSD
    XMTP -.->|mezopay_request / settled / invites| U2

    classDef mezo fill:#F0FDF4,stroke:#22C55E,stroke-width:2px,color:#1A1108
    classDef front fill:#FFF7ED,stroke:#F97316,stroke-width:2px,color:#1A1108
    classDef rt fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px,color:#1A1108
    class MUSD,REG,SPLIT,POT mezo
    class UI,DASH,XMTP_UI,WALLET front
    class XMTP,GOLDSKY,LS rt
```

### XMTP Notification Flows

#### 1. Payment Requests
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#FFF7ED', 'actorBorder': '#F97316', 'actorTextColor': '#1A1108', 'signalColor': '#F97316', 'noteBkgColor': '#F0FDF4', 'noteBorderColor': '#22C55E'}}}%%
sequenceDiagram
    autonumber
    participant Alice as Sender
    participant App as MezoPay
    participant XMTP as XMTP Network
    participant Bob as Recipient
    participant Chain as Mezo + MUSD

    Alice->>App: Request $5 from @bob
    App->>Chain: Resolve @bob via UsernameRegistry
    App->>XMTP: Encrypted mezopay_request JSON
    XMTP-->>Bob: Stream → toast + pending list
    Bob->>App: Pay request
    App->>Chain: MUSD.transfer to Alice
    App->>XMTP: mezopay_payment_completed
    XMTP-->>Alice: Settlement notification
```

#### 2. Savings Pot Invites
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#FFF7ED', 'actorBorder': '#F97316', 'actorTextColor': '#1A1108', 'signalColor': '#F97316', 'noteBkgColor': '#F0FDF4', 'noteBorderColor': '#22C55E'}}}%%
sequenceDiagram
    autonumber
    participant Alice as Creator
    participant App as MezoPay
    participant XMTP as XMTP Network
    participant Bob as Invitee
    participant Chain as SavingsPot.sol

    Alice->>Chain: createPot(Group Trip)
    Alice->>App: Invite @bob
    App->>XMTP: Encrypted invite message
    XMTP-->>Bob: Stream → "Join my Savings Pot!"
    Bob->>App: Open Pot Details
    Bob->>Chain: deposit(MUSD)
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS 4 |
| Wallet | Wagmi 2, Viem, RainbowKit, `@mezo-org/passport` |
| Messaging | `@xmtp/browser-sdk` v7 (MLS, opt-in enable + silent resume) |
| Indexing | Goldsky subgraph (`mezopay` on `mezo-testnet`) |
| Contracts | Solidity 0.8.28, Foundry, OpenZeppelin (see [contracts/README.md](./contracts/README.md)) |

---

## Repository layout

```
apps/web/
├── app/                 # Next.js App Router (landing + /app/*)
├── components/          # Wallet providers, ConnectWallet
├── contracts/           # Foundry — UsernameRegistry, SplitManager
├── lib/                 # ABIs, XMTP helpers, request storage
├── subgraph/            # Goldsky / The Graph mappings
└── public/
```

---

## Quick start

### Prerequisites

- Node.js 20+
- A [WalletConnect](https://cloud.reown.com) project ID (allowlist `http://localhost:3000` and your deploy URL)
- Mezo testnet MUSD ([faucet](https://faucet.test.mezo.org))

### 1. Install & configure

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and set at least `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. The `NEXT_PUBLIC_GOLDSKY_URL` is already pre-configured to point to our live Goldsky deployment, so you don't need to deploy your own indexer. See [`.env.example`](.env.example) for all variables and comments.

### 2. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → connect wallet → enable **XMTP Notifications** in the sidebar (one-time MetaMask signature).

### 3. Deploy contracts (optional)

See [contracts/README.md](./contracts/README.md).

---

## Testnet deployment

| Resource | URL |
|----------|-----|
| RPC | `https://rpc.test.mezo.org` |
| Chain ID | `31611` |
| Explorer | [explorer.test.mezo.org](https://explorer.test.mezo.org) |
| Faucet | [faucet.test.mezo.org](https://faucet.test.mezo.org) |

| Contract | Address |
|----------|---------|
| MUSD (official testnet) | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |
| UsernameRegistry | `0x8eB4E69A550Dc63BaB674469eBC516d893793de8` |
| SplitManager | `0x9cd6D4A92939A1b93fBb3c848c2cF3e9f09D4C10` |

---

## Useful links

- [Mezo Documentation](https://mezo.org/docs/developers/)
- [What is MUSD?](https://mezo.org/docs/developers/musd)
- [Introducing Mezo Earn](https://mezo.org/docs/developers/earn)
- [Mezo GitHub](https://github.com/mezo-org)
- [@mezo-org/passport on npm](https://www.npmjs.com/package/@mezo-org/passport)
- [Supernormal Foundation](https://supernormal.foundation)
- [XMTP Docs](https://docs.xmtp.org)

---

## Team & license

Built for the **Mezo × Supernormal** hackathon — original work developed during the event.

MIT © 2026 MezoPay Contributors — see [LICENSE](LICENSE).

---

<div align="center">

**Bitcoin should feel as normal as using your phone. MezoPay is a step toward that with MUSD.**

</div>
