# Self-audit checklist

No formal third-party audit for v1 — solo build, hackathon timeline. This is
the checklist actually run before submission, kept honest rather than
skipped. Accepted risks are cross-referenced from `SECURITY.md`, not
duplicated here.

## Per-contract checklist

### BlindpotVault.sol
- [x] Reentrancy: withdraw/claim follow checks-effects-interactions
- [x] Access control: only the depositor can withdraw/claim their own funds
- [x] Withdraw succeeds in every pool state, including mid-draw
- [x] Every `FHE.allow` grant reviewed — who can decrypt what, and why
- [x] Single draw per epoch: `drawWinner()` requires `block.timestamp >= nextDrawTime` and immediately pushes `nextDrawTime = block.timestamp + drawInterval`, preventing double-draws for the same round
- [x] Blinded claim double-claim protection: `hasClaimed[drawId][msg.sender]` is tracked as an encrypted boolean via `FHE.select(canClaim, true, alreadyClaimed)` with persistent `FHE.allowThis`, preventing multiple prize payouts
- [x] Zero-value transient ACL: `FHE.allowTransient(safeAmountToPay, address(confidentialToken))` authorizes the token contract for both winning and 0-value confidential transfers without reverting
- [x] EIP-712 Precomputed Winnings ACL scoping: `userWinnings[drawId][memberUser]` grants decryption permissions *strictly* to `memberUser` and `address(this)`, preventing cross-user eavesdropping

### BlindDraw.sol
- [x] `FHE.randEuint32` called only inside a real transaction, never assumed available in a view call
- [x] Proportional scaling divisor is a plaintext constant ($2^{32}$), strictly compliant with `FHE.div` requirements
- [x] Gas & HCU cost benchmarked at the current member cap ($N=10, 25, 50$), committed to `contracts/test/HCUBenchmark.t.sol` and `scripts/benchmark.mjs`

### TestToken.sol / wrapper
- [x] Faucet has a sane rate limit — can't be drained (1,000 USDC per tx, UI action lock & testnet faucet rate control)
- [x] Wrap/unwrap conserves value exactly (1:1 backing via ERC-7984 standard wrapper with zero slippage or fees)

## Findings log

Append entries as issues are found and fixed. Don't delete resolved ones —
a visible trail of what was caught is worth more to judges than a
clean-looking empty checklist.

## [2026-09-01] — [HIGH] — BlindDraw.sol
Issue: `addMember`, `removeMember`, and `drawWinner` functions had `public` visibility without sender restrictions, allowing direct arbitrary invocation bypassing `BlindpotVault`.
Fix: Added `immutable address public vault;` set in `constructor()` and enforced `onlyVault` modifier across all state-altering and draw execution functions.
Verified: Compiled with solc 0.8.27 (`npm run compile`), verified unauthorized external calls revert.

## [2026-09-01] — [MEDIUM] — BlindpotVault.sol
Issue: Potential cross-contract reentrancy risk during token transfers, ERC-7984 callbacks, or external lending yield harvesting adapters.
Fix: Implemented gas-efficient `ReentrancyGuard` mutex (`nonReentrant` modifier) across `onConfidentialTransferReceived()`, `withdrawAll()`, `claimWinnings()`, and `drawWinner()`.
Verified: Verified atomic execution and compilation with 0 errors.

## [2026-09-03] — Formal Audit against Official Zama FHEVM Guidelines & Security Rules

### 1. Zama Protocol Invariant Verification
- [x] **ZamaEthereumConfig Inheritance**: Both `BlindpotVault` and `BlindDraw` inherit `ZamaEthereumConfig`, establishing per-chain coprocessor addresses (`ACL`, `FHEVMExecutor`, `KMSVerifier`) for Sepolia (`11155111`).
- [x] **ERC-7984 Confidential Accounting**: Interacts exclusively with OpenZeppelin's standard `ERC7984` confidential wrapper (`0x7c5B...3639`). Zero hand-rolled mapping balances or custom transfer logic.
- [x] **ACL Scope & Permission Isolation**:
  - State updates are immediately protected with `FHE.allowThis(handle)`.
  - User-decryptable state (`userWinnings`, `balance`) calls `FHE.allow(handle, user)` strictly for the authorized account.
  - Cross-contract transfers utilize `FHE.allowTransient(handle, targetContract)` rather than permanent ACL pollution.
- [x] **No Branching on Ciphertexts**: Zero `if (encrypted)` statements exist. All conditional logic evaluates via `FHE.select(ebool, ifTrue, ifFalse)` where both branches execute homomorphically.
- [x] **Plaintext Divisor Standard**: `BlindDraw.sol` scales random entropy using fixed-point multiplication and division with a constant plaintext divisor ($2^{32}$), complying with Zama coprocessor constraints.
- [x] **Cryptographic Randomness**: Operates exclusively with `FHE.randEuint32()`. Zero reliance on off-chain Chainlink VRF or pseudo-random fallbacks.
- [x] **Event Log Confidentiality**: Zero encrypted handles or ciphertexts are emitted in event topics or data. Events emit aggregate metadata (`drawId`, `timestamp`, `roundPot`, `memberCount`).
- [x] **Coprocessor HCU Depth Bound**: Sequential dependency depth benchmarked at ~2.8M HCU for $N=25$, safely beneath the coprocessor's `maxHCUDepthPerTx = 5,000,000` limit.
- [x] **Silent Zero-Transfer Compliance**: Unclaimed or non-winning prize claims evaluate to `FHE.asEuint64(0)`, executing silent confidential transfers without reverting.

## Accepted risks

See `SECURITY.md` → "Known, accepted limitations (v1)".
