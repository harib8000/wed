# ADR-007: Prisma ORM
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
Most WeddingOS services use PostgreSQL and need type-safe database access, migrations, and schema management that work well with TypeScript. We wanted an ORM that improves developer productivity, reduces raw SQL boilerplate for common flows, and produces predictable generated client types across services.

## Decision
We will use Prisma as the primary ORM for PostgreSQL-backed services instead of TypeORM or Sequelize. Prisma's schema-first workflow, generated types, and migration tooling align well with our TypeScript-heavy service layer.

## Consequences
### Positive
- Generated client types improve end-to-end type safety in service code.
- Prisma schema files make data models explicit and consistent across services.
- Developer onboarding is simpler with a predictable migration and client generation workflow.
- Common CRUD and relational queries are easier to implement and maintain.
### Negative
- Prisma adds a code generation step that must be handled in CI and local workflows.
- Some advanced SQL patterns may still require raw queries.
- Runtime and migration behavior must be understood carefully in distributed deployments.
### Neutral
- Each service still owns its schema and migration history independently.
- Database tuning and indexing remain necessary beyond ORM selection.

## Alternatives Considered
We evaluated TypeORM, which offers decorator-based models and mature patterns, but Prisma provided a cleaner schema-first approach and stronger generated typing. Sequelize was also considered, but it offered a weaker TypeScript ergonomics profile for the level of type safety we wanted across services.
