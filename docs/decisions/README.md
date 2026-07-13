# Architecture Decision Records (ADR) Guide

- **Purpose**: Explains when ADRs are required, how to write them, and provides a standard template.
- **Scope**: Architectural change management process.
- **Related Documents**: [Architecture Rules](../standards/architecture_rules.md)
- **Last Updated**: 2026-07-13

---

## Architecture Decision Records (ADRs)

An Architecture Decision Record (ADR) is a document that captures an important architectural decision, including its context, rationale, and consequences.

### When is an ADR required?
An ADR MUST be created and approved by the architecture lead or team before making any changes that:
1. **Violate or modify** any of the rules defined in the [Architecture Constitution](../standards/architecture_rules.md).
2. **Introduce new core frameworks or technologies** (e.g., changing Prisma to Drizzle, or adding a new database engine).
3. **Change core system behaviors** (e.g., altering the multi-tenant partition strategy, swapping the auth provider, changing the payment flow).
4. **Make major changes to API versioning or request lifecycle layer orders.**

### Workflow
1. Propose: Create a new markdown file named `ADR-[Number]-[Short-Description].md` inside the `docs/decisions/` folder.
2. Review: Present the draft ADR to the team/reviewers.
3. Status: Mark the status as `PROPOSED`, `ACCEPTED`, `REJECTED`, or `SUPERSEDED`.
4. Merge: Once accepted, merge the file.

---

## ADR Markdown Template

Use the following template for all future ADR documents:

```markdown
# ADR [Number]: [Decision Title]

- **Date**: [YYYY-MM-DD]
- **Status**: [PROPOSED / ACCEPTED / REJECTED / SUPERSEDED]
- **Authors**: [Name, Title]

## Context
Provide background context about the problem we are trying to solve. Why is a decision required? What are the constraints, requirements, and alternatives considered?

## Decision
What is the chosen action/decision? State the decision clearly. If this violates or modifies an existing architectural rule, specify which one and why.

## Rationale
Why did we choose this approach over the alternatives? What data, benchmarks, or architectural principles support this decision?

## Consequences
What are the consequences of this decision? What is the impact on:
- Future development?
- System performance or security?
- Operational costs?
- Training or developer workflow?
```

# 274. Architecture Decision Records (ADR)

Significant architectural decisions should be documented.

Examples

Switching ORM

Introducing Redis

Adding Queue System

Migrating Storage

Moving to Microservices

Every major decision requires an ADR.

---