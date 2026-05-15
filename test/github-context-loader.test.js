import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadLocalRepositoryContext } from "../src/context/load-local-context.js";
import { formatContextForPrompt, CONTEXT_PATHS } from "../src/context/github-context-loader.js";

describe("github-context-loader (local)", () => {
  it("loads conventions, review notes, and ADRs from repo root", async () => {
    const context = await loadLocalRepositoryContext();

    assert.equal(context.found.conventions, true);
    assert.equal(context.found.reviewNotes, true);
    assert.ok(context.found.adrs >= 2);
    assert.match(context.conventions, /three-layer/i);
    assert.ok(context.adrs[0].filename >= context.adrs[1].filename);
  });

  it("formats XML-delimited sections for prompt assembly", async () => {
    const context = await loadLocalRepositoryContext();
    const prompt = formatContextForPrompt(context);

    assert.match(prompt, /<conventions>/);
    assert.match(prompt, /<architecture_decisions>/);
    assert.match(prompt, /<prior_review_notes>/);
    assert.match(prompt, /001-layered-api-architecture/);
  });

  it("exports expected context paths", () => {
    assert.equal(CONTEXT_PATHS.conventions, "CONVENTIONS.md");
    assert.equal(CONTEXT_PATHS.adrDir, "docs/adr");
  });
});
