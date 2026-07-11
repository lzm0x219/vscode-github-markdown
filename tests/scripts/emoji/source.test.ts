import { describe, expect, it, vi } from "vitest";
import { fetchEmojiSourceTexts, parseGitHubEmojiMap } from "../../../scripts/emoji/source";

const urls = {
  githubEmoji: "https://api.github.com/emojis",
  unicodeEmojiData: "https://unicode.org/emoji-data.txt",
  unicodeEmojiVariationSequences: "https://unicode.org/emoji-variation-sequences.txt"
};

describe("parseGitHubEmojiMap", () => {
  it("accepts GitHub emoji aliases and asset URLs", () => {
    expect(
      parseGitHubEmojiMap({
        "+1": "https://github.githubassets.com/images/icons/emoji/unicode/1f44d.png?v8",
        shipit: "https://github.githubassets.com/images/icons/emoji/shipit.png?v8"
      })
    ).toEqual({
      "+1": "https://github.githubassets.com/images/icons/emoji/unicode/1f44d.png?v8",
      shipit: "https://github.githubassets.com/images/icons/emoji/shipit.png?v8"
    });
  });

  it.each([
    ["invalid alias", { "not an alias": validEmojiUrl("1f680") }],
    ["non-HTTPS URL", { rocket: "http://github.githubassets.com/images/icons/emoji/rocket.png" }],
    ["unexpected host", { rocket: "https://example.com/images/icons/emoji/rocket.png" }],
    ["unexpected path", { rocket: "https://github.githubassets.com/assets/rocket.png" }],
    [
      "unexpected file type",
      { rocket: "https://github.githubassets.com/images/icons/emoji/rocket.svg" }
    ]
  ])("rejects an %s", (_case, value) => {
    expect(() => parseGitHubEmojiMap(value)).toThrow("GitHub emoji response contains an invalid");
  });
});

describe("fetchEmojiSourceTexts", () => {
  it("aborts all requests when the shared timeout expires", async () => {
    const fetcher = vi.fn<typeof fetch>((_input, init) => abortedResponse(init?.signal));

    await expect(fetchEmojiSourceTexts(urls, { fetcher, timeoutMs: 5 })).rejects.toThrow(
      "Timed out while fetching emoji sources after 5 ms"
    );
  });

  it("cancels remaining requests when one request fails", async () => {
    let abortedRequests = 0;
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      if (requestUrl(input) === urls.githubEmoji) {
        return Promise.resolve(new Response("failure", { status: 503, statusText: "Unavailable" }));
      }
      return abortedResponse(init?.signal).catch((error) => {
        abortedRequests += 1;
        throw error;
      });
    });

    await expect(fetchEmojiSourceTexts(urls, { fetcher })).rejects.toThrow(
      "Failed to fetch https://api.github.com/emojis (HTTP 503 Unavailable)"
    );
    await Promise.resolve();
    expect(abortedRequests).toBe(2);
  });
});

function validEmojiUrl(codepoints: string): string {
  return `https://github.githubassets.com/images/icons/emoji/unicode/${codepoints}.png?v8`;
}

function abortedResponse(signal: AbortSignal | null | undefined): Promise<Response> {
  return new Promise((_resolve, reject) => {
    signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

function requestUrl(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}
