# ADR-002: Microservices vs Monolith
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
WeddingOS spans authentication, users, vendors, bookings, payments, reviews, notifications, chat, media, search, execution workflows, and AI-assisted features. These domains have different scaling patterns, storage needs, release cadences, and external integrations. We needed an architecture that isolates high-risk domains like payments while allowing independent iteration on features such as search and chat.

## Decision
We will implement WeddingOS as 12 focused services instead of a single monolith. Each service owns a bounded context and can evolve independently while still sharing conventions, packages, and infrastructure through the monorepo.

## Consequences
### Positive
- Critical domains like payments and auth can be secured and scaled independently.
- Teams can deploy and test domain-specific changes without rebuilding the entire platform.
- Service boundaries encourage clearer ownership and better separation of concerns.
- Polyglot choices remain possible for specialized workloads such as AI.
### Negative
- Operational complexity increases significantly versus a monolith.
- Distributed tracing, observability, and local development become harder.
- Inter-service communication introduces network failure modes and consistency challenges.
### Neutral
- Some workflows require eventual consistency rather than immediate transactional guarantees.
- Shared platform standards are required to prevent services from drifting.

## Alternatives Considered
We considered a modular monolith, which would simplify deployment and debugging early on, but it would couple scaling and release cycles across unrelated domains. We also considered splitting only a few high-risk domains into services, but the target product already spans enough distinct capabilities that bounded services were judged the better long-term fit.
