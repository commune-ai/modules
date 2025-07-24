# StakeTime: Time‑Lock Staking Multiplier with Epochal Vesting

*Open Source Draft v0.2 — June 2025*

---

## Abstract

Stakers mint **synthetic governance tokens** by locking a base asset for a chosen period $t$ (max. **4 years**). A multiplier curve $M(t)$ converts lock length into the mint amount. All curve parameters live on‑chain and can be tuned by governance without redeploying code. Epochic rewards are routed through a vesting escrow and may be partially or fully cut—by multisig or on‑chain DAO—if validator misconduct is proven within a configurable look‑back window. This README captures the mathematics, pallet interface, economic logic and security considerations in prose that fits both GitHub and Twitter Articles.

---

## Core Symbols & Governance Knobs

| Symbol  | Meaning                                      |
| ------- | -------------------------------------------- |
| `A`     | Base tokens locked by a staker               |
| `t`     | Lock duration (`0 < t ≤ t_max`)              |
| `t_max` | Maximum lock (default **4 years**)           |
| `M(t)`  | Multiplier converting `A` → synthetic supply |
| `S`     | Synthetic tokens minted (see *Minting*)      |
| `k`     | Multiplier ceiling (governance‑controlled)   |
| `p`     | Curve exponent (governance‑controlled)       |
| `ε`     | Epoch length in blocks                       |
| `ν`     | Vesting span in epochs                       |
| `λ`     | Arbitration look‑back window                 |

> **Canonical defaults:** `k = 4`, `p = 1` (linear curve), `ε` ≈ 14 400 blocks / day.

---

## Multiplier Curve

```latex
$$
M(t)=k\left(\frac{t}{t_{\max}}\right)^{p}, \qquad 0 < t \le t_{\max}
$$
```

* $p < 1$ → rewards short locks (concave)
* $p = 1$ → linear schedule
* $p > 1$ → heavily favors long‑term locks (convex)

Governance can update $k$, $p$ **or replace the curve entirely** via `dao::set_curve` without a hard‑fork.

---

## Minting Flow

1. **Call** `create_lock(A, t)`.
2. Runtime transfers `A` to escrow.
3. Compute $S = A\,M(t)$.
4. Credit caller with $S$ synthetic governance tokens.
5. On unlock, burn $S$ and return $A$ (minus exit fee, if any).

---

## Epochal Emission & Vesting

Every $ε$ blocks the chain mints rewards **pro‑rata to current $S$ balances**. Payouts are not immediately liquid: each reward chunk vests linearly across $ν$ epochs.

```latex
$$
\text{Unlocked}(n) = \frac{n}{ν}\times \text{reward}, \qquad 0 \le n \le ν
$$
```

If arbitration later proves mis‑behavior, the yet‑to‑vest portion can be slashed.

---

## Arbitration & Slashing

* **Actors:** Validator set, multisig of arbiters, or token‑weighted DAO.
* **Procedure:**

  1. Submit `slash_motion(validator, epoch, evidence)` within look‑back $λ$.
  2. On approval, runtime removes unvested rewards for that epoch.
  3. Optionally apply extra penalty on the validator’s principal lock.
* **Result:** Slashed amounts redirect to the community treasury.

---

## Governance Controls

* `set_curve(k, p, func_id)` — update multiplier parameters
* `set_epoch_length(ε)` — adjust epoch cadence
* `set_vesting_span(ν)` — tune vesting horizon
* `set_lookback(λ)` — amend arbitration window
* Emergency **pause** of new locks without blocking unlocks

Existing locks retain their original curve; new locks observe updated rules.

---

## Security Notes

* **Governance Neutrality:** Cap $k$ & shape $p$ to avoid outsized voting power.
* **Clawback:** Vest‑then‑slash design keeps illicit rewards retractable for $λ$ epochs.
* **Math Safety:** Fixed‑point (64‑bit) with saturation prevents overflow.
* **Griefing Guard:** Early exit burns synthetic balance **and** optional haircut on $A$ to deter spam.

---

## Quick‑Start (Pallet Interface)

```rust
// create a lock
extrinsic create_lock(amount: Balance, duration: BlockNumber)

// increase lock duration (no decrease)
extrinsic extend_lock(id: LockId, additional: BlockNumber)

// claim vested rewards
extrinsic claim_rewards()

// governance example: tweak curve
extrinsic dao::set_curve(k: u32, p: u32, func_id: u8)
```

---

## Conclusion

Time‑lock staking coupled with a programmable multiplier **aligns commitment with influence** while vest‑then‑slash rewards reconcile capital efficiency with accountability. All levers reside in on‑chain storage, so economic policy can evolve—a governance vote away—without disruptive code changes.

---

*Built with ❤️ by the Commune‑AI community — contributions & audits welcome!*
