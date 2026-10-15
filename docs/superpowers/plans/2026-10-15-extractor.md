# Class-based Text Extractor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local Next.js app with two inputs (URL and CSS classes) that lists the direct text of every matching `div`, with a copy button per item.

**Architecture:** A `POST /api/extract` Route Handler downloads the HTML on the server and delegates to the pure function `extractTexts` (cheerio). The page is a Tailwind client component that calls the endpoint and renders the list.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, cheerio, vitest.

**Spec:** `docs/superpowers/specs/2026-10-15-extractor-design.md`

## Global Constraints

- Project lives in `/Users/yanvallejo/Documents/dev/extractor-name` (own git repo already initialized; do not use the repo at `/Users/yanvallejo`).
- **Everything in English:** code, comments, identifiers, tests, UI copy, error messages, docs and commit messages.
- Local only; no abuse protection (noted as pending for Vercel).
- Server-rendered HTML only; no headless browser.
- Only the direct text of the `div` is extracted (the child `<p>` is ignored); whitespace collapsed, empties dropped, duplicates removed preserving order.
- `fetch` with a browser `User-Agent` and a 15 s timeout.
- Minimal Tailwind styling; a copy icon per item, a check for ~1.5 s after copying; a "Copy all" button (one item per line).
- Deviation from the spec's first draft (decided while planning, now reflected in the spec): classes are matched by comparing tokens of the `class` attribute in code, not with an escaped CSS selector. Equivalent, and avoids problems with classes like `2xl:flex` or `w-1/2`.

## Review Focus

1. The user pastes the URL without a protocol (`hardfacetechnologies.com/...`): it must work by prepending `https://`. (Task 2)
2. The user pastes the classes with quotes or `class="..."`, a leading dot, or newlines/multiple spaces: they must be normalized. (Task 1)
3. Classes containing `:`, `/` or `.`, or starting with a digit (`md:flex`, `w-1/2`, `2xl:p-4`, `w-1.5`): they must match without breaking anything. (Task 1)
4. HTML entities in the text (`&amp;`) and divs with extra classes beyond the requested ones: entities are decoded and the div still matches (matching means "contains all"). (Task 1)
5. A site that returns an error, is not HTML, or has no matches: a clear message, not a silent empty list or a crash. (Task 2)

---

### Task 1: Scaffold + extraction functions

**Files:**
- Create: Next.js project at the repo root (`package.json`, `app/`, etc., via create-next-app)
- Create: `lib/extract.ts`
- Test: `lib/extract.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (`test` script)

**Interfaces:**
- Produces: `parseClasses(input: string): string[]` and `extractTexts(html: string, classes: string[]): string[]`

- [ ] **Step 1: Scaffold Next.js in the folder (it already contains `docs/`)**

```bash
cd /Users/yanvallejo/Documents/dev/extractor-name
npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
npm install cheerio
npm install -D vitest
```

If create-next-app refuses because the folder is not empty, create the project in a temporary directory and copy its contents (except `.git`) to the root. Confirm that `.gitignore` includes `node_modules` and `.next`. Add to `scripts` in `package.json`: `"test": "vitest run"`.

- [ ] **Step 2: Vitest config**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
```

- [ ] **Step 3: Write the failing tests**

