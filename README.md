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
- [ ] Cap the number of redirects (the response size is already capped at 5 MB).

Design: `docs/superpowers/specs/2026-10-15-extractor-design.md`. Plan: `docs/superpowers/plans/2026-10-15-extractor.md`.
