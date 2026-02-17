# 😊 SmilePool — VS Code Copilot Build Instructions
### Bitcoin-Powered AI Smile-to-Earn dApp | Midl VibeHack Submission

---

## 🧠 What You're Building

**SmilePool** is a Bitcoin-native crowdfunded reward dApp where:

1. **Anyone donates** Bitcoin Runes to fill a public reward pool (via a Solidity smart contract on Midl)
2. **Users upload a selfie** → AI (Gemini Vision) scores their smile 0–100
3. **If score ≥ 75**, the user can **claim a small reward** from the pool
4. The claim triggers a real on-chain transaction via the Midl SDK + Xverse wallet
5. The UI updates live: transaction hash, pool balance, leaderboard of top smilers

**Why it wins:**
- Combines AI + Bitcoin DeFi + crowdfunding in a genuinely novel way
- Visual and fun to demo (selfie camera → animated score → wallet popup → tx confirmed)
- Solidity contract logic is simple but real
- Hits every judging criterion: frontend design, Xverse wallet, Midl SDK, on-chain proof, UI state update

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  Camera/Upload → Gemini AI → Score → Claim Button   │
│  Donate Button → Pool Balance → TX Hash Display      │
└──────────────┬──────────────┬───────────────────────┘
               │              │
               ▼              ▼
      ┌─────────────┐  ┌─────────────────────────────┐
      │ Gemini API  │  │   Midl SDK (@midl/executor-  │
      │ (Vision AI) │  │   react + @midl/satoshi-kit) │
      └─────────────┘  └──────────────┬──────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │  Xverse Wallet (Bitcoin)     │
                        │  Signs BTC transaction       │
                        └──────────────┬──────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │  Midl Regtest Network        │
                        │  (EVM on Bitcoin)            │
                        │  SmilePool.sol contract      │
                        └─────────────────────────────┘
```

---

## 🔗 Real URLs — Verified, Do Not Modify

### Midl Network (Regtest / Staging)
| Resource | URL |
|---|---|
| **EVM RPC endpoint** | `https://evm-rpc.regtest.midl.xyz` |
| **Chain ID** | `777` |
| **Block Explorer (EVM)** | `https://blockscout.staging.midl.xyz` |
| **Bitcoin Block Explorer** | `https://mempool.staging.midl.xyz` |
| **tBTC Faucet** | `https://faucet.regtest.midl.xyz` |
| **Rune Minter** | `https://runes.midl.xyz` |
| **Devnet Portal** | `https://devnet.midl.xyz` |

### Documentation
| Resource | URL |
|---|---|
| **Midl JS SDK docs (current)** | `https://js.midl.xyz` |
| **Midl JS SDK docs (v2)** | `https://v2.js.midl.xyz/docs` |
| **SDK GitHub repo** | `https://github.com/midl-xyz/midl-js` |
| **Official dApp demo** | `https://github.com/midl-xyz/dapp-demo` |
| **Live demo (reference)** | `https://dapp-demo-dapp.vercel.app` |
| **Hardhat deploy plugin** | `@midl-xyz/hardhat-deploy` on npm |
| **Hackathon brief** | `https://midl.xyz/blog/Midl-VibeHack-BTC` |

### AI
| Resource | URL |
|---|---|
| **Gemini API docs** | `https://ai.google.dev/gemini-api/docs/image-understanding` |
| **Gemini API key** | Get from `https://aistudio.google.com/apikey` |
| **JS SDK** | `@google/genai` on npm |

---

## 📦 Tech Stack

### Frontend
- **React + Vite** — fast dev server, no config overhead
- **TypeScript** — type safety, Copilot autocomplete works better
- **TailwindCSS** — styling (no default AI slop — use custom dark Bitcoin orange/black theme)
- **Framer Motion** — animate the smile score meter
- **viem** — Ethereum-compatible reads from the Midl EVM chain

### Midl / Bitcoin
- **`@midl/satoshi-kit`** — wallet connection UI (handles Xverse)
- **`@midl/executor-react`** — React hooks for signing and sending Bitcoin transactions that execute Solidity contracts
- **`@midl-xyz/hardhat-deploy`** — deploying the Solidity contract to Midl regtest

