# Extractor

Local tool: paste a page URL and the CSS classes of a `div`, get a list with the direct text of every matching `div`, with a copy button per item.

## Run locally

```bash
yarn install
yarn dev     # http://localhost:3000
yarn test
```

## Pending (before deploying to Vercel)

This app is for local use only for now. Do these before exposing it publicly:

- [ ] Rate limiting on `POST /api/extract`.
- [ ] Block private/internal IPs and hostnames (SSRF protection).
- [ ] Cap the response size and the number of redirects.

## Known minor issues (deferred)

- [ ] `localhost:3000` gets `https://` prepended and fails; it should use `http://` for localhost and IP hosts.
- [ ] Tailwind arbitrary values with quotes (e.g. `content-['x']`) are split by the quote stripping in `parseClasses`.
- [ ] Pasted CSS selectors (`.a.b`, `.md\:flex`) and backtick-quoted input are not normalized.
- [ ] Non-UTF-8 pages are decoded as UTF-8 (garbled text); `res.text()` also has no size cap.
- [ ] A JSON body of `null` crashes the route (500), and the UI shows "Could not reach the server." on a non-JSON 500.
- [ ] UI: a stale "could not copy" error stays visible, the copied check mark can carry over to the next search, and long unbroken strings overflow the row (needs `min-w-0` / `break-words`).

Design: `docs/superpowers/specs/2026-10-15-extractor-design.md`. Plan: `docs/superpowers/plans/2026-10-15-extractor.md`.
