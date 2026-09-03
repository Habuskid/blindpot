# Blindpot

<p align="center">
  <img src="public/logo.png" alt="Blindpot Logo" width="120" />
</p>

<p align="center">
  <strong>Confidential, No-Loss Prize Savings on the Zama Protocol (fhEVM).</strong><br />
  <em>Built for the Zama Developer Program — Mainnet Season 4, Bounty Track.</em>
</p>

<p align="center">
  <a href="https://soliditylang.org/"><img src="https://img.shields.io/badge/Solidity-0.8.27-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" /></a>
  <a href="https://www.zama.ai/"><img src="https://img.shields.io/badge/Zama-fhEVM-F4D03F?style=for-the-badge&logoColor=black" alt="Zama fhEVM" /></a>
  <a href="https://ethereum.org/"><img src="https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" alt="Ethereum Sepolia" /></a>
  <a href="https://morpho.org/"><img src="https://img.shields.io/badge/Yield-Morpho_Blue-2468f2?style=for-the-badge&logoColor=white" alt="Morpho Blue" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://book.getfoundry.sh/"><img src="https://img.shields.io/badge/Foundry-5%2F5_Passing-success?style=for-the-badge&logo=forge" alt="Foundry: Passing" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License: MIT" /></a>
</p>

---

## Table of Contents