- use frontend-skill.md for the UI design and implementation guidelines to create a polished, distinctive frontend that avoids generic AI aesthetics.

### Contracts
- **Hardhat** — Solidity toolchain
- **Solidity ^0.8.20** — SmilePool.sol

### AI
- **`@google/genai`** — official Google Gemini SDK
- **Model**: `gemini-2.0-flash` — fast, multimodal, supports base64 image input, free tier available

### Backend (minimal)
- **Node.js + Express** (tiny, ~20 lines) — only needed to proxy Gemini API calls to keep your API key off the client. Deploy free on Railway or Render.
- Alternative: call Gemini directly from the frontend if you're okay exposing the key during the hackathon demo (acceptable for PoC)

---

## 🗂️ Project Structure

Clone the official dApp demo as your starting point:
```
git clone https://github.com/midl-xyz/dapp-demo smilepool
cd smilepool
```

Rename/restructure to:
```
smilepool/
├── packages/
│   └── contracts/         ← Solidity SmilePool.sol lives here
│       ├── contracts/
│       │   └── SmilePool.sol
│       ├── hardhat.config.ts
│       ├── deploy/
│       │   └── 00_deploy_smilepool.ts
│       └── package.json
└── apps/
    └── dapp/              ← React frontend lives here
        ├── src/
        │   ├── main.tsx
        │   ├── App.tsx
        │   ├── config.ts          ← Midl network + SDK config
        │   ├── components/
        │   │   ├── WalletConnect.tsx
        │   │   ├── PoolStats.tsx
        │   │   ├── SmileCamera.tsx
        │   │   ├── ScoreMeter.tsx
        │   │   ├── ClaimButton.tsx
        │   │   └── DonatePanel.tsx
        │   ├── hooks/
        │   │   ├── useSmileScore.ts    ← Gemini API call
        │   │   ├── usePoolBalance.ts   ← Read contract state
        │   │   └── useSmilePool.ts     ← Write contract (claim/donate)
        │   └── lib/
        │       └── gemini.ts           ← Gemini vision client
        ├── .env.local
        └── package.json
```

---

## ⛓️ Smart Contract: SmilePool.sol

### What it does
- `donate(uint256 amount)` — anyone sends Runes (ERC20) to fill the pool
- `claimReward(uint256 smileScore)` — if score ≥ 75, send fixed reward to caller
- `getPoolBalance()` — view function, read current pool size
- `getRewardAmount()` — view function, fixed reward per successful smile
- Owner can set threshold and reward amount

### Key design decisions for the hackathon
- **Runes as ERC20**: On Midl, Bitcoin Runes are represented as ERC20 tokens. The demo repo (`dapp-demo`) already shows this pattern with a Vault contract — your SmilePool does the same thing but with different logic.
- **Score passed from frontend**: For the PoC, the frontend passes the score as a parameter to `claimReward`. In production this would use an oracle or zkML — acknowledge this in your README.
- **One claim per address per day**: Add a simple mapping to prevent spam: `mapping(address => uint256) public lastClaim;`
- **Require pool has funds**: Contract should revert if pool balance < rewardAmount

### Contract reference to copy from
The official demo has a Vault contract at `packages/contracts/contracts/Vault.sol` in the dapp-demo repo. Use that as your reference for:
- How Rune ERC20 tokens are imported and used
- How `approve` + `transferFrom` flows work on Midl
- How the contract is structured with Hardhat

---

## 🔧 Contract Deployment

### Hardhat Config
The real Midl regtest config (confirmed from npm package docs):
```
Network name: default (or "midl-regtest")  
RPC URL: https://evm-rpc.regtest.midl.xyz  
Chain ID: 777
```

### Deploy plugin
Use `@midl-xyz/hardhat-deploy` — this is Midl's custom Hardhat plugin that handles the Bitcoin-side of deployment (signs with your BTC wallet mnemonic, not an ETH private key).

In your `hardhat.config.ts`:
```
import "@midl-xyz/hardhat-deploy"
```

