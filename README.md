# Blindpot

A confidential, no-loss prize savings protocol built on the Zama Protocol.

Deposit into a shared pool. Your balance is encrypted the moment it lands
on-chain — not hidden by a UI, actually encrypted, so nobody, including us,
can see it. Withdraw your full principal any time, no loss, no lock.
Periodically, the pool's accrued yield is awarded to one depositor, chosen by
on-chain FHE randomness weighted by deposit size, computed entirely over
encrypted balances. Only the winner ever learns the amount.

## Live demo

[fill in once deployed — publicly accessible Sepolia deployment URL]

## Why this needs FHE

On a transparent chain, a prize-savings protocol leaks everything: how much
every user has saved, everyone's odds, and who won every draw. That exposes
users' wealth and blocks any institution from ever using the pattern. FHE
removes that trade-off — see `docs/CONFIDENTIALITY.md` for exactly what stays
private and what's necessarily public, and why.

## Quickstart

1. Connect a wallet, on Sepolia
2. Get test tokens from the in-app faucet
3. Approve → wrap → deposit
4. Decrypt your balance any time via the EIP-712 signature flow
5. Withdraw your principal whenever you want — no loss, ever
6. If a draw has run and you won, claim via the same decrypt flow

## Repo structure

```
contracts/   core primitive (BlindDraw.sol), vault + factory, test token, yield interface
sdk/         thin TypeScript wrapper over @zama-fhe/relayer-sdk
app/         reference frontend
docs/        spec, architecture, confidentiality design, brand, audit checklist
```

## Documentation

- `docs/SPEC.md` — bounty requirements this submission targets
- `docs/ARCHITECTURE.md` — how the protocol is layered, and the roadmap past v1
- `docs/CONFIDENTIALITY.md` — what's encrypted, what leaks, and why
- `docs/BRAND.md` — naming and design system
- `docs/AUDIT.md` — self-audit checklist and findings
- `SECURITY.md` — security considerations and responsible disclosure

## Status

Unaudited, testnet-only, experimental. See `SECURITY.md`.

## License

[choose one — MIT recommended for a submission you want other teams to build on]