`lib/extract.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractTexts, parseClasses } from "./extract";

const SAMPLE = `
<div class="flex-1 px-4 py-4 text-xl leading-tight">
                27 Flux-coated Electrode

                    <p class="my-2 text-sm text-gray-700 break-word">
                            Hardfacing Electrodes,                            Build-Up Alloy Electrodes                      </p>
                    </div>`;

describe("parseClasses", () => {
  it("splits on spaces and newlines", () => {
    expect(parseClasses("  flex-1  px-4\npy-4 ")).toEqual(["flex-1", "px-4", "py-4"]);
  });
  it("strips a leading dot from each class", () => {
    expect(parseClasses(".flex-1 .px-4")).toEqual(["flex-1", "px-4"]);
  });
  it("strips quotes and a class= prefix", () => {
    expect(parseClasses('class="flex-1 px-4"')).toEqual(["flex-1", "px-4"]);
    expect(parseClasses("'flex-1 px-4'")).toEqual(["flex-1", "px-4"]);
  });
  it("returns [] for blank input", () => {
    expect(parseClasses("   ")).toEqual([]);
  });
});

describe("extractTexts", () => {
  const classes = ["flex-1", "px-4", "py-4", "text-xl", "leading-tight"];

  it("returns only the direct text and ignores the <p>", () => {
    expect(extractTexts(SAMPLE, classes)).toEqual(["27 Flux-coated Electrode"]);
  });

  it("keeps order and removes duplicates", () => {
    const html = `
      <div class="a b">One</div>
      <div class="a b">Two</div>
      <div class="a b">One</div>`;
    expect(extractTexts(html, ["a", "b"])).toEqual(["One", "Two"]);
  });

  it("matches divs with extra classes in any order", () => {
    const html = `<div class="z b extra a">Hit</div>`;
    expect(extractTexts(html, ["a", "b"])).toEqual(["Hit"]);
  });

  it("does not match when a class is missing", () => {
    expect(extractTexts(`<div class="a">Nope</div>`, ["a", "b"])).toEqual([]);
  });

  it("ignores elements that are not divs", () => {
    expect(extractTexts(`<span class="a b">Nope</span>`, ["a", "b"])).toEqual([]);
  });

  it("supports classes with :, /, . and a leading digit", () => {
    const html = `<div class="md:flex w-1/2 w-1.5 2xl:p-4">Hit</div>`;
    expect(extractTexts(html, ["md:flex", "w-1/2", "w-1.5", "2xl:p-4"])).toEqual(["Hit"]);
  });

  it("decodes HTML entities and collapses whitespace", () => {
    const html = `<div class="a">  Tom &amp;\n   Jerry  </div>`;
    expect(extractTexts(html, ["a"])).toEqual(["Tom & Jerry"]);
  });

  it("drops divs without direct text", () => {
    expect(extractTexts(`<div class="a"><p>child only</p></div>`, ["a"])).toEqual([]);
  });

  it("returns [] for an empty class list", () => {
    expect(extractTexts(`<div class="a">x</div>`, [])).toEqual([]);
  });
});
```

- [ ] **Step 4: Verify they fail**

Run: `npm test`
Expected: FAIL (`./extract` does not exist).

- [ ] **Step 5: Minimal implementation**

`lib/extract.ts`:

```ts
import * as cheerio from "cheerio";

// Normalizes pasted class input: tolerates `class="..."`, quotes and leading dots.
export function parseClasses(input: string): string[] {
  return input
    .replace(/class\s*=/i, " ")
    .replace(/["']/g, " ")
    .split(/\s+/)
    .map((c) => c.replace(/^\./, ""))
    .filter(Boolean);
}

// Returns the direct text of every <div> that has ALL the given classes.
// Matching compares class tokens instead of using a CSS selector, so classes
// like `md:flex` or `2xl:p-4` need no escaping.
export function extractTexts(html: string, classes: string[]): string[] {
  if (classes.length === 0) return [];
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const result: string[] = [];

  $("div").each((_, el) => {
    const tokens = ($(el).attr("class") ?? "").split(/\s+/);
    if (!classes.every((c) => tokens.includes(c))) return;

    const text = $(el)
      .contents()
      .filter((_, node) => node.type === "text")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (text && !seen.has(text)) {
      seen.add(text);
      result.push(text);
    }
  });

  return result;
}
```

- [ ] **Step 6: Verify they pass**

Run: `npm test`
Expected: PASS (all tests).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app and add extractTexts with tests"
```

---

### Task 2: `POST /api/extract` endpoint

**Files:**
- Create: `lib/url.ts`
- Test: `lib/url.test.ts`
- Create: `app/api/extract/route.ts`

**Interfaces:**
- Consumes: `parseClasses`, `extractTexts` from `lib/extract.ts`
- Produces: `normalizeUrl(input: string): string | null`; endpoint `POST /api/extract` with body `{ url: string, classes: string }`. 200 response: `{ items: string[] }`. Errors: `{ error: string }` with status 400 (invalid input), 422 (zero matches) or 502 (page unreachable / non-OK status).

- [ ] **Step 1: Failing tests for `normalizeUrl`**

`lib/url.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeUrl } from "./url";

