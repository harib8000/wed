# ADR-005: Elasticsearch Search
**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Engineering team

## Context
Vendor discovery is a core customer journey and requires full-text search, multi-field filtering, relevance ranking, faceting, typo tolerance, and future autocomplete capabilities. Relational queries alone are not ideal for combining text relevance with category, city, price, and rating filters at marketplace scale.

## Decision
We will use Elasticsearch as the dedicated search engine for vendor search and discovery features. PostgreSQL remains the source of truth, while vendor records are indexed into Elasticsearch for query-time relevance and aggregations.

## Consequences
### Positive
- Full-text relevance, faceting, and autocomplete are better supported than in a general-purpose relational database.
- Search queries can combine structured filters with ranking efficiently.
- The platform can evolve toward suggestions, synonyms, and richer search analytics.
- Read-heavy discovery traffic is isolated from transactional databases.
### Negative
- Search indexing introduces eventual consistency between source data and search results.
- Operating Elasticsearch adds infrastructure cost and tuning complexity.
- Query mappings and analyzers require careful maintenance as the domain evolves.
### Neutral
- Reindexing workflows become part of operational playbooks.
- Some low-volume or exact-match lookups may still be served directly from PostgreSQL.

## Alternatives Considered
We considered PostgreSQL full-text search for simplicity, but it was less compelling for richer marketplace relevance, facets, and autocomplete. We also considered Meilisearch and OpenSearch; Elasticsearch was chosen for its mature ecosystem, broad familiarity, and fit with our expected search capabilities.
