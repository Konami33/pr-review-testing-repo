# Engineering Conventions — pr-review-testing-repo

This repository is a **Node.js Item CRUD API** used to test the PR review agent’s context-aware reviews. Follow these conventions in every change.

## Architecture

Use a strict **three-layer** flow. Do not skip layers.

```
HTTP (app.js) → controllers/ → services/ → store/
```

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| `src/app.js` | Routing, JSON body parsing, health check | Business logic, direct store access |
| `src/controllers/` | Map HTTP to service calls, set status codes | Validation rules, persistence logic |
| `src/services/` | Validation, orchestration, domain errors | `res.writeHead` or raw HTTP |
| `src/store/` | In-memory persistence only | HTTP or validation |

**Rejected pattern:** importing `item-store` from controllers or `app.js`. Always go through `item-service`.

## API design

- Base path for resources: `/api/items`
- Success responses wrap entities in `{ "data": ... }`
- Errors use `{ "error": { "code": "...", "message": "..." } }` (see ADR-002)
- Use correct HTTP verbs: `GET` list/read, `POST` create, `PUT` full update, `DELETE` remove
- `DELETE` returns **204** with no body on success

## Naming

- Files: `kebab-case.js` (e.g. `item-service.js`)
- Functions: `camelCase` verbs (`getItem`, `createItem`)
- Error codes: `SCREAMING_SNAKE_CASE` (`NOT_FOUND`, `VALIDATION_ERROR`)

## Validation

- Required fields and types are validated in the **service layer**, not in controllers
- Trim string fields (`name`, `description`) in services before persisting
- `name` is required on create; optional on update

## Context files for PR review

The review agent loads these paths from the repo (see `src/context/github-context-loader.js`):

| Path | Purpose |
|------|---------|
| `CONVENTIONS.md` | This file |
| `docs/adr/*.md` | Architecture decisions (`NNN-title.md`) |
| `REVIEW_NOTES.md` | Prior review guidance |

ADR filenames **must** use a numeric prefix: `001-short-title.md`, `002-...`. Newest-first truncation uses descending sort on the filename.

## Testing

- Use Node’s built-in test runner (`node --test`)
- Reset store between tests via `item-store.resetStore()`
- Prefer testing services directly; use HTTP integration tests sparingly

## Dependencies

- **No new runtime dependencies** without an ADR
- Use Node 18+ built-ins only (`node:http`, `node:fs/promises`, native `fetch` for GitHub API)

## Logging

- Structured one-line JSON logs for operational events
- Do not log full request bodies (may contain sensitive data)

## Security

- Never commit tokens, `.env` files, or GitHub App private keys
- GitHub context loader tokens are passed in at runtime only
