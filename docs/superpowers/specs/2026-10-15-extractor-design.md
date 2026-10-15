# Class-based Text Extractor — Design

Date: 2026-10-15

## Goal

A very simple local web app with two inputs:

1. A page **URL**.
2. The **CSS classes** of a `div` (pasted as-is, e.g. `flex-1 px-4 py-4 text-xl leading-tight`).

On submit, it returns a list with the text of every matching `div`, with a copy icon on each item. The user then does whatever they want with that data.

Example: given `https://hardfacetechnologies.com/industry/sugar-cane-processing-1` and the classes above, this `div`

```html
<div class="flex-1 px-4 py-4 text-xl leading-tight">
  27 Flux-coated Electrode
  <p class="my-2 text-sm text-gray-700 break-word">Hardfacing Electrodes, Build-Up Alloy Electrodes</p>
</div>
```

must return only `27 Flux-coated Electrode`.

## Scope

- Local only for now. Vercel deployment comes later (out of scope).
- Minimal Tailwind styling.
- Server-rendered HTML only (verified: the example URL contains all 22 matching divs (21 unique texts) in the initial HTML). No headless browser.
- Everything is written in English: spec, plan, code, comments, UI copy and error messages.

## Stack

Next.js (App Router, TypeScript), Tailwind CSS, `cheerio` for parsing, `vitest` for tests.

## Structure

```
app/page.tsx              UI (client component)
app/api/extract/route.ts  POST { url, classes } -> { items: string[] }
lib/extract.ts            parseClasses(), extractTexts(html, classes): string[]  (pure functions)
lib/url.ts                normalizeUrl()
lib/*.test.ts             unit tests
```

## Extraction logic (`lib/extract.ts`)

- `classes` is split on whitespace; a leading dot, quotes and a `class=` prefix are tolerated.
- A `div` matches when its `class` attribute contains **all** the requested classes (token comparison in code, not a CSS selector, so classes like `md:flex`, `w-1/2` or `2xl:p-4` need no escaping).
- For each match, only the **direct text nodes** are taken (the child `<p>` is ignored).
- Whitespace and newlines are collapsed, empty results are dropped, duplicates are removed preserving order.

## Endpoint (`POST /api/extract`)

- Validates that `url` is `http:` or `https:` (a missing protocol is completed with `https://`) and that `classes` is not empty.
- `fetch` with a browser `User-Agent` and a 15 s timeout.
- Errors are returned as readable messages: invalid input (400), zero matches (422), page unreachable or non-OK status (502).
- No abuse protection for now (local only). **Pending for deployment:** rate limiting and blocking private IPs (SSRF).

## UI

- Two inputs, an "Extract" button, a loading state and error messages.
- Result counter ("21 results").
- List: each row shows the text and a copy icon; after copying, it switches to a check for ~1.5 s.
- "Copy all" button: copies one item per line.

## Testing

- Unit tests for `extractTexts`, `parseClasses` and `normalizeUrl`, using the example HTML: ignores the `<p>`, cleans whitespace, deduplicates, special-character classes, zero matches.
- Manual test against the real URL: it must return 21 results (the page has 22 matching divs, one name appears twice and is deduplicated).

## Out of scope

CSV export, history, authentication, JavaScript-rendered pages, deployment.
