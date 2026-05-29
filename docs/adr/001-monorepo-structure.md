# ADR-001: Monorepo Structure
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
WeddingOS includes customer-facing apps, vendor and admin portals, shared TypeScript packages, infrastructure code, and many backend services that must evolve together. We needed a repository strategy that keeps cross-service refactors manageable, makes shared package versioning simple, and avoids the coordination overhead of many small repositories. We also needed fast incremental builds and cacheable CI for a growing workspace.

## Decision
We will use a pnpm-based monorepo with Turborepo orchestration. pnpm gives us efficient workspace dependency management and strict symlinked installs, while Turborepo provides task pipelines, dependency-aware builds, and remote-cache-friendly execution across apps, services, and packages.

## Consequences
### Positive
- Shared packages can be changed and consumed in one atomic commit.
- CI and local development benefit from workspace-aware installs and cached task execution.
- Refactors across frontend apps, backend services, and infrastructure stay coordinated.
- Dependency duplication is reduced through pnpm's content-addressable store.
### Negative
- Repository tooling is more complex than a single-package setup.
- CI configuration and task graphs must be maintained carefully as the workspace grows.
- Large monorepos can create broader blast radius if branch discipline is poor.
### Neutral
- Teams still need clear ownership boundaries even inside one repository.
- Some tools require extra workspace configuration to work correctly in a monorepo.

## Alternatives Considered
We considered separate repositories per service, which would isolate change history but make shared package evolution and cross-cutting refactors slower. We also considered npm or Yarn workspaces; pnpm was preferred for stricter dependency resolution, disk efficiency, and strong workspace support. Running a monorepo without Turborepo was rejected because we wanted explicit task pipelines and better CI build caching.
