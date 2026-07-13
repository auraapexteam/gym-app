# Architecture Rules & Platform Constitution

- **Purpose**: The mandatory platform constitution containing the final rules of development and the engineering oath.
- **Scope**: Core architectural guidelines and strict development constraints.
- **Related Documents**: [Coding Standards](./coding_standards.md), [ADR Guide](../decisions/README.md)
- **Last Updated**: 2026-07-13

---

# 35. Architecture Rule

When adding a new feature,

Ask

"Which module owns this?"

If the answer is unclear,

The architecture is wrong.

Every feature must have exactly one owner.

This rule prevents duplicated logic and spaghetti code.

# Part 3 — Express Application Architecture

---

# 275. Project Success Metrics

The backend is considered successful when

New modules require minimal changes.

Features remain isolated.

Testing is straightforward.

Developers onboard quickly.

Performance scales predictably.

Security incidents are minimized.

Production deployments are routine.

---

# 276. Final Architecture Rules

These rules are absolute.

1.

Controllers never contain business logic.

2.

Services own business logic.

3.

Repositories own persistence.

4.

Validation happens before controllers.

5.

Authentication before authorization.

6.

Every request is logged.

7.

Every write is auditable.

8.

Every feature belongs to one module.

9.

Every module is independently maintainable.

10.

Every API is versioned.

11.

Every response follows one format.

12.

Every business rule exists in exactly one place.

13.

Every database change uses migrations.

14.

Every secret stays outside the codebase.

15.

Every engineer leaves the project better than they found it.

---

# 277. The Aura Apex Engineering Oath

We build software that is:

Reliable.

Maintainable.

Scalable.

Secure.

Readable.

Testable.

Documented.

Modular.

Future-ready.

We optimize for long-term success over short-term convenience.

Every line of code should make the next engineer's job easier—not harder.

That is the standard of Aura Apex.