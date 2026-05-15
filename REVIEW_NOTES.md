# Review Notes — pr-review-testing-repo

Running log of review guidance for this test repository. The PR review agent includes this file when present.

## Standing guidance

1. **Layer violations are warnings, not nits.** Direct `item-store` imports outside `services/` should be called out with reference to `CONVENTIONS.md` architecture section.

2. **Error shape regressions are critical.** Any response that returns raw `err.message` without the `{ error: { code, message } }` envelope breaks ADR-002.

3. **Do not suggest adding Express** for this repo. The sample intentionally uses `node:http` only.

## Rejected patterns (do not re-introduce)

| Pattern | Why rejected | Alternative |
|---------|--------------|-------------|
| `res.status(200).json(...)` | Express API; we use native `http` | `sendJson` from `src/lib/http-response.js` |
| Mutable exported store arrays | Breaks test isolation | `Map` in store + `resetStore()` |
| `GET /api/items/:id` returning 200 with `null` for missing | Hides client bugs | Throw `NOT_FOUND` in service |

## Prior review themes

- **2026-05:** Initial scaffold — enforce service-layer validation for `name` on POST.
- **2026-05:** Context loader must sort ADRs descending (`010-` before `001-`) so truncation keeps newest decisions.

## When reviewing context-loader changes

- 404 on optional files must not fail the pipeline (graceful omission).
- PR files pagination must loop until `batch.length < per_page` (100).
- All GitHub fetches should respect the 10s timeout in `github-api.js`.

## Tone for automated reviews

- Prefer actionable recommendations tied to a convention name or ADR id
- Mark missing tests for new service behavior as **suggestion**, not critical, unless security-related
