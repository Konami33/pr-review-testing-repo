/**
 * Load repository context from the local filesystem (for tests and offline dev).
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatContextForPrompt } from "./github-context-loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

const ADR_FILENAME_PATTERN = /^\d{3}-.+\.md$/i;

/**
 * @param {string} [rootDir]
 * @returns {Promise<import("./github-context-loader.js").RepoContext>}
 */
export async function loadLocalRepositoryContext(rootDir = REPO_ROOT) {
  const conventions = await readOptional(path.join(rootDir, "CONVENTIONS.md"));
  const reviewNotes = await readOptional(path.join(rootDir, "REVIEW_NOTES.md"));
  const adrs = await loadLocalAdrs(path.join(rootDir, "docs", "adr"));

  return {
    conventions,
    reviewNotes,
    adrs,
    prFiles: [],
    found: {
      conventions: conventions !== null,
      reviewNotes: reviewNotes !== null,
      adrs: adrs.length,
      prFiles: 0,
    },
  };
}

async function readOptional(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function loadLocalAdrs(adrDir) {
  let names;
  try {
    names = await readdir(adrDir);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }

  const mdFiles = names
    .filter((name) => ADR_FILENAME_PATTERN.test(name))
    .sort((a, b) => b.localeCompare(a));

  const adrs = [];
  for (const filename of mdFiles) {
    const content = await readFile(path.join(adrDir, filename), "utf8");
    adrs.push({ filename, content });
  }
  return adrs;
}

export async function loadAndPrintLocalContext() {
  const context = await loadLocalRepositoryContext();
  console.log(formatContextForPrompt(context));
  console.error(
    JSON.stringify({
      event: "context_loaded",
      ...context.found,
    })
  );
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadAndPrintLocalContext();
}
