# Confidentiality design

## Stays encrypted, always

- **Individual deposit amounts and ticket shares** — Encrypted as `euint64` handles via ERC-7984. No observer, admin, or script can inspect participant balances.
- **Every losing participant's balance** — Permanently sealed in ciphertext storage.
- **Winner's address and identity** — Encrypted on-chain as `eaddress` inside `BlindDraw.sol` and `BlindpotVault.sol`. The `DrawExecuted` event emits only the `drawId`, `timestamp`, and `roundPot`. The winner's address is **never** decrypted on-chain, logged in plaintext, or exposed in event logs.
- **Draw outcomes & individual winnings** — Stored as user-specific encrypted `euint64` handles (`userWinnings[drawId][user]`). Each user can only decrypt their own outcome off-chain using an EIP-712 permit signed by their connected wallet private key.
- **Claim execution privacy** — `claimWinnings()` executes a confidential transfer on-chain using `FHE.select(canClaim, amountToPay, 0)`. Third-party observers watching the transaction cannot determine whether a caller won the prize or received 0 tokens.

## Necessarily public, and why

- **Draw epoch timing & block timestamp** — Inherent to on-chain block production and epoch verification (`nextDrawTime`, `block.timestamp`).
- **Draw ID & round counter** — Incremental integer (`currentDrawId`) tracking completed draw cycles.
- **Round Prize Pot (`roundPot`)** — Emitted in plaintext by the `DrawExecuted` event. This is an intentional aggregate protocol parameter disclosure (analogous to pool TVL) so all participants know the exact total prize amount awarded for the epoch.
- **Active depositor count** — Integer `memberCount` (bounded to $N \le 25$) to enforce coprocessor HCU capacity limits and track pool participation.

## The deliberate boundary & trust model

In our architecture, we transitioned from an older public-winner model to a **fully sealed winner & blinded claim model**. 

Under this model:
1. **End-to-End Privacy**: Winner identity, winning amounts, and claim executions are permanently sealed in ciphertext storage. An external observer seeing `claimWinnings()` cannot distinguish a winner claiming prize funds from a non-winner receiving 0 tokens.
2. **Threshold MPC Trust Assumption**: Because winner identity and balances are never revealed on-chain, external observers cannot independently reconstruct the draw outcome from event logs. Correctness, randomness fairness, and confidentiality rest on the assumption that a dishonest coalition does **not reach the threshold $t$ of independent KMS nodes** in Zama's distributed Threshold Multi-Party Computation (MPC) network, and that the Zama coprocessor executes the deterministic Solidity bytecode (`FHE.randEuint32` and homomorphic prefix sums) honestly. No single operator, relayer, or validator holds the decryption key. This directly aligns with the core threshold trust assumptions documented in `SECURITY.md`.

