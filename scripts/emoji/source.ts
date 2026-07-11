export type EmojiSourceUrls = {
  githubEmoji: string;
  unicodeEmojiData: string;
  unicodeEmojiVariationSequences: string;
};

export type EmojiSourceTexts = {
  githubEmoji: unknown;
  unicodeEmojiData: string;
  unicodeEmojiVariationSequences: string;
};

type FetchOptions = {
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

const githubEmojiOrigin = "https://github.githubassets.com";
const githubEmojiPath = "/images/icons/emoji/";
const emojiAliasPattern = /^[+\-\w]+$/;

export async function fetchEmojiSourceTexts(
  urls: EmojiSourceUrls,
  options: FetchOptions = {}
): Promise<EmojiSourceTexts> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new Error(`Timed out while fetching emoji sources after ${timeoutMs} ms`));
  }, timeoutMs);

  try {
    const [githubEmoji, unicodeEmojiData, unicodeEmojiVariationSequences] = await Promise.all([
      fetchJson(urls.githubEmoji, fetcher, controller.signal, {
        Accept: "application/vnd.github+json",
        "User-Agent": "vscode-github-markdown"
      }),
      fetchText(urls.unicodeEmojiData, fetcher, controller.signal),
      fetchText(urls.unicodeEmojiVariationSequences, fetcher, controller.signal)
    ]);
    return { githubEmoji, unicodeEmojiData, unicodeEmojiVariationSequences };
  } finally {
    clearTimeout(timeout);
    controller.abort(new Error("Emoji source fetches were cancelled"));
  }
}

export function parseGitHubEmojiMap(value: unknown): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("GitHub emoji response must be an alias-to-URL object");
  }

  const entries = Object.entries(value);
  for (const [alias, rawUrl] of entries) {
    if (!emojiAliasPattern.test(alias) || alias === "__proto__" || typeof rawUrl !== "string") {
      throw new TypeError(`GitHub emoji response contains an invalid alias or URL: ${alias}`);
    }

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new TypeError(`GitHub emoji response contains an invalid URL for alias ${alias}`);
    }
    if (
      url.origin !== githubEmojiOrigin ||
      url.username !== "" ||
      url.password !== "" ||
      !url.pathname.startsWith(githubEmojiPath) ||
      !url.pathname.endsWith(".png")
    ) {
      throw new TypeError(`GitHub emoji response contains an invalid URL for alias ${alias}`);
    }
  }

  return Object.fromEntries(entries) as Record<string, string>;
}

async function fetchJson(
  url: string,
  fetcher: typeof fetch,
  signal: AbortSignal,
  headers: Readonly<Record<string, string>>
): Promise<unknown> {
  const text = await fetchText(url, fetcher, signal, headers);
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new Error(`Failed to parse JSON from ${url}`, { cause });
  }
}

async function fetchText(
  url: string,
  fetcher: typeof fetch,
  signal: AbortSignal,
  headers?: Readonly<Record<string, string>>
): Promise<string> {
  const response = await fetcher(url, { headers: new Headers(headers), signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (HTTP ${response.status} ${response.statusText})`);
  }
  return response.text();
}
