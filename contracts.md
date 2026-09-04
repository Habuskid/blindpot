# Contract rules

## Conventions

- Core reusable logic lives in `contracts/core/` and must not import anything
  from `contracts/vaults/` — dependency direction is one-way, vaults depend
  on core, never the reverse. This is what keeps `BlindDraw.sol` genuinely
  reusable by other teams later.
- Every function touching an encrypted type gets an explicit comment stating
  who is granted `FHE.allow` access and why.
- Ticket tiering (`TicketTiers.sol`) uses `FHE.select` cascades against fixed
  public thresholds, never per-wei precision.

## Deny rules

- Never decrypt a user balance in a test, script, or contract for
  convenience — write FHE-native assertions instead, even if slower to
  write.
- Never change the pool member cap without re-running the gas benchmark test
  and updating the number in `ARCHITECTURE.md`.
- Never merge a change to `BlindpotVault.sol`'s withdraw function without a
  passing test proving withdraw still succeeds mid-draw.

## Testing requirement

Every change touching `contracts/core/` or `contracts/vaults/` needs a gas
report for the draw loop at the current member cap, committed alongside the
change.
