# Frontend rules

Design system source of truth: `docs/BRAND.md`.
Full page-by-page spec: `docs/UI-PROMPTS.md`.

## Deny rules

- No gradients, no glassmorphism, no soft/blurred drop shadows — shadows are
  hard-offset only.
- No border-radius over 2px anywhere, except the one defined exception on the
  claim screen's brass border treatment.
- No emoji, anywhere, ever.
- No generic crypto iconography — no coins, rockets, or padlocks-with-sparkles.
- Never fill a button solid unless it's the claim screen's primary action —
  every other button stays outlined. If a second filled button shows up,
  stop and check `docs/BRAND.md` before shipping it.

## Required pattern

Any place a monetary value renders, it defaults to the redaction-bar element
(see `docs/BRAND.md`) until the user has explicitly decrypted it in that
session. Never render a real number before that decrypt action has happened
— build the redacted state first, even during development with test data.
