# Blindpot Protocol

> **Confidential, No-Loss Prize Savings on the Zama FHEVM**  
> *Built for Zama Developer Program Mainnet Season 4 — Bounty Track*

Blindpot is a decentralized, no-loss savings protocol built on Ethereum Sepolia using Zama's Fully Homomorphic Encryption Virtual Machine (fhEVM) and ERC-7984 confidential token standard.

Deposit into a shared pool. Your deposit amount, balance, and odds remain encrypted on-chain from the moment they land—never visible to third parties, observers, or protocol operators. At the end of each epoch, the pool's accrued prize pot is awarded to a participant selected via on-chain FHE randomness (`FHE.randEuint32`) weighted by deposit size, computed entirely over encrypted balances. Winner identity and prize claims remain permanently sealed on-chain. You can withdraw 100% of your initial deposited principal at any time with zero fee and zero penalty.

---

## Verified Deployments (Ethereum Sepolia - Chain ID 11155111)

| Contract | Address | Explorer |
| :--- | :--- | :--- |
| **`BlindpotVault`** | `0xe936872f7558fd545bfc072fcf9f321c8d5965c4` | [Etherscan](https://sepolia.etherscan.io/address/0xe936872f7558fd545bfc072fcf9f321c8d5965c4) |
| **`cUSDCMock` (ERC-7984)** | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` | [Etherscan](https://sepolia.etherscan.io/address/0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639) |
| **`Underlying USDC` (ERC-20)** | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` | [Etherscan](https://sepolia.etherscan.io/address/0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF) |

---

## Core Protocol Architecture

```
┌──────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
│ 1. Wrap & Shield (ERC20) │ ───► │ 2. Confidential Deposit  │ ───► │ 3. Autonomous Epoch Draw │
│    Approve & Wrap USDC   │      │    TransferAndCall Hook  │      │    FHE.randEuint32 Draw  │
└──────────────────────────┘      └──────────────────────────┘      └────────────┬─────────────┘
                                                                                 │
┌──────────────────────────┐      ┌──────────────────────────┐                   │
│ 5. Guaranteed Withdrawal │ ◄─── │ 4. Blinded Claim         │ ◄─────────────────┘
│    100% Principal Return │      │    FHE.select Transfer   │
└──────────────────────────┘      └──────────────────────────┘
```

### 1. Confidential Deposit (`BlindpotVault.sol`)
Users wrap test USDC into confidential ERC-7984 `cUSDC` and call `confidentialTransferAndCall(vault, amount, "")`. The vault's `onConfidentialTransferReceived` callback registers the user and transfers encrypted tickets to `BlindDraw.sol` with zero plaintext leakage on block explorers.

### 2. Proportional Fixed-Point Selection (`BlindDraw.sol`)
Winner selection draws uniform 32-bit random entropy $R \leftarrow \text{FHE.randEuint32()}$ and scales it proportionally across the encrypted total tickets using fixed-point fractional multiplication:
$$\text{drawnTicket} = \left\lfloor \frac{R \cdot \text{totalTickets}}{2^{32}} \right\rfloor$$
Because the divisor $2^{32}$ is a plaintext constant, `FHE.div` executes natively in FHEVM. This eliminates the power-of-2 modulo gap, modulo bias, and rollover rounds entirely.

### 3. Sealed Winner Identity & Blinded Claims
* **Sealed Identity**: `drawWinner()` stores the winner as an encrypted handle `eaddress winnerHandle`. The `DrawExecuted` event emits only `(drawId, timestamp, roundPot)`. Winner identity is never decrypted on-chain.
* **Blinded Claims**: `claimWinnings(drawId)` computes `safeAmountToPay = FHE.select(canClaim, amountToPay, 0)` and transfers funds confidentially. Third-party observers watching the transaction cannot distinguish between a winning claim and a non-winning claim.

### 4. Autonomous Time-Locked Epochs & Keeper
Draws are governed by permissionless time-locked epochs (`drawInterval = 600s`, `nextDrawTime`). A dedicated background daemon (`scripts/keeper.mjs`) automatically triggers `drawWinner()` as soon as an epoch matures.

### 5. Gasless EIP-712 User Decryption
Individual depositors decrypt their private balance and round win status off-chain through gasless EIP-712 KMS permits without spending gas or revealing values on-chain.

---

## Capacity Limits & HCU Benchmarking

The Zama FHEVM coprocessor enforces two distinct per-transaction compute caps:
1. `maxHCUPerTx` = **20,000,000 HCU** (Total compute volume cap).
2. `maxHCUDepthPerTx` = **5,000,000 HCU** (Longest sequential dependency chain cap).

Because `BlindDraw.sol` computes prefix sums iteratively over active member balances (`currentCumulative = FHE.add(currentCumulative, m.balance)`), each iteration $i$ is sequentially dependent on iteration $i-1$. Thus, the **sequential depth cap (`maxHCUDepthPerTx` = 5,000,000 HCU)** is the binding constraint that governs pool capacity.

| Active Members ($N$) | Gas Estimate | Sequential FHE Ops | Total HCU Volume | Sequential HCU Depth | Limit Status & Methodology |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **$N = 10$** | ~2,100,000 | 60 ops | ~1.2M HCU | ~900k HCU | **PASS** — Measured (Foundry / Sepolia) |
| **$N = 25$** | ~4,200,000 | 190 ops | ~3.8M HCU | ~2.8M HCU | **PASS** — Measured (Optimal Protocol Cap) |
| **$N = 50$** | > 8,500,000 | 400 ops | ~8.2M HCU | > 5.5M HCU | **REVERTS** — Extrapolated (`HCUTransactionDepthLimitExceeded`) |

*Reproducible benchmark test suite committed at [`contracts/test/HCUBenchmark.t.sol`](contracts/test/HCUBenchmark.t.sol) and [`scripts/benchmark.mjs`](scripts/benchmark.mjs).*

---

## Confidentiality & Trust Model

* **Stays Encrypted Always**: Individual deposit amounts, pool shares, losing balances, winner wallet addresses, and claim transfer amounts.
* **Necessarily Public**: Draw epoch timestamps (`nextDrawTime`), Draw ID counter (`currentDrawId`), round prize schedule (`roundPot`), and active depositor count integer (`memberCount`).
* **Threshold MPC Trust Assumption**: Winner selection, blinded prize claiming, and private balance decryption depend on Zama's distributed Key Management System (KMS) and coprocessor infrastructure. Zama's KMS operates via a **Threshold Multi-Party Computation (MPC) network** ($t$-of-$n$ scheme) where no single operator or relayer holds the global decryption key. Protocol correctness and confidentiality rest on the cryptographic assumption that a dishonest coalition does not reach the threshold $t$ of independent KMS validator nodes, and that coprocessor nodes execute deterministic FHEVM bytecode faithfully.

---

## Quickstart & Local Development

### Prerequisites
* Node.js >= 20.18.0
* Metamask or compatible web3 wallet connected to **Ethereum Sepolia** (Chain ID `11155111`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Next.js Frontend
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the dApp:
* `/faucet`: 1-click testnet USDC minting.
* `/deposit`: 2-stage approval, wrap, and confidential deposit.
* `/dashboard`: Real-time epoch countdown, 1-click EIP-712 balance & win decryption, and instant prize claiming.
* `/withdraw`: 100% principal withdrawal with zero fees.
* `/history`: Sealed historical draw logs and audit explorer.

### 3. Run the Autonomous Keeper Daemon
```bash
node scripts/keeper.mjs
```

### 4. Run HCU & Gas Benchmarks
```bash
node scripts/benchmark.mjs
```

### 5. Compile Smart Contracts
```bash
node compile.mjs
```

---

## Repository Structure

```
blindpot/
├── contracts/
│   ├── src/
│   │   ├── BlindDraw.sol         # Reusable confidential weighted random selection primitive
│   │   └── vaults/
│   │       └── BlindpotVault.sol # ERC-7984 receiver, deposit accounting, time-locked epochs
│   └── test/
│       └── HCUBenchmark.t.sol    # Reproducible Foundry HCU & gas benchmark suite
├── sdk/src/                      # TypeScript SDK wrappers (@zama-fhe/react-sdk + Viem)
│   ├── deposit.ts                # useDeposit hook (shield + confidentialTransferAndCall)
│   ├── getMyBalance.ts           # useGetMyBalance hook (EIP-712 balance decryption)
│   ├── getMyWinnings.ts          # useGetMyWinnings hook (EIP-712 prize decryption)
│   ├── claim.ts                  # useClaim hook (blinded prize claim)
│   ├── withdraw.ts               # useWithdraw hook (principal withdrawal)
│   └── config.ts                 # Deployed Sepolia contract addresses
├── scripts/
│   ├── keeper.mjs                # Autonomous background epoch execution daemon
│   └── benchmark.mjs             # Reproducible gas & HCU report script
├── app/                          # Next.js 16 print-brutalist frontend
│   ├── dashboard/                # In-place EIP-712 balance & win outcome dashboard
│   ├── deposit/                  # 2-stage shield/wrap & deposit UI
│   ├── withdraw/                 # Guaranteed no-loss principal exit UI
│   ├── faucet/                   # Interactive 1-click testnet token faucet
│   └── history/                  # Sealed draw history explorer
├── ARCHITECTURE.md               # Technical layering, scaling formulas, and roadmap
├── CONFIDENTIALITY.md            # What stays encrypted, what leaks, and threshold MPC model
├── SECURITY.md                   # Security audit scope, FHE risks, and trust assumptions
├── AUDIT.md                      # Self-audit checklist and verification trail
├── LOGS.md                       # Feature checklist and session change logs
└── SPEC.md                       # Hackathon judging requirements
```

---

## License

MIT License. Open source and free for the Zama and Ethereum developer community.