Configure it with:
- `midl.mnemonic`: your Bitcoin wallet seed phrase (store in `.env`, never commit)
- `midl.path`: where deployment JSONs are saved
- `networks.default.url`: `https://evm-rpc.regtest.midl.xyz`
- `networks.default.chainId`: `777`

Deploy script pattern (from official plugin docs):
```
hre.midl.initialize()
hre.midl.deploy("SmilePool", { from: deployer, args: [...] })
hre.midl.execute()
```

### Pre-deployment checklist
1. Install Xverse wallet (Chrome extension) — `https://www.xverse.app`
2. Get tBTC from faucet: `https://faucet.regtest.midl.xyz`
3. Mint test Runes at: `https://runes.midl.xyz`
4. Save your contract address after deploy — you'll need it in the frontend

---

## 🖥️ Frontend Implementation Guide

### Step 1: Midl SDK Setup (config.ts)

Read the SatoshiKit docs at `https://js.midl.xyz` — it is the wallet connection layer that wraps Xverse.

The SDK packages you need:
- `@midl/satoshi-kit` — provides the `SatoshiKitProvider` and wallet connect UI
- `@midl/executor-react` — provides React hooks for sending transactions

Wrap your entire app in `SatoshiKitProvider` configured with the Midl regtest network. The config needs:
- The Bitcoin network: `regtest`
- The EVM RPC: `https://evm-rpc.regtest.midl.xyz`
- Chain ID: `777`

### Step 2: Wallet Connection (WalletConnect.tsx)

Use the components/hooks from `@midl/satoshi-kit`. Check the SatoshiKit section at `https://js.midl.xyz/satoshi-kit` for the exact component API.

The wallet connect button should:
- Show "Connect Xverse" when disconnected
- Show truncated BTC address when connected
- Show tBTC balance

### Step 3: Gemini Smile Scoring (lib/gemini.ts + hooks/useSmileScore.ts)

**Gemini Vision API call flow:**
1. User captures selfie (use browser `getUserMedia` API or file input)
2. Convert image to base64 string
3. Call Gemini API with `gemini-2.0-flash` model
4. Pass base64 image as `inlineData` with `mimeType: "image/jpeg"`
5. Prompt: ask for a JSON response with a smile score 0–100 and a short description
6. Parse the JSON from response text

**Prompt engineering tip**: Tell Gemini to respond ONLY with JSON like:
```
{ "score": 82, "message": "Big genuine smile detected!", "hasFace": true }
```
This makes parsing reliable. Handle the case where `hasFace` is false (no selfie detected).

**API endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

**JS SDK**: Import from `@google/genai`. Use `GoogleGenAI` class, call `models.generateContent()`.

**Image format for Gemini**: Pass as `inlineData: { mimeType: "image/jpeg", data: base64String }` inside the `contents` array alongside your text prompt.

**Key env var**: `VITE_GEMINI_API_KEY` — for hackathon PoC it's fine to use client-side. For production, proxy through a backend.

### Step 4: Pool Balance (hooks/usePoolBalance.ts)

Use `viem`'s `useReadContract` (or wagmi's equivalent) to read `getPoolBalance()` and `getRewardAmount()` from your deployed SmilePool contract.

You need:
- The contract ABI (export it from the Hardhat compile artifacts)
- The deployed contract address
- The EVM RPC: `https://evm-rpc.regtest.midl.xyz`

Poll every 10 seconds or on transaction confirmation to keep the balance fresh.

### Step 5: Claiming Reward (hooks/useSmilePool.ts)

This is where Midl's unique flow comes in. Unlike regular EVM, on Midl the transaction goes:

```
Frontend calls Midl SDK → SDK creates a Bitcoin TX intention → 
Xverse wallet pops up to sign the BTC tx → 
Midl network executes the Solidity function → 
Result confirmed on Bitcoin blockchain
```

Use `useAddTxIntention` from `@midl/executor-react` to add a transaction intention. Then use `useFinalizeBTCTransaction` to submit it.

