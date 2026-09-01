# Security

Blindpot is unaudited, experimental, testnet-only software. Do not use with
real funds.

## Trust assumptions

- **Threshold MPC & Coprocessor Trust**: Winner selection, blinded prize claiming, and private balance decryption depend on Zama's distributed Key Management System (KMS) and coprocessor infrastructure. Zama's KMS operates via a **Threshold Multi-Party Computation (MPC) network** ($t$-of-$n$ scheme) where no single operator or relayer holds the global decryption key. Protocol correctness and confidentiality rest on the assumption that a dishonest coalition does not reach the threshold $t$ of independent KMS validator nodes, and that coprocessor nodes execute deterministic FHEVM bytecode faithfully.
- `MockYieldSource` is admin-funded for the testnet demo. A real yield source (Aave-style) would carry its own, separate trust and risk surface not covered by this document.

## FHE-specific risks

- **`FHE.allow` / ACL correctness is the highest-risk area in this codebase.**
  A missing or overly broad grant doesn't throw an error — it silently either
  blocks a legitimate decrypt or leaks a ciphertext to someone who shouldn't
  have access. Every function touching an encrypted value is checked against
  `docs/AUDIT.md`'s ACL checklist before merge.
- Encrypted inputs (`einput` + proof) are single-use by design. Contracts
  must never accept a replayed ciphertext/proof pair as fresh input.
- `FHE.randEuint` depends on the protocol's on-chain PRNG state; it cannot be
  called via `eth_call` and must always run inside a real transaction — see
  `docs/ARCHITECTURE.md` for how the draw is triggered.

## Known, accepted limitations (v1)

- **Deposit timing is public**, even though the deposit *amount* isn't.
  Someone could technically time a deposit right before a draw snapshot.
  This doesn't reveal any balance, but it's a real, documented gaming
  vector, stated plainly rather than glossed over.
- **Member cap of ~50 per pool** — a gas/complexity tradeoff, not a security
  flaw, but listed here because it constrains scale. See
  `docs/ARCHITECTURE.md`'s roadmap for the planned fix.
- Aggregate pool size may be publicly inferable, depending on the confidential
  token's total-supply exposure. Flagged, not yet resolved — see
  `docs/CONFIDENTIALITY.md`.

## Standard contract risks (checked in docs/AUDIT.md)

Reentrancy on withdraw/claim, access control on admin/keeper functions,
integer bounds on ticket-tier thresholds, front-running of the draw-trigger
transaction.

## Reporting a vulnerability

[email or GitHub security advisory link — fill in before submission]

Please do not open a public issue for anything that could leak user balances
or funds — report privately first.
