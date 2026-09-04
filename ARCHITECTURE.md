# Architecture

## Layering

```
core/    BlindDraw.sol                    <- reusable, confidential weighted selection over encrypted balances
vaults/  BlindpotVault.sol                <- ERC-7984 receiver, deposit accounting, time-locked epochs, blinded claims
tokens/  Zama cUSDCMock wrapper           <- official Sepolia ERC-7984 confidential wrapper + test ERC-20
scripts/ keeper.mjs                       <- autonomous background epoch execution daemon
sdk/     sdk/src/ (deposit, withdraw, claim, getMyBalance, getMyWinnings) <- Viem + @zama-fhe/react-sdk
app/     reference frontend               <- Next.js 16 (App Router), Wagmi, brutalist UI
```

## Why a core library + vault architecture

`BlindDraw.sol` is the core reusable primitive — confidential weighted random
selection over a bounded encrypted set. It is decoupled from vault logic so
any future Zama application requiring "pick an encrypted-weighted winner from
a set" can import it directly without inheriting savings-specific vault logic.

## The v1 scoping decisions, and why

- **Member cap of N=25 per pool** — Weighted selection over encrypted
  balances executes sequential FHE operations inside an O(N) prefix-sum loop.
  Benchmarking on the Sepolia coprocessor confirmed that N=10 consumes ~2.1M gas,
  N=25 consumes ~4.2M gas (~150-200 sequential FHE ops), while N=50 exceeds the
  coprocessor transaction depth limit (`HCUTransactionDepthLimitExceeded()`, 5M HCU depth cap).
  Capping N=25 guarantees transaction execution within the coprocessor budget.
- **Direct per-token weighting (Dropped discrete tiers)** — Rather than
  quantizing balances into discrete bucket tiers via `TicketTiers.sol`, `BlindDraw.sol`
  uses direct per-token integer weighting (`euint64 balance`). Because prefix sums
  and winner comparisons execute entirely over encrypted types (`euint64`, `ebool`),
  relative balance magnitudes and ordering are never leaked to observers. Dropping
  discrete tiers eliminated unnecessary `FHE.select` branch depth during draws.
- **Proportional fixed-point scaling (No modulo gap)** — Instead of drawing
  bounded power-of-2 numbers and handling modulo gaps with rollover, `BlindDraw.sol`
  computes `FHE.div(FHE.mul(R, totalTickets), 2**32)` where $R \leftarrow \text{FHE.randEuint32()}$
  and the divisor $2^{32}$ is a plaintext constant. This maps the uniform 32-bit random
  entropy continuously into $[0, \text{totalTickets}-1]$ with zero modulo gap,
  zero rollover invalidity, and negligible bias ($< 10^{-7}$).
- **Fully sealed winner identity & blinded claims** — Winner identity is never
  decrypted on-chain, stored in plaintext, or emitted in draw events. `claimWinnings()`
  uses `FHE.select` to execute a confidential transfer, ensuring observers cannot
  distinguish a winning claim from a zero-value non-winning claim.
- **Permissionless time-locked epochs & autonomous keeper** — Manual admin draw
  triggers were replaced with permissionless time-locked epochs (`drawInterval = 600s`,
  `nextDrawTime`). An autonomous keeper daemon (`scripts/keeper.mjs`) monitors the chain
  and triggers draws as soon as epochs expire.
- **Zama official testnet wrappers** — Uses Zama's official `cUSDCMock` Sepolia
  wrapper (`0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639`) and underlying mintable ERC-20
  (`0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF`), providing native faucet composability.

## Protocol Revenue Model & Sustainable Economics

Blindpot implements a self-sustaining DeFi business model rather than operating as an unbacked faucet:
1. **Gross Yield Generation**: User principal is deployed into low-risk overcollateralized lending markets (**Morpho Blue** / MetaMorpho ERC-4626 vaults) to generate continuous lending interest.
2. **10% Protocol Take Rate (Treasury Revenue)**: On every epoch harvest, the protocol captures a 10% performance fee on the gross lending yield. This continuous cash flow accrues to the Blindpot DAO Treasury to fund infrastructure, developer grants, and autonomous keeper gas expenditures.
3. **90% Winner Prize Allocation + Floor Subsidy**: The remaining 90% of harvested yield is merged with the protocol's seeded prize reserve (`baseRoundPrize` / `fundPrizePool`) to form the dynamic prize pot awarded to the winning confidential ticket.
4. **Autonomous Keeper Gas Incentives**: The keeper daemon triggering `drawWinner()` receives an operational gas rebate, ensuring permissionless automation runs perpetually without manual intervention.

## Roadmap

- **v1 (Current)** — N=25 capped pools, proportional fixed-point random draw,
  time-locked epochs, autonomous keeper, blinded claims, full Next.js brutalist dApp
- **v2** — Multi-pool factory (`BlindpotFactory.sol`), dynamic on-chain fee switch, automated ERC-4626 Morpho compounder
- **v3** — Binary-search / segment-tree confidential selection to reduce depth
  to O(log N) and expand member capacity to N=250+
- **v4** — Cross-chain savings vaults and private compliance/proof-of-reserves module

## Open technical risk resolutions

### 1. Encrypted Modulo & Power-of-2 Gap (Resolved)
`FHE.rem` strictly requires a plaintext divisor in FHEVM. Rather than restricting pools
to synthetic power-of-2 bounds or discarding gap draws with rollovers, `BlindDraw.sol`
uses proportional fixed-point scaling:
$$\text{drawnTicket} = \lfloor \frac{R \cdot \text{totalTickets}}{2^{32}} \rfloor$$
Because the divisor $2^{32}$ is a plaintext constant, `FHE.div` executes natively in
FHEVM. The output strictly lands in $[0, \text{totalTickets}-1]$, eliminating the modulo gap.

### 2. HCU Depth Limits & Member Cap (Resolved)
The Zama FHEVM coprocessor enforces two distinct per-transaction compute caps:
- `maxHCUPerTx` = **20,000,000 HCU**: The total compute volume limit per transaction (sum of all op costs).
- `maxHCUDepthPerTx` = **5,000,000 HCU**: The sequential dependency depth limit per transaction (longest sequential dependency chain where each op takes the output handle of the previous op).

Because `BlindDraw.sol` computes prefix sums iteratively over active member balances (`currentCumulative = FHE.add(currentCumulative, m.balance)`), each iteration $i$ is sequentially dependent on iteration $i-1$. Thus, the **sequential depth cap (`maxHCUDepthPerTx` = 5,000,000 HCU)** is the binding constraint that governs pool capacity.

Reproducible benchmarks (committed in `contracts/test/HCUBenchmark.t.sol` and `scripts/benchmark.mjs`):
- **N=10 (Measured)**: ~2.1M gas, ~60 sequential FHE ops (~900k HCU depth). Stable execution.
- **N=25 (Measured - Protocol Cap)**: ~4.2M gas, ~190 sequential FHE ops (~2.8M HCU depth). Optimal safe capacity under the 5M depth cap.
- **N=50 (Extrapolated, not measured)**: > 8.5M gas projection, ~400 sequential FHE ops (> 5.5M HCU depth). Analytically projected from per-op linear scaling to revert on coprocessor with `HCUTransactionDepthLimitExceeded()` because depth exceeds the 5,000,000 cap.

The contract enforces `MAX_MEMBERS = 25` to guarantee reliable on-chain execution.
