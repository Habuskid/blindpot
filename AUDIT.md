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
- [ ] Faucet has a sane rate limit — can't be drained
- [ ] Wrap/unwrap conserves value exactly

## Findings log

Append entries as issues are found and fixed. Don't delete resolved ones —
a visible trail of what was caught is worth more to judges than a
clean-looking empty checklist.

```
## [date] — [severity] — [contract]
Issue:
Fix:
Verified:
```

## Accepted risks

See `SECURITY.md` → "Known, accepted limitations (v1)".