- [The Problem with Public Prize Savings](#the-problem-with-public-prize-savings)
- [The Blindpot Solution](#the-blindpot-solution)
- [Live Deployments & Verified Contracts](#live-deployments--verified-contracts)
- [Architecture & End-to-End Lifecycle](#architecture--end-to-end-lifecycle)
- [Protocol Revenue Model & Sustainable Economics](#protocol-revenue-model--sustainable-economics)
- [How the Confidential Draw Works](#how-the-confidential-draw-works)
  - [1. Proportional Fixed-Point Scaling (Zero Modulo Gap)](#1-proportional-fixed-point-scaling-zero-modulo-gap)
  - [2. Sealed Winner Identity & Blinded Claims](#2-sealed-winner-identity--blinded-claims)
  - [3. Coprocessor Depth Benchmarking (N=25 Cap)](#3-coprocessor-depth-benchmarking-n25-cap)
- [Yield Engine: Real Morpho Blue Integration](#yield-engine-real-morpho-blue-integration)
- [Confidentiality Matrix: What Stays Encrypted vs. Public](#confidentiality-matrix-what-stays-encrypted-vs-public)
- [Quickstart & Local Development](#quickstart--local-development)
  - [1. Installation & Environment](#1-installation--environment)
  - [2. Run Foundry Smart Contract Tests](#2-run-foundry-smart-contract-tests)
  - [3. Run the Next.js Frontend](#3-run-the-nextjs-frontend)
  - [4. Run the Autonomous Keeper Daemon](#4-run-the-autonomous-keeper-daemon)
  - [5. Run HCU & Gas Benchmarks](#5-run-hcu--gas-benchmarks)
- [Protocol Walkthrough (User Journey)](#protocol-walkthrough-user-journey)
- [Roadmap](#roadmap)
- [Security & Trust Model](#security--trust-model)
- [License](#license)

---

## The Problem with Public Prize Savings

Prize-linked savings (pooling user deposits, generating yield through low-risk lending, awarding the collective interest to randomly chosen savers, and returning 100% of everyone's principal) is a multi-billion-dollar incentive model. National programs like the UK Premium Bonds (£120B+ deposited) and DeFi pioneers like PoolTogether prove that probabilistic upside encourages saving without risking capital.

However, transparent on-chain implementations introduce **fatal privacy and game-theoretic flaws**:
1. **Total Balance Doxxing**: Every saver's wallet balance, net worth, and deposit timing are exposed in plaintext on Etherscan.
2. **Whale Intimidation**: Retail savers with $100 see institutional whales depositing $5,000,000 in plaintext. Retail users realize their mathematical odds are negligible and abandon the pool.
3. **Winner Phishing & Exploits**: When a user wins, their Ethereum address is broadcast in plaintext on Etherscan and Twitter bots, immediately painting a target on their back for drainers, dust attacks, and social engineering.

---

## The Blindpot Solution

Blindpot rebuilds prize savings from first principles using Zama's Fully Homomorphic Encryption Virtual Machine (fhEVM) and OpenZeppelin's ERC-7984 confidential token standard:

* **100% On-Chain Ciphertext Accounting**: User deposits, balances, and tickets are stored as encrypted `euint64` handles. No observer, validator, or front-running bot can inspect participant balances.
* **Native On-Chain FHE Randomness**: Winner selection uses `FHE.randEuint32` from Zama's decentralized Threshold KMS network—no off-chain Chainlink VRF or pseudo-random fallbacks.
* **Sealed Winner & Blinded Claims**: The winner is selected as an encrypted `eaddress`. Claims execute via `FHE.select(winner, pot, 0)` confidential transfers. Third-party observers cannot determine whether a claiming transaction won 50 USDC or 0 USDC.
* **Guaranteed No-Loss Principal**: Savers can withdraw 100% of their deposited principal at any time with zero lockup periods, zero penalties, and zero exit fees.

---

## Live Deployments & Verified Contracts

The protocol is fully deployed and verified on **Ethereum Sepolia Testnet (Chain ID `11155111`)**:

| Contract / Asset | Network | Verified Address on Etherscan | Description |
| :--- | :--- | :--- | :--- |
| **Live dApp** | Web | [`https://blindpot.vercel.app`](https://blindpot.vercel.app) | Production Next.js 16 reference application |
| **`BlindpotVault`** | Sepolia | [`0x489f37147c8ba2554c14e385d8e5603f143635fd`](https://sepolia.etherscan.io/address/0x489f37147c8ba2554c14e385d8e5603f143635fd#events) | Core vault: deposits, epochs, yield routing, blinded claims |
| **`BlindDraw`** | Sepolia | [`0x948B80D21650e41f71f652A6d4484E8c9735d46B`](https://sepolia.etherscan.io/address/0x948B80D21650e41f71f652A6d4484E8c9735d46B) | Modular confidential weighted selection primitive |
| **`cUSDCMock` (ERC-7984)** | Sepolia | [`0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639`](https://sepolia.etherscan.io/address/0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639) | Zama official confidential wrapper token |
| **`Underlying USDC` (ERC-20)**| Sepolia | [`0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF`](https://sepolia.etherscan.io/address/0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF) | Zama mintable test ERC-20 (available via in-app `/faucet`) |
| **`Morpho Blue Singleton`** | Sepolia | [`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`](https://sepolia.etherscan.io/address/0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb) | Canonical Morpho Blue lending protocol contract |

---

## Architecture & End-to-End Lifecycle

```mermaid
flowchart TD
    subgraph Client ["Client & Connected Wallet"]
        A["Depositor (MetaMask / EIP-1193)"]
        KMS_CLI["Zama Relayer SDK (EIP-712 Signer)"]
    end

    subgraph TokenLayer ["Confidential Token Infrastructure"]
        MINT["Underlying USDC (0x9b5C...DfFf)"]
        WRAP["cUSDCMock ERC-7984 (0x7c5B...3639)"]
    end

    subgraph VaultCore ["Blindpot Protocol Core (Sepolia)"]
        VAULT["BlindpotVault.sol (0x489f...35fd)"]
        DRAW["BlindDraw.sol (0x948B...d46B)"]
        ADAPTER["ERC4626YieldAdapter.sol"]
    end

    subgraph ExternalDeFi ["DeFi Lending Infrastructure"]
        MORPHO["Morpho Blue Market (0xBBBB...FFCb)"]
    end

    subgraph ProtocolEconomics ["Sustainable Economic Split"]
        TREASURY["Blindpot DAO Treasury (10% Take Rate)"]
        POT["Dynamic Winner Prize Pot (90% + Floor)"]
    end

    subgraph Automation ["Decentralized Automation & KMS"]
        KEEPER["Autonomous Keeper Daemon (scripts/keeper.mjs)"]
        KMS["Zama Threshold KMS Coprocessor"]
    end

    A -->|"1. Mint 1,000 Test Tokens"| MINT
    MINT -->|"2. Confidential Wrap"| WRAP
    WRAP -->|"3. Confidential Deposit (euint64)"| VAULT
    VAULT -->|"4. Deploy Pooled Principal"| ADAPTER
    ADAPTER -->|"5. Continuous Lending"| MORPHO
    MORPHO -->|"6. Accrued Yield Harvested"| ADAPTER
    ADAPTER -->|"7. Gross Yield"| VAULT

    VAULT -->|"8a. 10% Protocol Cut"| TREASURY
    VAULT -->|"8b. 90% Yield + Floor Subsidy"| POT

    KEEPER -->|"9. Trigger drawWinner() on Epoch Expiry"| VAULT
    VAULT -->|"10. Confidential Selection"| DRAW
    KMS -->|"11. FHE.randEuint32() Entropy"| DRAW
    DRAW -->|"12. Output Sealed Winner (eaddress)"| VAULT

    A -->|"13. Blinded Claim (FHE.select transfer)"| VAULT
    VAULT -->|"14. Encrypted Prize Delivery"| WRAP

    A -->|"15. Decrypt Winning Dossier (EIP-712)"| KMS_CLI
    KMS_CLI <-->|"16. Decrypt Personal Handle Only"| KMS

    A -->|"17. 100% Principal Exit Anytime"| VAULT
    VAULT -->|"18. Unwrap to Public USDC"| MINT
```

---

## Protocol Revenue Model & Sustainable Economics

Unlike generic hackathon mocks that operate as unsustainable faucets, Blindpot implements a **commercial, self-sustaining DeFi business model**:

```
Gross Harvested Lending Yield (Morpho Blue continuous APY @ ~3.99%)
  ├── 10% ──► Blindpot DAO Treasury (Protocol Revenue & Keeper Gas Rebate)
  └── 90% ──► Winner Prize Allocation (Combined with Guaranteed Floor Subsidy)
```

1. **Continuous Protocol Revenue (10% Take Rate)**: On every epoch harvest, the protocol captures 10% of gross lending interest into the DAO treasury. This finances continuous protocol development and infrastructure.
2. **Autonomous Keeper Gas Rebate**: A portion of protocol revenue reimburses the keeper daemon (`scripts/keeper.mjs`), ensuring automated draws run perpetually on Sepolia without owner subsidization.
3. **Dynamic Yield-Derived Prize Pots**: Savers do not compete for a flat, predictable reward. Pots scale dynamically based on total deposits, Morpho lending interest, and round variance (e.g. 54.80 USDC, 76.50 USDC, 92.40 USDC).
4. **Guaranteed Floor Reserve (`baseRoundPrize`)**: To solve the cold-start problem during low-TVL testnet testing, the protocol seeds an initial reserve so early savers always compete for a meaningful minimum prize floor.

---

## How the Confidential Draw Works

### 1. Proportional Fixed-Point Scaling (Zero Modulo Gap)

In standard Solidity, lotteries compute `rand % totalTickets`. However, in FHEVM, `FHE.rem` strictly requires a plaintext divisor, whereas `totalTickets` remains encrypted to preserve balance privacy.

Blindpot solves this with **Proportional Fixed-Point Scaling**:

$$\text{drawnTicket} = \left\lfloor \frac{R \cdot \text{totalTickets}}{2^{32}} \right\rfloor \quad \text{where } R \leftarrow \text{FHE.randEuint32()}$$

* $R$ is uniformly sampled across $[0, 2^{32})$.
* The divisor $2^{32}$ is a plaintext constant, enabling native homomorphic division (`FHE.div`).
* **Zero Modulo Gap**: The result lands continuously within $[0, \text{totalTickets}-1]$ with zero modulo bias, zero rollover invalidity, and zero rejection sampling.

### 2. Sealed Winner Identity & Blinded Claims

* **Zero On-Chain Winner Doxxing**: Winner selection computes encrypted prefix sums over active member balances, returning `eaddress winnerHandle`. The `DrawExecuted` event emits only aggregate metadata (`drawId`, `timestamp`, `roundPot`).
* **Blinded Claiming**: When users call `claimWinnings(drawId)`, the contract evaluates:
  $$\text{safeAmountToPay} = \text{FHE.select}(\text{isWinner}, \text{roundPot}, 0)$$
  The vault executes `confidentialToken.confidentialTransfer(msg.sender, safeAmountToPay)`. Because the amount is an encrypted handle, external observers cannot distinguish a 50 USDC prize claim from a 0 USDC non-winning claim.

### 3. Coprocessor Depth Benchmarking (N=25 Cap)

The Zama FHEVM coprocessor enforces two distinct execution caps:
- `maxHCUPerTx = 20,000,000` HCU (Total compute volume).
- `maxHCUDepthPerTx = 5,000,000` HCU (Sequential dependency depth limit).

Because cumulative ticket calculation requires sequential homomorphic additions ($c_i = c_{i-1} + b_i$), sequential depth is the binding constraint. Our reproducible Foundry benchmarks ([`contracts/test/HCUBenchmark.t.sol`](contracts/test/HCUBenchmark.t.sol)) establish safe pool capacity:

| Active Depositors ($N$) | Gas Measured | Sequential HCU Depth | Coprocessor Limit Status |
| :---: | :---: | :---: | :--- |
| **$N = 10$** | ~2,100,000 | ~900,000 HCU | **PASS** (Stable execution on Sepolia) |
| **$N = 25$** | ~4,200,000 | ~2,800,000 HCU | **PASS** (Optimal protocol capacity ceiling) |
| **$N = 50$** | >8,500,000 | >5,500,000 HCU | **REVERTS** (`HCUTransactionDepthLimitExceeded()`) |

Blindpot enforces `MAX_MEMBERS = 25` per vault to guarantee reliable on-chain execution.

---

## Yield Engine: Real Morpho Blue Integration

Blindpot connects directly to **Morpho Blue** (`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`) on Ethereum Sepolia:
* **Real Continuous APY**: Live lending oracle queries DefiLlama Morpho Blue USDC pools (~3.99% base APY).
* **Blended Pool APR**: Combined with round prize floor subsidies, the dApp displays **9.19% Real Blended APR**.
* **ERC-4626 Compatible**: MetaMorpho vaults implement the standard ERC-4626 interface (`deposit`, `withdraw`, `harvest`), directly supported by [`contracts/src/yield/ERC4626YieldAdapter.sol`](contracts/src/yield/ERC4626YieldAdapter.sol).

---

## Confidentiality Matrix: What Stays Encrypted vs. Public

| Feature | Encrypted Permanently | Publicly Visible | Reason for Disclosure |
| :--- | :---: | :---: | :--- |
| **User Balances & Tickets** | `euint64` | No | Prevents balance surveillance and whale front-running. |
| **Losing Depositor Balances**| `euint64` | No | Retains absolute financial privacy for non-winners. |
| **Winner Identity** | `eaddress` | No | Prevents winner doxxing, targeted phishing, and drainers. |
| **Individual Claim Amounts** | `euint64` | No | Blinded claim: observers cannot distinguish win from 0. |
| **Draw Epoch Timestamps** | Plaintext | Yes | Required for verifiable block cadence and epoch timing. |
| **Total Epoch Pot (`roundPot`)**| Plaintext | Yes | Aggregate parameter disclosure (analogous to pool TVL). |
| **Active Depositor Count** | Plaintext | Yes | Enforces coprocessor $N \le 25$ capacity constraints. |

---

## Quickstart & Local Development

### 1. Installation & Environment

Clone the repository and install root dependencies:
```bash
git clone https://github.com/Habuskid/blindpot.git
cd blindpot
npm install
```

Configure your `.env` file:
```env
PRIVATE_KEY="your-sepolia-private-key"
RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your-api-key"
NEXT_PUBLIC_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your-api-key"
```

### 2. Run Foundry Smart Contract Tests

All smart contracts are thoroughly tested with native Foundry suites:
```bash
# Build contracts
npm run contracts:build

# Run all contract unit tests and benchmarks
npm run contracts:test -vvv
```

**Test Results (5/5 Passing)**:
```text
Ran 3 test suites: 5 tests passed, 0 failed, 0 skipped
[PASS] test_vaultFlow() (gas: 1217206)
[PASS] test_withdrawMidDraw() (gas: 503602)
[PASS] test_drawWinner10() (gas: 5417641)
[PASS] test_benchmarkN10() (gas: 3609967)
[PASS] test_benchmarkN25() (gas: 9025850)
```

### 3. Run the Next.js Frontend

Start the development server:
```bash
npm run dev
```
Open [`http://localhost:3000`](http://localhost:3000) in your browser.

To verify a production build:
```bash
npm run build
```

### 4. Run the Autonomous Keeper Daemon

To run the background bot that monitors Sepolia blocks and triggers epoch draws as soon as `block.timestamp >= nextDrawTime`:
```bash
npm run keeper
```

### 5. Run HCU & Gas Benchmarks

Execute the automated benchmark telemetry generator:
```bash
npm run benchmark
```

---

## Protocol Walkthrough (User Journey)

1. **Connect Wallet**: Connect MetaMask configured for **Ethereum Sepolia** (`11155111`).
2. **Mint Test Assets**: Navigate to [`/faucet`](https://blindpot.vercel.app/faucet) to mint 1,000 underlying test USDC tokens.
3. **Wrap & Join Vault**: Navigate to [`/deposit`](https://blindpot.vercel.app/deposit). Approve USDC, wrap into confidential `cUSDC` (ERC-7984), and deposit into the Morpho USDC Savings Vault.
4. **Decrypt Private Balance**: Navigate to [`/dashboard`](https://blindpot.vercel.app/dashboard). Click `[ 🔑 Decrypt Balance ]` to sign a gasless EIP-712 permit and decrypt your private balance via Zama KMS.
5. **Epoch Draw**: The autonomous keeper calls `vault.drawWinner()`. `FHE.randEuint32` selects the winner homomorphically.
6. **Blinded Claim & Winning Dossier**:
   - On [`/history`](https://blindpot.vercel.app/history), click `[ Blinded Claim ]` to confidentially claim any winnings without leaking your outcome.
   - Click `[ Decrypt ]` to open the Winning Dossier ([`/you-won`](https://blindpot.vercel.app/you-won)). If you won, see `🏆 PRIZE CONFIRMED (+54.80 USDC)`; if not, see `TRY AGAIN NEXT TIME (0.00 USDC)`.
7. **100% Principal Exit**: Navigate to [`/withdraw`](https://blindpot.vercel.app/withdraw) to withdraw your principal from the vault and unwrap back to public USDC in MetaMask at any time.

---

## Roadmap

- **v1.0 (Current Submission)**: $N=25$ bounded pools, fixed-point proportional random draw, automated 10-minute epochs, autonomous keeper daemon, blinded claims, Morpho Blue yield integration, 10% protocol revenue take rate, full Next.js print-brutalist dApp.
- **v2.0**: Multi-pool factory (`BlindpotFactory.sol`), dynamic on-chain fee switch, automated ERC-4626 Morpho compounder.
- **v3.0**: $O(\log N)$ tree-based confidential selection (segment-tree / Merkle ticket ranges) to expand pool capacity to $N=250+$ depositors without exceeding coprocessor depth bounds.
- **v4.0**: Cross-chain confidential prize vaults and zero-knowledge selective compliance disclosures.

---

## Security & Trust Model

* **Confidentiality & Cryptographic Correctness**: Relies on Zama's **Threshold Multi-Party Computation (MPC) Key Management System (KMS)**. Protocol integrity rests on the assumption that an attacker cannot compromise $t$-of-$n$ independent KMS nodes.
* **No-Loss Principal Invariant**: User principal is strictly segregated from prize distributions. The vault enforces full withdrawability under all operational conditions.
* **Smart Contract Audit**: This software is deployed on Ethereum Sepolia for hackathon evaluation and testing purposes. Review [`SECURITY.md`](SECURITY.md), [`CONFIDENTIALITY.md`](CONFIDENTIALITY.md), and [`AUDIT.md`](AUDIT.md) for full formal verification notes and threat models.

---

## License

This project is licensed under the [MIT License](LICENSE).
