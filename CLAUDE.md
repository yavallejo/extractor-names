# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

IMPORTANT: This is Next.js 16 with breaking changes (see `AGENTS.md`). Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

## Commands

Package manager is yarn.

```bash
yarn dev                               # http://localhost:3000
yarn test                              # all tests (vitest run)
yarn vitest run lib/extract.test.ts    # one file; add -t "name" to filter
yarn lint
yarn tsc --noEmit                      # typecheck (no script defined)
yarn build
```

## Workflow

- After a series of changes, run the relevant single test file, then `yarn lint` and `yarn tsc --noEmit`. Run the full suite before committing.
- Write a failing test first for extraction or parsing bugs. Tests sit next to the code (`lib/*.test.ts`, `app/**/*.test.ts`).
- For UI changes, load the page and check it at mobile width. The UI is mobile-first.
- Do not describe `/api/extract` as safe to expose publicly. It still lacks rate limiting, SSRF protection (private IPs and hostnames) and a redirect cap (see README).
- All code, comments, UI copy and error messages are in English.

## Architecture

The user pastes a page URL and the CSS classes of a `div`, and gets the direct text of every matching `div`.

- `app/page.tsx`: single client component that POSTs `{ url, classes }`.
- `app/api/extract/route.ts`: the only endpoint. It fetches the page server-side and returns `{ items }` or `{ error }`. Status codes carry meaning: 400 bad input, 422 page not extractable, 502 fetch failed.
- `lib/url.ts`, `lib/http.ts`, `lib/extract.ts`: pure helpers the route composes (URL normalization, capped body read and charset detection, class parsing and extraction).

Non-obvious extraction rules:
- Classes are matched as tokens in code, not through a CSS selector, so `md:flex` or `2xl:p-4` need no escaping. A div must have ALL the given classes.
- Only a div's own text nodes are returned. Text inside child elements is ignored on purpose, and the route reports "matched but no own text" separately.
- Results are deduplicated. Only server-rendered HTML is seen (no headless browser).
- `parseClasses` accepts messy input: `class="..."`, JSX `className`, a whole opening tag, quotes, CSS selectors. Keep it tolerant when changing it.

## Repo notes

- Design spec and plan: `docs/superpowers/`.
- `.agents/` and `.claude/skills/` are third-party design skills (taste-skill) installed via `npx skills`, not app code.
