# ADR-008: Next.js Customer Web
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
The customer-facing web app must support SEO-friendly vendor discovery, fast first loads, modern routing, rich client interactions, and flexible data fetching. We needed a framework that balances server-rendered discovery pages with interactive booking flows and shared component development in the monorepo.

## Decision
We will build the customer web application with Next.js 14 using the App Router. This gives us server components where appropriate, nested layouts, improved routing ergonomics, and strong support for hybrid rendering across content-heavy and transactional pages.

## Consequences
### Positive
- SEO and performance are improved for discovery pages through server rendering options.
- App Router layouts and loading states support complex multi-page UX cleanly.
- The framework integrates well with React, TypeScript, and the monorepo toolchain.
- Hybrid rendering allows us to mix static, server, and client-driven experiences.
### Negative
- App Router introduces a learning curve and some framework-specific conventions.
- Debugging boundaries between server and client components requires discipline.
- Some libraries still assume purely client-rendered React patterns.
### Neutral
- Interactive checkout and dashboard features still require clear client-side state boundaries.
- The admin and vendor portals may use different frontend stacks when their requirements differ.

## Alternatives Considered
We considered a plain React SPA with Vite, which would simplify hosting but provide weaker SEO and fewer server-rendering options for vendor discovery. We also considered Remix, but Next.js had stronger ecosystem support, clearer alignment with our component model, and better fit for our hybrid rendering needs.
