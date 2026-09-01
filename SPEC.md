# Bounty spec (distilled)

Zama Developer Program — Mainnet Season 4, Bounty Track.
Deadline: September 5, 23:59 AOE.

## Required user flow

Deposit → Hold (encrypted) → Win (draw) → Claim (EIP-712 decrypt) → Withdraw

## Hard requirements

- ERC-7984 or encrypted-integer accounting for balances — no plaintext
  balance anywhere on-chain
- Winner selection: on-chain FHE randomness (`FHE.randEuint`), deposit-
  weighted, computed over encrypted balances — no off-chain RNG
- Principal withdrawable at any time — no loss, no exceptions
- Automated draws, or a documented keeper/admin trigger
- EIP-712 user decryption of balance and winnings
- Faucet or clear instructions for obtaining the test token
- Public GitHub repository, open source
- Live, publicly accessible Sepolia deployment, every feature usable by a
  connected wallet
- 3-minute real-person demo video (no AI-generated voice or video, normal
  speed only)
- X thread or article introducing the project

## Judging criteria

- **Correctness** — does deposit/draw/claim/withdraw produce expected
  results on-chain, is EIP-712 implemented correctly
- **Confidentiality design** — what stays encrypted, is winner selection
  provably fair and deposit-weighted, is any leakage minimal and documented
- **UX** — pleasant to use, approvals and errors handled gracefully
- **Code quality** — clean, readable, well-typed, well-documented
- **Production-readiness** — stable live deployment, could a real user trust
  it today

## What "documenting leakage" means for this project

See `docs/CONFIDENTIALITY.md` — this is a judged line item, not optional
polish.
