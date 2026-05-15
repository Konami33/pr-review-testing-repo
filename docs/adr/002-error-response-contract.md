# ADR-002: Error Response Contract

- **Status:** Accepted
- **Date:** 2026-05-15
- **Deciders:** Team (PR review agent test repo)

## Context

Clients of the Item CRUD API (tests, scripts, future UI) need predictable error handling. Ad-hoc shapes (`{ message: "..." }`, plain text, or thrown stack traces in JSON) make automated review and client code brittle.

The PR review agent is explicitly eval’d on whether PRs preserve the error envelope defined here.

## Decision

All **non-2xx JSON responses** (except `204 No Content`) MUST use this shape:

```json
{
  "error": {
    "code": "SCREAMING_SNAKE_CASE",
    "message": "Human-readable description safe for clients"
  }
}
```

### Standard error codes

| HTTP | `error.code` | When |
|------|----------------|------|
| 400 | `VALIDATION_ERROR` | Invalid input, malformed JSON |
| 404 | `NOT_FOUND` | Item id does not exist |
| 405 | `METHOD_NOT_ALLOWED` | HTTP verb not supported for route |
| 500 | `INTERNAL_ERROR` | Unexpected failure; generic message only |

### Success shape (for comparison)

```json
{
  "data": { }
}
```

List endpoints return `{ "data": [ ... ] }`.

### Implementation rules

1. Services throw `Error` objects with a string **`code`** property (`err.code = "NOT_FOUND"`).
2. `error-handler` middleware maps `err.code` → HTTP status; unknown codes → 500.
3. For **500** responses, the message exposed to clients is always `"Internal server error"` — log the real error server-side only.
4. **`DELETE` success** returns **204** with an empty body (no JSON).

## Consequences

### Positive

- Single place (`error-handler.js`) controls status mapping
- Review agent can flag envelope regressions as ADR-002 violations
- Consistent with org-wide API guidelines used in larger services

### Negative

- Slightly more verbose than returning raw errors
- Requires discipline when adding new error types (define code + status mapping)

## Examples

**Compliant — service:**

```javascript
const err = new Error(`Item not found: ${id}`);
err.code = "NOT_FOUND";
throw err;
```

**Non-compliant — controller:**

```javascript
sendJson(res, 404, { message: "not found" });
```

**Non-compliant — leaking internals:**

```javascript
sendJson(res, 500, { error: { code: "INTERNAL_ERROR", message: err.stack } });
```

## Extension process

New error codes require:

1. Entry in the table above (or addendum to this ADR)
2. Mapping in `ERROR_STATUS` in `error-handler.js`
3. Mention in `CONVENTIONS.md` if user-facing

## Related

- ADR-001 — Layered API Architecture
- `REVIEW_NOTES.md` — Error shape regressions marked critical
