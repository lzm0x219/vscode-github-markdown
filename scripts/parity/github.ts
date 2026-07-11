import { assertGitHubRepository, assertRepositoryPath } from "./repository";

const endpoint = "https://api.github.com/markdown";
const context = "lzm0x219/vscode-github-markdown";
const defaultRepository = "lzm0x219/vscode-github-markdown";
const maxAttempts = 3;
const maxRetryDelayMs = 5_000;
const requestTimeoutMs = 15_000;
const maxResponseBytes = 5 * 1024 * 1024;
const retryableStatuses = new Set([429, 500, 502, 503, 504]);

type Fetcher = typeof fetch;

export async function renderGitHubMarkdown(
  markdown: string,
  fetcher: Fetcher = fetch
): Promise<string> {
  return fetchGitHubText(endpoint, requestOptions(markdown), "GitHub Markdown API", fetcher);
}

export async function renderGitHubRepositoryFile(
  path: string,
  expectedMarkdown: string,
  fetcher: Fetcher = fetch,
  ref = "main",
  repository = defaultRepository
): Promise<string> {
  assertRepositoryPath(path);
  const url = `${repositoryApiBase(repository)}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`;
  const remoteMarkdown = await fetchGitHubText(
    url,
    { headers: repositoryHeaders("application/vnd.github.raw+json") },
    "GitHub Contents API",
    fetcher
  );
  if (remoteMarkdown !== expectedMarkdown) {
    throw new Error(
      `GitHub repository file does not match local Markdown: ${path} at ${ref}. Commit and push the fixture before refreshing the baseline.`
    );
  }
  const body = await fetchGitHubText(
    url,
    { headers: repositoryHeaders("application/vnd.github.html+json") },
    "GitHub Contents API",
    fetcher
  );
  return extractMarkdownArticle(body, path);
}

export async function resolveGitHubRef(
  ref: string,
  fetcher: Fetcher = fetch,
  repository = defaultRepository
): Promise<string> {
  const body = await fetchGitHubText(
    `${repositoryApiBase(repository)}/commits/${encodeURIComponent(ref)}`,
    { headers: repositoryHeaders("application/vnd.github+json") },
    "GitHub Commits API",
    fetcher
  );
  const value = JSON.parse(body) as unknown;
  if (
    typeof value !== "object" ||
    value === null ||
    !("sha" in value) ||
    typeof value.sha !== "string" ||
    !/^[\da-f]{40}$/i.test(value.sha)
  ) {
    throw new Error(`GitHub Commits API returned an invalid SHA for ${ref}`);
  }
  return value.sha;
}

async function fetchGitHubText(
  url: string,
  options: RequestInit,
  label: string,
  fetcher: Fetcher
): Promise<string> {
  let lastNetworkError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    let body: string;
    try {
      ({ response, body } = await fetchTextWithTimeout(url, options, fetcher));
    } catch (error) {
      if (error instanceof GitHubResponseTooLargeError) throw error;
      lastNetworkError = error;
      if (attempt < maxAttempts) {
        await wait(Math.min(attempt * 100, maxRetryDelayMs));
        continue;
      }
      throw error;
    }
    if (response.ok) return body;
    if (isSecondaryRateLimit(response, body)) {
      throw new Error(`${label} hit GitHub's secondary rate limit; retry later`);
    }
    if (attempt < maxAttempts && isRetryableResponse(response)) {
      await wait(retryDelayMs(response, attempt));
      continue;
    }
    throw new Error(`${label} returned ${response.status}: ${body}`);
  }
  throw lastNetworkError;
}

function isSecondaryRateLimit(response: Response, body: string): boolean {
  if (response.status !== 403 && response.status !== 429) return false;
  let message = body;
  try {
    const value = JSON.parse(body) as unknown;
    if (
      typeof value === "object" &&
      value !== null &&
      "message" in value &&
      typeof value.message === "string"
    ) {
      message = value.message;
    }
  } catch {
    // GitHub normally returns JSON errors, but a text response can carry the same diagnosis.
  }
  return /secondary rate limit|abuse detection mechanism/i.test(message);
}

async function fetchTextWithTimeout(
  url: string,
  options: RequestInit,
  fetcher: Fetcher
): Promise<{ response: Response; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`GitHub request timed out after ${requestTimeoutMs} ms`)),
    requestTimeoutMs
  );
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    return { response, body: await readResponseText(response) };
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableResponse(response: Response): boolean {
  if (retryableStatuses.has(response.status)) return true;
  if (response.status !== 403) return false;
  return (
    response.headers.has("Retry-After") || response.headers.get("X-RateLimit-Remaining") === "0"
  );
}

export function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.min(Math.max(0, seconds * 1_000), maxRetryDelayMs);
    }
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.min(Math.max(0, dateDelay), maxRetryDelayMs);
  }
  const rateLimitReset = Number(response.headers.get("X-RateLimit-Reset"));
  if (Number.isFinite(rateLimitReset) && rateLimitReset > 0) {
    return Math.min(Math.max(0, rateLimitReset * 1_000 - Date.now()), maxRetryDelayMs);
  }
  return Math.min(100 * 2 ** (attempt - 1), maxRetryDelayMs);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function repositoryHeaders(accept: string): HeadersInit {
  return {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env["GITHUB_TOKEN"]
      ? { Authorization: `Bearer ${process.env["GITHUB_TOKEN"]}` }
      : {})
  };
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function repositoryApiBase(repository: string): string {
  assertGitHubRepository(repository);
  return `https://api.github.com/repos/${repository}`;
}

function extractMarkdownArticle(body: string, path: string): string {
  const opening =
    /<article\b(?=[^>]*\bclass=(?:"[^"]*\bmarkdown-body\b[^"]*"|'[^']*\bmarkdown-body\b[^']*'))[^>]*>/i.exec(
      body
    );
  if (!opening || opening.index === undefined) {
    throw new Error(`GitHub file response has no Markdown article: ${path}`);
  }

  const contentStart = opening.index + opening[0].length;
  const articleTag = /<\/?article\b[^>]*>/gi;
  let depth = 1;
  for (const match of body.slice(contentStart).matchAll(articleTag)) {
    const tagIndex = contentStart + (match.index ?? 0);
    if (/^<\/article/i.test(match[0])) {
      depth -= 1;
      if (depth === 0) return body.slice(contentStart, tagIndex);
    } else {
      depth += 1;
    }
  }
  throw new Error(`GitHub file response has no complete Markdown article: ${path}`);
}

async function readResponseText(response: Response): Promise<string> {
  const contentLength = response.headers.get("Content-Length");
  const declaredBytes = contentLength === null ? Number.NaN : Number(contentLength);
  if (Number.isFinite(declaredBytes) && declaredBytes > maxResponseBytes) {
    throw new GitHubResponseTooLargeError();
  }
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) return body + decoder.decode();
    bytesRead += value.byteLength;
    if (bytesRead > maxResponseBytes) {
      void reader.cancel();
      throw new GitHubResponseTooLargeError();
    }
    body += decoder.decode(value, { stream: true });
  }
}

class GitHubResponseTooLargeError extends Error {
  constructor() {
    super("GitHub response exceeds the 5 MiB limit");
    this.name = "GitHubResponseTooLargeError";
  }
}

function requestOptions(markdown: string): RequestInit {
  return {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(process.env["GITHUB_TOKEN"]
        ? { Authorization: `Bearer ${process.env["GITHUB_TOKEN"]}` }
        : {})
    },
    body: JSON.stringify({ text: markdown, mode: "gfm", context })
  };
}
