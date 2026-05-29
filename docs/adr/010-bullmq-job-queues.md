# ADR-010: BullMQ Job Queues
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
WeddingOS needs background processing for notifications, retries, scheduled reminders, media tasks, and other asynchronous workflows that should not block request-response paths. We needed a Node.js-friendly job queue with Redis backing, delayed jobs, retries, and operational simplicity consistent with the rest of the platform.

## Decision
We will use BullMQ for background job processing instead of building custom queue logic or adopting a heavier broker-first worker stack. BullMQ leverages Redis, supports retries and scheduling, and fits naturally into our TypeScript services.

## Consequences
### Positive
- Background work is moved out of request paths, improving API responsiveness.
- Retries, delays, and worker concurrency controls are available out of the box.
- Redis reuse keeps the operational stack simpler.
- BullMQ is well suited to notification and reminder workloads common in the platform.
### Negative
- Queue durability and scalability are tied to Redis architecture choices.
- Worker monitoring and dead-letter patterns need deliberate setup.
- Some very high-throughput or exactly-once use cases may need stronger guarantees later.
### Neutral
- Job payload design and idempotency remain application responsibilities.
- Separate worker processes and deployment conventions are required for production.

## Alternatives Considered
We considered custom cron and database-backed job polling, but that would recreate queue features poorly. We also evaluated Celery- or broker-centric approaches, but BullMQ offered a lighter fit for our Node.js services and existing Redis dependency. RabbitMQ-backed workers were also considered, but they added more infrastructure than the current workload required.
