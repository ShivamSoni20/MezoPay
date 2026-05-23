# Hackathon Submission Draft: MezoPay

**Project Name**
MezoPay

**Team Members**
NIKHIL RAIKWAR - Leader

**Project Description**
MezoPay is the ultimate decentralized Venmo built natively on Mezo. It bridges the gap between Web3 complexity and everyday utility by offering a "Supernormal" consumer banking experience. Users can seamlessly acquire Bitcoin-backed MUSD, send gasless peer-to-peer payments via `@username` handles, split group tabs instantly, and lock funds into shared savings pots—all while their wealth remains secured by the Bitcoin network.

**Project Challenges & Tracks**
Supernormal dApps - MUSD Track

---

### Submission Details

**Required: Provide a detailed explanation of your submission.**
We built MezoPay to answer a critical question: *How do we make using Bitcoin as normal as using your phone?* 
Our process started with the understanding that consumers hate crypto friction—hex addresses, gas fees, and seed phrases are absolute dealbreakers for everyday payments. 

To solve this, we architected a full consumer banking layer on top of Mezo's MUSD infrastructure:
1. **Identity via Mezo Passport:** We integrated `@mezo-org/passport` for silent wallet creation via email/social login. We wrote a custom `UsernameRegistry.sol` contract so users register case-insensitive handles (e.g., `@satoshi`).
2. **Gasless Payments:** We deeply integrated MUSD's native EIP-2612 Permit2 capabilities. Senders sign off-chain, and receivers never have to worry about funding their wallets with native tokens to cover gas. 
3. **Multiplayer Finance:** We wrote and deployed `SplitManager.sol` for one-tap group bill splitting, and `SavingsPot.sol` for time-locked individual or group savings goals. 
4. **Real-time Social Feed:** We deployed a custom Goldsky Subgraph to index all MUSD transfers and tab creations instantly, rendering a live, Venmo-style activity feed in the app.
5. **Decentralized Notifications:** We integrated XMTP v7 so payment requests and group invites trigger encrypted, decentralized notifications.

**Link to Code**
https://github.com/NikhilRaikwar/MezoPay

**Link to Presentation**
[INSERT YOUR GOOGLE SLIDES / DOCSEND LINK HERE]

**Link to Demo Video**
[INSERT YOUR YOUTUBE VIDEO LINK HERE]

**Live Demo Link**
https://mezopay.nikhilraikwar.me

**Project Readiness**
Working Demo

---

### Deep Dive

**How it works**
**Problem:** Crypto is fundamentally unsuited for everyday commerce because the UX is terrifying for average users.
**Functionality:** MezoPay abstracts everything away. Users log in with an email, claim a `@handle`, and are immediately dropped into a clean dashboard. If they want to split a dinner bill, they type in their friends' handles and hit "Split." The `SplitManager.sol` contract handles the complex fractional math and batch-settles the MUSD transfers on-chain in a single transaction.
**MUSD Positioning:** MUSD is the absolute core of the app. Users acquire MUSD seamlessly on the Mezo portal and then use MezoPay as their primary checking account to spend, split, and save it socially without ever touching native BTC.

**Target Group**
Our target audience is everyday consumers, friend groups, and digital creators who want to transact globally without banking intermediaries. This aligns perfectly with the "Supernormal dApps" track because it positions MUSD as a medium of exchange for real-world scenarios (paying rent, funding a group vacation, sending a tip) without forcing the user to understand DeFi mechanics.

**Product/Product Category**
Payment systems, Social & Creator Economy, Savings

**Tech Stack**
- **Frontend:** Next.js 14, React, Tailwind CSS, TypeScript
- **Web3 Integration:** Wagmi, Viem, RainbowKit, Mezo Passport (`@mezo-org/passport`)
- **Smart Contracts:** Solidity, Foundry (deployed on Mezo Testnet Chain 31611)
- **Data & Indexing:** Goldsky Subgraph (GraphQL)
- **Communication:** XMTP v7 (Encrypted peer-to-peer messaging)

**Unique value proposition (UVP)**
Unlike traditional Web3 wallets (like MetaMask) that force users to manage gas and hex addresses, or centralized apps (like Venmo) that hold custody of your funds, MezoPay offers the best of both worlds. We deliver a centralized, Web2-quality UX (social feeds, gasless sending, `@usernames`) while remaining completely non-custodial and trustlessly settled on Bitcoin L2 rails.

**Future milestones**
1. **Month 1: Mainnet Deployment & Audit.** Complete a security audit of our `SplitManager` and `SavingsPot` contracts and deploy them to the Mezo Mainnet alongside a production Goldsky indexer.
2. **Month 3: Yield-Bearing Integration.** Integrate natively with Mezo Earn so that MUSD sitting in a user's wallet or locked in a Savings Pot automatically accrues the native network yield.
3. **Month 6: Virtual Debit Card Integration.** Partner with Marqeta or Lithic to issue virtual Mastercard debit cards linked directly to users' MUSD balances, allowing them to tap-to-pay at physical retail stores globally.

**Team Info.**
NIKHIL RAIKWAR - Lead Fullstack & Smart Contract Developer 
[INSERT YOUR TWITTER/LINKEDIN URL HERE]

**Link to testnet staging environment**
https://mezopay.nikhilraikwar.me
