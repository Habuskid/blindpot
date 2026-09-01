# SDK rules

## Conventions

- Every exported function wraps exactly one user-facing action (`deposit`,
  `withdraw`, `claim`, `getMyBalance`) — no god-functions.
- EIP-712 signature requests are never triggered automatically on page load
  or on wallet connect. They only fire from an explicit user action (a
  button press), per `docs/BRAND.md`'s UX rules and Zama's documented
  pattern.
- One signature per session should cover balance-view, claim, and withdraw
  where possible — don't prompt the wallet more than necessary.

## Deny rules

- Never cache a decrypted plaintext balance outside of in-memory session
  state — no localStorage, no writing it to disk, no logging it.
- Never swallow a relayer/KMS error silently — surface it through the
  frontend's error-state pattern (see `.agents/rules/frontend.md`), don't
  fall back to a stale or fake number.
