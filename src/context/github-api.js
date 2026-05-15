const GITHUB_API = "https://api.github.com";
const DEFAULT_TIMEOUT_MS = 10_000;

export class GitHubApiError extends Error {
  constructor(message, { status, url }) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.url = url;
  }
}

/**
 * @param {string} token - GitHub installation or PAT with repo read access
 * @param {string} path - API path starting with /
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function githubGet(token, path, options = {}) {
  const url = path.startsWith("http") ? path : `${GITHUB_API}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const signal = options.signal ?? controller.signal;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (res.status === 404) {
      return { ok: false, notFound: true, status: 404 };
    }

    if (!res.ok) {
      throw new GitHubApiError(`GitHub API ${res.status}: ${path}`, {
        status: res.status,
        url,
      });
    }

    const data = await res.json();
    return { ok: true, data, link: res.headers.get("link") };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Decode base64 content from GitHub Contents API response.
 * @param {{ content?: string; encoding?: string }} file
 */
export function decodeFileContent(file) {
  if (!file?.content || file.encoding !== "base64") return "";
  return Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
}
