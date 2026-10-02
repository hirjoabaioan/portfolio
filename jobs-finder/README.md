# Jobs Finder

**A job-search tool** across 7 free, no-API-key sources — built for my own job search, now live for anyone.

Live: **[hirjoaba-ioan.ro/projects/jobs-finder](https://hirjoaba-ioan.ro/projects/jobs-finder/)**

> Personal project, closed-source. This page is a showcase.

## What it does

- **7 sources, no API key**: LinkedIn Guest API, Remotive, RemoteOK, Arbeitnow, Jobicy, Himalayas, We Work Remotely.
- **Two access tiers**:
  - **Public** (no login) — searches 6 robust JSON/RSS sources; results save only in the visitor's browser (`localStorage`), the server keeps nothing about anonymous visitors beyond an aggregate daily counter.
  - **Admin** (password login) — full search (+ LinkedIn), search history persisted server-side (available from any device after login), a usage chart, and agentic AI search (below).
- **Agentic AI search & matching** (`src/ai_match.js`) — instead of a fixed list of search terms, a model (Claude Haiku, via the `claude` CLI already authenticated on the server — no separate API key) reads a profile summary and generates its own search queries, then scores every result 0-100 against the profile with a short reason, sorting by fit. Both steps are independently best-effort: if query generation or scoring fails or times out, the search falls back to the fixed term list / unscored results rather than erroring out. Tool use is explicitly disabled for these calls (`--disallowedTools`) — without that, the model attempting a tool like WebSearch in a non-interactive pipe would hang waiting for an approval that never comes.
- **Caching layer** (`src/cache.js`) — several sources (Arbeitnow, Jobicy, Himalayas, We Work Remotely) have no real server-side search; they return a batch that gets filtered locally. A 10-minute TTL cache means public traffic filters the same batch from memory instead of re-hitting the free upstream APIs on every request.
- **Auth** — scrypt-hashed password, disk-persisted sessions, zero npm dependencies (`node:crypto`, native `fetch`).

## Stack

Node.js (zero npm dependencies), vanilla JS/CSS frontend, pm2, `claude` CLI (agentic search).

---

**Role:** sole author. Companion project to [World Pulse](../world-pulse) — same zero-dependency, self-run philosophy.
