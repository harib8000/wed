# ADR-009: Escrow Payment Model
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
Wedding and event bookings involve high-value transactions, trust concerns, cancellations, and disputes between customers and vendors. The platform needs a payment model that reduces fear for customers while assuring vendors that legitimate work will be paid. Trust is a key differentiator in event marketplaces.

## Decision
We will use an escrow-style payment model in which customer funds are collected and held until agreed milestones or completion conditions are met, after which payout or release rules are applied. The platform will enforce this flow through booking, payment, and dispute states.

## Consequences
### Positive
- Customers gain confidence that payment is protected until service obligations are met.
- Vendors benefit from a clearer commitment signal once funds are secured.
- The platform has a structured mechanism for dispute handling and refunds.
- Booking and payment lifecycles become more transparent and auditable.
### Negative
- Operational complexity increases around release logic, disputes, and reconciliation.
- Cash flow timing for vendors may be less favorable than immediate settlement.
- Legal, compliance, and support expectations are higher for held funds workflows.
### Neutral
- Clear policy communication is required in product UX and vendor onboarding.
- Some events may still require milestone-based customization beyond a single release point.

## Alternatives Considered
We considered immediate direct payment to vendors, which would simplify operations but weaken customer trust and dispute leverage. We also considered inquiry-only or pay-later models, but those reduce conversion confidence and do not provide the strong transactional guarantees desired for a premium marketplace experience.
