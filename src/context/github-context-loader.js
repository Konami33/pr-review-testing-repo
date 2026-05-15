/**
 * Repository-specific GitHub context loader for the PR review agent.
 * Fetches CONVENTIONS.md, docs/adr/*.md, REVIEW_NOTES.md, and paginated PR file diffs.
 *
 * @see README.md §5.4
 */

import { decodeFileContent, githubGet } from "./github-api.js";

const CONTEXT_PATHS = {
  conventions: "CONVENTIONS.md",
  reviewNotes: "REVIEW_NOTES.md",
  adrDir: "docs/adr",
};

const ADR_FILENAME_PATTERN = /^\d{3}-.+\.md$/i;

/**
 * @typedef {object} RepoContext
 * @property {string|null} conventions
 * @property {string|null} reviewNotes
 * @property {{ filename: string; content: string }[]} adrs
 * @property {object[]} prFiles
 * @property {{ conventions: boolean; reviewNotes: boolean; adrs: number; prFiles: number }} found
 */

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 */
function repoBase(owner, repo) {
  return `/repos/${owner}/${repo}`;
}

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} ref - branch or commit SHA
 * @param {string} token
 */
async function fetchRepoFile(owner, repo, path, ref, token) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const result = await githubGet(
    token,
    `${repoBase(owner, repo)}/contents/${encoded}${query}`
  );

  if (result.notFound) return null;
  if (Array.isArray(result.data)) return null;
  return decodeFileContent(result.data);
}

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref
 * @param {string} token
 */
async function fetchAdrDocuments(owner, repo, ref, token) {
  const encodedDir = CONTEXT_PATHS.adrDir.split("/").map(encodeURIComponent).join("/");
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const listing = await githubGet(
    token,
    `${repoBase(owner, repo)}/contents/${encodedDir}${query}`
  );

  if (listing.notFound || !Array.isArray(listing.data)) {
    return [];
  }

  const mdFiles = listing.data
    .filter((entry) => entry.type === "file" && ADR_FILENAME_PATTERN.test(entry.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  const adrs = [];
  for (const entry of mdFiles) {
    const content = await fetchRepoFile(owner, repo, entry.path, ref, token);
    if (content) {
      adrs.push({ filename: entry.name, content });
    }
  }
  return adrs;
}

/**
 * Paginate GET /pulls/{pr}/files until a page has fewer than per_page results.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {number} pullNumber
 * @param {string} token
 */
export async function fetchPullRequestFiles(owner, repo, pullNumber, token) {
  const perPage = 100;
  const allFiles = [];
  let page = 1;

  while (true) {
    const result = await githubGet(
      token,
      `${repoBase(owner, repo)}/pulls/${pullNumber}/files?per_page=${perPage}&page=${page}`
    );

    if (!result.ok) break;
    const batch = result.data;
    if (!Array.isArray(batch) || batch.length === 0) break;

    allFiles.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return allFiles;
}

/**
 * Load all repository-specific context for a PR review.
 *
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.pullNumber
 * @param {string} params.headSha - PR head commit (for context file ref)
 * @param {string} params.token - GitHub installation access token
 * @returns {Promise<RepoContext>}
 */
export async function loadRepositoryContext({
  owner,
  repo,
  pullNumber,
  headSha,
  token,
}) {
  const ref = headSha;

  const [conventions, reviewNotes, adrs, prFiles] = await Promise.all([
    fetchRepoFile(owner, repo, CONTEXT_PATHS.conventions, ref, token),
    fetchRepoFile(owner, repo, CONTEXT_PATHS.reviewNotes, ref, token),
    fetchAdrDocuments(owner, repo, ref, token),
    fetchPullRequestFiles(owner, repo, pullNumber, token),
  ]);

  return {
    conventions,
    reviewNotes,
    adrs,
    prFiles,
    found: {
      conventions: conventions !== null,
      reviewNotes: reviewNotes !== null,
      adrs: adrs.length,
      prFiles: prFiles.length,
    },
  };
}

/**
 * Format loaded context into XML-delimited sections for the prompt assembler.
 *
 * @param {RepoContext} context
 * @returns {string}
 */
export function formatContextForPrompt(context) {
  const sections = [];

  if (context.conventions) {
    sections.push(`<conventions>\n${context.conventions}\n</conventions>`);
  }

  if (context.adrs.length > 0) {
    const body = context.adrs
      .map((adr) => `## ${adr.filename}\n\n${adr.content}`)
      .join("\n\n---\n\n");
    sections.push(`<architecture_decisions>\n${body}\n</architecture_decisions>`);
  }

  if (context.reviewNotes) {
    sections.push(`<prior_review_notes>\n${context.reviewNotes}\n</prior_review_notes>`);
  }

  if (context.prFiles.length > 0) {
    const diffBody = context.prFiles
      .map((file) => {
        const header = `### ${file.filename} (${file.status})`;
        const patch = file.patch ? `\n\`\`\`diff\n${file.patch}\n\`\`\`` : "";
        return `${header}${patch}`;
      })
      .join("\n\n");
    sections.push(`<pull_request_diff>\n${diffBody}\n</pull_request_diff>`);
  }

  return sections.join("\n\n");
}

export { CONTEXT_PATHS };
