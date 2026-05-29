# ADR-004: Razorpay Payment Gateway
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
WeddingOS needs reliable payment collection, refunds, escrow-like workflows, and support for India-specific methods such as UPI, cards, and net banking. We needed a gateway with strong domestic coverage, good developer tooling, webhook support, and a support model aligned to Indian merchants and settlement flows.

## Decision
We will use Razorpay as the primary payment gateway instead of Stripe or PayU. Razorpay best fits the platform's India-first market, payment method coverage, and operational requirements for booking advances, captures, refunds, and escrow-adjacent flows.

## Consequences
### Positive
- Strong support for Indian payment methods improves conversion in the target market.
- Razorpay has mature APIs, webhook support, and common merchant adoption in India.
- Settlement and compliance expectations are better aligned with local business operations.
- Refund and capture workflows map well to booking and escrow state transitions.
### Negative
- Geographic flexibility is narrower than with a more globally oriented provider like Stripe.
- Gateway abstraction is still required if multi-provider failover is needed later.
- Escrow requirements may still need business-layer controls beyond gateway primitives.
### Neutral
- A provider adapter layer remains valuable to reduce vendor lock-in.
- Payment operations still require reconciliation, alerting, and dispute handling regardless of gateway.

## Alternatives Considered
We evaluated Stripe for its excellent developer experience and global reach, but India-specific payment expectations made Razorpay the better primary choice. We also considered PayU, which has strong regional presence, but Razorpay offered a better balance of APIs, ecosystem familiarity, and operational fit for our planned payment lifecycle.