describe("normalizeUrl", () => {
  it("keeps an https URL unchanged", () => {
    expect(normalizeUrl("https://a.com/x")).toBe("https://a.com/x");
  });
  it("prepends https:// when the protocol is missing", () => {
    expect(normalizeUrl("a.com/x")).toBe("https://a.com/x");
  });
  it("trims whitespace", () => {
    expect(normalizeUrl("  http://a.com  ")).toBe("http://a.com/");
  });
  it("rejects non-http(s) protocols", () => {
    expect(normalizeUrl("ftp://a.com")).toBeNull();
    expect(normalizeUrl("file:///etc/passwd")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });
  it("rejects empty and garbage input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});
```

- [ ] **Step 2: Verify they fail**

Run: `npm test`
Expected: FAIL (`./url` does not exist).

- [ ] **Step 3: Implement `normalizeUrl`**

`lib/url.ts`:

```ts
// Returns a normalized http(s) URL, or null if the input is not a usable URL.
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Has a scheme (but `host:port` is not a scheme) -> keep; otherwise assume https.
  const hasScheme =
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^[^/]+:\d+(\/|$)/.test(trimmed);
  const withProtocol = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Verify they pass**

Run: `npm test`
Expected: PASS. If any `url.test.ts` case fails, fix the implementation (not the test) until all pass.

- [ ] **Step 5: Route handler**

`app/api/extract/route.ts`:

```ts
import { NextResponse } from "next/server";
import { extractTexts, parseClasses } from "@/lib/extract";
import { normalizeUrl } from "@/lib/url";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let body: { url?: unknown; classes?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const url = typeof body.url === "string" ? normalizeUrl(body.url) : null;
  if (!url) return fail("The URL is not valid (it must be http or https).", 400);

  const classes = typeof body.classes === "string" ? parseClasses(body.classes) : [];
  if (classes.length === 0) return fail("Enter at least one class.", 400);

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return fail(`The page responded with error ${res.status}.`, 502);
    html = await res.text();
  } catch {
    return fail("Could not download the page (no response or timed out).", 502);
  }

  const items = extractTexts(html, classes);
  if (items.length === 0) {
    return fail(
      "No div with those classes was found. If the page loads its content with JavaScript, this tool will not see it.",
      422,
    );
  }

  return NextResponse.json({ items });
}
```

- [ ] **Step 6: Verify the endpoint manually**

```bash
npm run dev &
sleep 6
curl -s -X POST localhost:3000/api/extract -H 'content-type: application/json' \
  -d '{"url":"hardfacetechnologies.com/industry/sugar-cane-processing-1","classes":"flex-1 px-4 py-4 text-xl leading-tight"}'
```
Expected: JSON `{"items":[...]}` with 22 elements, one of them `27 Flux-coated Electrode` (without the category text).

```bash
curl -s -w '\n%{http_code}\n' -X POST localhost:3000/api/extract -H 'content-type: application/json' -d '{"url":"ftp://x.com","classes":"a"}'
curl -s -w '\n%{http_code}\n' -X POST localhost:3000/api/extract -H 'content-type: application/json' -d '{"url":"https://example.com","classes":"nope"}'
curl -s -w '\n%{http_code}\n' -X POST localhost:3000/api/extract -H 'content-type: application/json' -d '{"url":"https://example.com/404-xyz","classes":"a"}'
```
Expected: 400, 422 and 502 with their messages. Stop the dev server afterwards (`kill %1`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add /api/extract endpoint and URL normalization"
```

---

### Task 3: UI

**Files:**
- Modify: `app/page.tsx` (replace the generated content)
- Modify: `app/layout.tsx` (only `metadata.title` → `"Extractor"`)

**Interfaces:**
- Consumes: `POST /api/extract` (contract from Task 2)

- [ ] **Step 1: Page**

`app/page.tsx`:

```tsx
"use client";

import { useState } from "react";

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-green-600">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [classes, setClasses] = useState("");
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | "all" | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setItems(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, classes }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Unknown error.");
      else setItems(data.items);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, key: number | "all") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Extractor</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="URL (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Classes (e.g. flex-1 px-4 py-4 text-xl leading-tight)"
          value={classes}
          onChange={(e) => setClasses(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Extracting..." : "Extract"}
        </button>
      </form>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {items && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {items.length} {items.length === 1 ? "result" : "results"}
            </p>
            <button
              type="button"
              onClick={() => copy(items.join("\n"), "all")}
              className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {copied === "all" ? <CheckIcon /> : <CopyIcon />} Copy all
            </button>
          </div>
          <ul className="divide-y divide-gray-200 rounded border border-gray-200">
            {items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>{item}</span>
                <button
                  type="button"
                  aria-label={`Copy ${item}`}
                  onClick={() => copy(item, i)}
                  className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                >
                  {copied === i ? <CheckIcon /> : <CopyIcon />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Adjust layout**

In `app/layout.tsx`, change `metadata.title` to `"Extractor"`. Keep `<html lang="en">`.

- [ ] **Step 3: Build, lint and test check**

Run: `npm run lint && npm run build && npm test`
Expected: no errors; tests PASS.

- [ ] **Step 4: Manual check in the browser**

Run: `npm run dev`, open `http://localhost:3000`, paste the example URL and `flex-1 px-4 py-4 text-xl leading-tight`.
Expected: "22 results", including `27 Flux-coated Electrode`; each row's icon turns into a check for ~1.5 s and the clipboard contains that text; "Copy all" copies one item per line. Also try an invalid URL and non-existent classes: the matching error message appears.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add extractor UI with copy buttons"
```
