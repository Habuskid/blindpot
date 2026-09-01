# Blindpot — AGENTS.md

This file is deliberately tool-agnostic. It's the `AGENTS.md` standard, read
natively by Cursor, Claude Code, Windsurf, and Antigravity — whichever agent
you're using this time, it should pick this up with no changes needed.

## What this is

Confidential no-loss prize savings protocol on the Zama Protocol (fhEVM).
Deposits, balances, and winnings stay encrypted end-to-end — nobody, including
the app itself, can see an individual's numbers except that person. Built for
Zama Developer Program Mainnet Season 4 — Bounty Track.

Deadline: September 5, 23:59 AOE.

## Stack

- Contracts: Solidity, Foundry, patterns from zama-ai/fhevm-hardhat-template
- Confidential tokens: ERC-7984 (OpenZeppelin confidential-contracts)
- SDK: TypeScript wrapper around @zama-fhe/relayer-sdk
- Frontend: Next.js, raw print-brutalist design system (docs/BRAND.md)

## Repo layout

```
blindpot/
├── contracts/
│   ├── core/       BlindDraw.sol, TicketTiers.sol
│   ├── vaults/      BlindpotVault.sol, BlindpotFactory.sol
│   ├── tokens/      TestToken.sol (+ OZ ERC7984ERC20Wrapper)
│   ├── yield/       IYieldSource.sol, MockYieldSource.sol
│   └── test/
├── sdk/src/         deposit.ts, withdraw.ts, claim.ts, getMyBalance.ts
├── app/             reference frontend (Next.js)
├── .agents/rules/   contracts.md, frontend.md, sdk.md
└── docs/            SPEC.md, ARCHITECTURE.md, CONFIDENTIALITY.md, BRAND.md, AUDIT.md, UI-PROMPTS.md
```

## Start every session by reading

1. `LOGS.md` — check the feature manifest for what's done/pending, and read
   the most recent session-log entries for context on what just happened.
2. `docs/SPEC.md` — the actual judged requirements. Don't drift from these.
3. `docs/ARCHITECTURE.md` — before touching contract structure or adding a
   new contract.

## End every session by

Appending an entry to `LOGS.md` — what was added, what was changed, and
explicitly noting anything that was **removed**, even if it looked like
harmless cleanup. This is not optional. It's the only paper trail we have
against a refactor silently dropping a working feature.

## Non-negotiables

- Individual balances/deposits must never be decrypted server-side, in a
  script, or in any off-chain step, for any reason including debugging.
  That defeats the entire point of the submission.
- Withdraw must always work — full principal, no lock, no fee. If a change
  makes withdraw fail under any condition, stop and flag it, don't route
  around it.
- Winner selection uses `FHE.randEuint` only. No off-chain RNG, no
  pseudo-random fallback, ever — this is a judged requirement.
- Before adding a contract, dependency, or pattern not already described in
  `docs/ARCHITECTURE.md`, check `docs/SPEC.md` — new scope needs to map to
  something actually required or already on the roadmap.
- Check `SECURITY.md` before writing anything involving `FHE.allow` / ACL
  grants — this is the most common FHE smart-contract bug class, and
  mistakes here silently leak data instead of throwing an error.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