The flow:
1. User clicks "Claim Reward" (after scoring ≥ 75)
2. Call `useAddTxIntention` with the `claimReward(score)` contract call data
3. Call `useSignIntentions` or `useFinalizeBTCTransaction` to trigger the Xverse popup
4. User signs in Xverse → transaction broadcasts
5. Poll `blockscout.staging.midl.xyz` for the tx receipt
6. Show tx hash with a link to the block explorer

**Reference**: Study `apps/dapp/src` in the official dapp-demo for the exact hook usage pattern. The Vault's deposit and withdraw functions use this exact flow.

### Step 6: Donating to Pool (DonatePanel.tsx)

Same flow as claiming, but calls `donate(amount)` on the contract. User needs to:
1. First call `approve` on the Rune ERC20 contract to allow SmilePool to spend their tokens
2. Then call `donate(amount)` 

The dapp-demo shows this approve + deposit pattern for the Vault — replicate it.

---

## 🎨 UI Design (Beat the "AI Slop" Requirement)

The hackathon explicitly penalizes default AI-generated UI. Your design must feel like a real product.

### Theme
- **Color palette**: Black (#0A0A0A) background, Bitcoin orange (#F7931A) accents, white text
- **Font**: Inter or Space Grotesk (import from Google Fonts)
- **Vibe**: Dark, premium, Bitcoin-native — think Uniswap meets Coinbase meets fun

### Key UI components to build
1. **Hero section**: App name "SmilePool", tagline, animated pool counter in BTC/Runes
2. **Pool Stats bar**: Total pool, reward per smile, smiles scored today
3. **Smile Camera widget**: Camera feed or upload box → snap selfie → animated loading → score reveal
4. **Score Meter**: Animated circular progress (0–100), color shifts red→yellow→green
5. **Claim card**: Appears when score ≥ 75, shows reward amount, "Claim Now" button with Xverse logo
6. **Donate panel**: Input amount, "Fund the Pool" button
7. **Leaderboard**: Show last 5 successful claimers (read from contract events)
8. **TX confirmation**: Toast notification with clickable tx hash linking to blockscout

### Animation ideas (use Framer Motion)
- Score meter animates from 0 to final score with a satisfying fill
- Confetti burst when score ≥ 75 (use `canvas-confetti` library)
- Pool balance ticks up when a donation lands

---

## 🔐 Environment Variables

Create `apps/dapp/.env.local`:
```
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_CONTRACT_ADDRESS=your_deployed_smilepool_address
VITE_MIDL_RPC=https://evm-rpc.regtest.midl.xyz
VITE_CHAIN_ID=777
```

Create `packages/contracts/.env`:
```
MNEMONIC=your twelve word bitcoin wallet seed phrase here
```

**NEVER commit `.env` files. Add them to `.gitignore` immediately.**

---

## 🪜 Step-by-Step Build Order

### Day 1 — Contract + Deploy (~4 hours)
1. Clone dapp-demo repo
2. Install dependencies with `pnpm install`
3. Read the contracts README in `packages/contracts/`
4. Write `SmilePool.sol` (model it after `Vault.sol` from the demo)
5. Write deploy script using `@midl-xyz/hardhat-deploy`
6. Get tBTC from faucet, mint Runes at runes.midl.xyz
7. Deploy to regtest, save contract address
8. Verify on `blockscout.staging.midl.xyz`

### Day 2 — Frontend Core (~6 hours)
1. Set up React + Vite + TypeScript + Tailwind in `apps/dapp/`
2. Configure Midl SDK providers in `main.tsx` and `config.ts`
3. Build wallet connect component using `@midl/satoshi-kit`
4. Build Gemini vision hook — test scoring with a real selfie
5. Build pool balance reader with viem
6. Wire up claim flow with Midl transaction hooks

### Day 3 — Polish + Full Loop Test (~4 hours)
1. Build the full UI with proper design (score meter, animations, leaderboard)
2. Test the complete user journey end-to-end on regtest
3. Verify tx appears on both `blockscout.staging.midl.xyz` and `mempool.staging.midl.xyz`
4. Record demo video showing the full loop

---

## 🧪 Testing the Full Loop

Your demo video must show this sequence:
1. App loads — pool balance visible
2. Connect Xverse wallet — address appears
3. Camera opens, take selfie
4. Gemini scores the smile (show the score animating)
5. Score ≥ 75 — "Claim Reward" button appears
6. Click claim — Xverse popup appears — user signs
7. TX broadcasts — hash displayed on screen
8. Link opens to `blockscout.staging.midl.xyz/tx/0x...` — confirmed
9. Pool balance decreases by reward amount

For donation, also show:
1. Enter Rune amount in donate panel
2. Click donate — Xverse popup — sign
3. Pool balance increases

---

## ⚠️ Known Gotchas

### Midl-specific
- Transactions on Midl go through Bitcoin first. There's a 2-step process: create the BTC tx, then finalize. The `useFinalizeBTCTransaction` hook handles this. Check the dapp-demo source code to see the pattern.
- Runes on Midl must be "added" to the ecosystem first — they need to be registered. Use the `useAddRuneERC20Intention` hook (from `@midl/executor-react`) or do it via the UI at `runes.midl.xyz`.
- The ERC20 `approve` call must happen before `donate()`. Show this in your UI.

### Gemini API
- The model is `gemini-2.0-flash` — NOT `gemini-pro-vision` (that's older/deprecated)
- Response is text, not JSON by default. Prompt explicitly for JSON-only output.
- Always handle the case where no face is detected — show a friendly error message
- Camera selfies come as blob/dataURL — convert to base64 before sending to Gemini

### Frontend
- Use `pnpm` not `npm` — the monorepo uses pnpm workspaces
- Vite needs `VITE_` prefix on all env vars to expose them to the client
- The contract ABI JSON lives in `packages/contracts/deployments/` after running deploy

---

## 📹 Submission Requirements (Don't Forget)

From the hackathon rules at `https://midl.xyz/blog/Midl-VibeHack-BTC`:

1. **Video demo** — full loop: wallet connect → selfie → score → claim → tx confirmed
2. **Transaction proof** — links to your deployed contract AND at least one successful tx on `blockscout.staging.midl.xyz`
3. **Code repo** — public GitHub repo with a clear README
4. **Public X post** — share your submission on X (Twitter), tag @midl_xyz
5. **Submit** via the Notion form linked in the blog post

**Deadline: February 23rd, 00:00 UTC**

---

## 💡 Copilot Prompting Tips

When using VS Code Copilot for this project:

- **For the contract**: Say "Write a Solidity 0.8.20 contract called SmilePool that accepts ERC20 token donations and releases a fixed reward when claimReward is called with a score >= 75, using OpenZeppelin's IERC20"
- **For Gemini hook**: Say "Write a React hook that accepts a base64 jpeg string, calls the Gemini 2.0 Flash API with inlineData, and returns a parsed JSON smile score between 0 and 100"
- **For the score meter**: Say "Write a React component with a circular SVG progress bar that animates from 0 to a given value using Framer Motion, with color interpolation from red to green"
- **For Midl tx**: Reference the Vault.tsx and deposit/withdraw code from the dapp-demo repo — paste those patterns into Copilot context

---

## 🔍 Key Docs to Have Open While Building

1. `https://js.midl.xyz` — SDK overview and hook list
2. `https://v2.js.midl.xyz/docs` — v2 docs with hook details
3. `https://github.com/midl-xyz/dapp-demo` — reference implementation (your base)
4. `https://blockscout.staging.midl.xyz` — check your deployments and txs
5. `https://ai.google.dev/gemini-api/docs/image-understanding` — Gemini vision API
6. `https://ai.google.dev/gemini-api/docs/models` — confirm model names (use `gemini-2.0-flash`)

---

## 🏁 Quick Wins for Judge Points

- **Show the pool balance live** — use polling, makes the demo feel alive
- **Leaderboard of recent smilers** — reads from contract events, shows community
- **Mobile-friendly camera** — judges will try on their phones
- **Clear "This is a PoC" note in README** — acknowledge score is passed from client, production would use oracle
- **Orange Bitcoin color everywhere** — signal you understand the Bitcoin ecosystem

---

*Good luck. Build fast. Smile big. 😁*