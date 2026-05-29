# ADR-003: JWT RS256 Auth
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
WeddingOS serves customers, vendors, admins, and internal services across multiple apps and APIs. We needed stateless authentication that works well across service boundaries, supports key rotation, and avoids maintaining server-side sessions for every request. The product also targets an India-first audience where OTP login is a common and low-friction sign-in pattern.

## Decision
We will use OTP-based login backed by RS256-signed JWTs for access and refresh flows instead of adopting OAuth as the primary user authentication model. RS256 allows the auth service to sign tokens with a private key while downstream services verify them using a public key.

## Consequences
### Positive
- Services can verify tokens locally without synchronous auth-service calls.
- Asymmetric signing improves key management and enables safer verifier distribution.
- OTP login reduces password friction and matches common user expectations in the target market.
- JWT claims support role-based access across customer, vendor, admin, and internal contexts.
### Negative
- Token revocation is harder than with server-side session storage.
- OTP delivery introduces dependence on SMS reliability and anti-abuse controls.
- OAuth integrations with third-party identity providers may still be needed later for enterprise scenarios.
### Neutral
- Refresh token rotation and secure storage remain required regardless of signing algorithm.
- Public/private key lifecycle management becomes an operational responsibility.

## Alternatives Considered
We considered HS256 JWTs, but shared symmetric secrets across many services increase blast radius if leaked. We considered traditional session cookies backed by centralized storage, but that would add cross-service coupling. We also considered full OAuth/OpenID Connect for primary login, but it adds complexity that is unnecessary for the current OTP-led user experience.
