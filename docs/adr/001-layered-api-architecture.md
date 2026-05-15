# ADR-001: Layered API Architecture

- **Status:** Accepted
- **Date:** 2026-05-15
- **Deciders:** Team (PR review agent test repo)

## Context

This repository provides a minimal **Item CRUD API** for testing context-aware PR reviews. Without clear boundaries, changes tend to mix HTTP concerns, validation, and persistence in a single file — making reviews noisy and allowing regressions the agent cannot attribute to a rule.

We need a structure that:

1. Mirrors how production Node services in the org are organized
2. Gives the PR review agent concrete layers to reference in feedback
3. Stays small enough for a sample repo (no ORM, no framework)

## Decision

Adopt a **strict three-layer architecture** for all application code under `src/`:

```
app.js (transport) → controllers → services → store
```

### Rules

1. **`app.js`** owns HTTP server creation, route matching, and JSON body parsing only.
2. **`controllers/`** translate HTTP requests to service calls and map results to status codes via `http-response` helpers. No validation logic.
3. **`services/`** own validation, business rules, and domain errors (`err.code`).
4. **`store/`** owns in-memory persistence (`Map`). No knowledge of HTTP.

### Dependency direction

Dependencies flow **inward** only:

- Controllers may import services and `http-response`
- Services may import store
- Store imports nothing from upper layers

**Forbidden:** `import` of `store/` from `controllers/` or `app.js`.

## Consequences

### Positive

- Review feedback can cite a specific layer (“move validation to service”)
- Unit tests can target services without spinning up HTTP
- Aligns with CONVENTIONS.md and automated review prompts

### Negative

- More files than a single-file demo
- Slightly more boilerplate for trivial CRUD

### Neutral

- When the app outgrows in-memory storage, only `store/` (or a new `repositories/` layer) should change; services keep the same interface

## Examples

**Compliant — controller:**

```javascript
export async function createItem(req, res, next) {
  try {
    const item = itemService.createItem(req.body ?? {});
    sendJson(res, 201, { data: item });
  } catch (err) {
    next(err);
  }
}
```

**Non-compliant — controller with validation:**

```javascript
if (!req.body.name) {
  sendJson(res, 400, { error: "name required" }); // belongs in service
}
```

## Related

- `CONVENTIONS.md` — Architecture section
- ADR-002 — Error response contract
