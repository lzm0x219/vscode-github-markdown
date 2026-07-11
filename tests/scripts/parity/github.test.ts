import { afterEach, describe, expect, it, vi } from "vitest";
import {
  renderGitHubRepositoryFile,
  renderGitHubMarkdown,
  resolveGitHubRef,
  retryDelayMs
} from "../../../scripts/parity/github";

describe("GitHub repository file renderer", () => {
  afterEach(() => vi.useRealTimers());
  it("extracts the Markdown article from the file-context response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("# Source\n"))
      .mockResolvedValueOnce(
        new Response(
          '<div id="file"><article class="markdown-body entry-content"><p>file context</p></article></div>'
        )
      );

    await expect(
      renderGitHubRepositoryFile("fixtures/a file.md", "# Source\n", fetcher)
    ).resolves.toBe("<p>file context</p>");
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("fixtures/a%20file.md"),
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/vnd.github.html+json" })
      })
    );
  });

  it("preserves nested article elements in the Markdown body", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("source"))
      .mockResolvedValueOnce(
        new Response(
          '<div id="file"><article class="markdown-body"><p>before</p><article><p>nested</p></article><p>after</p></article></div>'
        )
      );

    await expect(renderGitHubRepositoryFile("nested.md", "source", fetcher)).resolves.toBe(
      "<p>before</p><article><p>nested</p></article><p>after</p>"
    );
  });

  it("rejects responses without a Markdown article", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("source"))
      .mockResolvedValueOnce(new Response("<div>missing</div>"));
    await expect(renderGitHubRepositoryFile("missing.md", "source", fetcher)).rejects.toThrow(
      "no Markdown article"
    );
  });

  it("rejects a remote file that does not match the local fixture", async () => {
    const fetcher = vi.fn(async () => new Response("remote source"));
    await expect(renderGitHubRepositoryFile("changed.md", "local source", fetcher)).rejects.toThrow(
      "does not match local Markdown"
    );
  });

  it("retries transient repository API failures", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("source"))
      .mockResolvedValueOnce(
        new Response('<article class="markdown-body"><p>rendered</p></article>')
      );

    await expect(renderGitHubRepositoryFile("retry.md", "source", fetcher)).resolves.toBe(
      "<p>rendered</p>"
    );
  });

  it("resolves a branch name to an immutable commit SHA", async () => {
    const sha = "a".repeat(40);
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ sha }), { headers: { "Content-Type": "application/json" } })
    );

    await expect(resolveGitHubRef("feature/parity", fetcher, "contributor/fork")).resolves.toBe(
      sha
    );
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("repos/contributor/fork/commits/feature%2Fparity"),
      expect.any(Object)
    );
  });

  it("times out and retries requests that never complete", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(
      async (_url: string | URL | Request, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(options.signal?.reason));
        })
    );

    const pending = renderGitHubMarkdown("timeout", fetcher);
    const rejection = expect(pending).rejects.toBeInstanceOf(Error);
    await vi.advanceTimersByTimeAsync(46_000);
    await rejection;
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("keeps the timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(
      async (_url: string | URL | Request, options?: RequestInit) =>
        ({
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () =>
            new Promise<string>((_resolve, reject) => {
              options?.signal?.addEventListener("abort", () => reject(options.signal?.reason));
            })
        }) as Response
    );

    const pending = renderGitHubMarkdown("body timeout", fetcher);
    const rejection = expect(pending).rejects.toBeInstanceOf(Error);
    await vi.advanceTimersByTimeAsync(46_000);
    await rejection;
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("retries only rate-limited 403 responses", async () => {
    const rateLimitedFetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("limited", {
          status: 403,
          headers: { "Retry-After": "0", "X-RateLimit-Remaining": "0" }
        })
      )
      .mockResolvedValueOnce(new Response("rendered"));
    await expect(renderGitHubMarkdown("retry", rateLimitedFetcher)).resolves.toBe("rendered");

    const forbiddenFetcher = vi.fn(
      async () =>
        new Response("forbidden", {
          status: 403,
          headers: {
            "X-RateLimit-Remaining": "42",
            "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1_000) + 60)
          }
        })
    );
    await expect(renderGitHubMarkdown("no retry", forbiddenFetcher)).rejects.toThrow(
      "returned 403"
    );
    expect(forbiddenFetcher).toHaveBeenCalledTimes(1);
  });

  it("reports secondary rate limits without rapidly retrying them", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: "You have exceeded a secondary rate limit." }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "0",
            "X-RateLimit-Remaining": "42"
          }
        })
    );

    await expect(renderGitHubMarkdown("secondary", fetcher)).rejects.toThrow(
      "GitHub Markdown API hit GitHub's secondary rate limit; retry later"
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects oversized response bodies without retrying", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("too large", {
          headers: { "Content-Length": String(6 * 1024 * 1024) }
        })
    );

    await expect(renderGitHubMarkdown("large", fetcher)).rejects.toThrow("exceeds the 5 MiB limit");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("enforces the response limit while streaming an undeclared body", async () => {
    const chunk = new Uint8Array(1024 * 1024);
    const fetcher = vi.fn(async () => {
      let sent = 0;
      return new Response(
        new ReadableStream({
          pull(controller) {
            controller.enqueue(chunk);
            sent += 1;
            if (sent === 6) controller.close();
          }
        })
      );
    });

    await expect(renderGitHubMarkdown("streamed large", fetcher)).rejects.toThrow(
      "exceeds the 5 MiB limit"
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects traversal in repositories and file paths before fetching", async () => {
    const fetcher = vi.fn(async () => new Response("unused"));

    await expect(
      renderGitHubRepositoryFile("fixture.md", "source", fetcher, "main", "owner/..")
    ).rejects.toThrow("Invalid GitHub repository");
    await expect(
      renderGitHubRepositoryFile("fixtures/../secret.md", "source", fetcher)
    ).rejects.toThrow("Invalid GitHub repository path");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("bounds GitHub-requested retry waits", () => {
    expect(
      retryDelayMs(new Response("", { status: 429, headers: { "Retry-After": "60" } }), 1)
    ).toBe(5_000);
    expect(retryDelayMs(new Response("", { status: 503 }), 2)).toBe(200);
    const resetAt = Math.ceil(Date.now() / 1_000) + 60;
    expect(
      retryDelayMs(
        new Response("", { status: 429, headers: { "X-RateLimit-Reset": String(resetAt) } }),
        1
      )
    ).toBe(5_000);
  });
});
