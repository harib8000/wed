# ADR-006: Redis Event Bus
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
WeddingOS services need lightweight asynchronous communication for events such as booking changes, payment outcomes, vendor updates, and notification triggers. We needed an event bus that is easy to run in development, fast to integrate, and sufficient for the current volume and complexity of domain events.

## Decision
We will use Redis pub/sub as the initial event bus instead of Kafka or RabbitMQ. This gives the platform a simple, low-overhead way to broadcast domain events while keeping local setup and early operational complexity manageable.

## Consequences
### Positive
- Redis is already part of the platform, so operational overhead stays low.
- Pub/sub is easy to integrate for lightweight event fan-out use cases.
- Local development and CI are simpler than with heavier brokers.
- Latency is low for transient notifications between services.
### Negative
- Redis pub/sub is not durable and offers weaker delivery guarantees than dedicated brokers.
- Replay, dead-letter handling, and consumer lag visibility are limited.
- Complex event-driven workflows may outgrow pub/sub semantics.
### Neutral
- Event contracts must still be versioned and governed carefully.
- A future migration to Kafka or RabbitMQ remains possible if scale or durability needs change.

## Alternatives Considered
We considered Kafka for durable, replayable event streams, but its operational cost and conceptual overhead were too high for the current phase. We also considered RabbitMQ for richer broker semantics, but Redis pub/sub fit better with our existing stack and the need for fast implementation of lightweight internal events.
