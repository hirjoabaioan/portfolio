<h1 align="center">Ioan Hîrjoabă — AI Agent Engineer · Full-Stack</h1>

<p align="center">
  I build and run SaaS products with LLM agents in production, solo: design, code, infrastructure and operations.<br>
  This repository is the map. The code lives in the open-source repos linked below.
</p>

<p align="center">
  <a href="https://hirjoaba-ioan.ro"><b>hirjoaba-ioan.ro</b></a> ·
  <a href="https://hirjoaba-ioan.ro/cv.html">CV</a> ·
  <a href="mailto:hirjoaba.ioan@gmail.com">hirjoaba.ioan@gmail.com</a> ·
  <a href="https://www.linkedin.com/in/ioan-h%C3%AErjoab%C4%83-266238103">LinkedIn</a>
</p>

---

## Start here (60 seconds)

- **[tool-calling-agent](https://github.com/hirjoabaioan/tool-calling-agent)** — tool registry with RBAC enforced at three points, writes as human-confirmed proposals, a multi-provider router with a circuit breaker, metering and an MCP server.
  - 40 deterministic evals on 4 models: **88-98% overall, 100% RBAC refusal**, $0.03-0.23 per full run.
- **[autonomy-levels-agent](https://github.com/hirjoabaioan/autonomy-levels-agent)** — a WhatsApp-style agent with off / suggest / auto autonomy. Writes need the *customer's* confirmation, identity comes from the channel, and dedup/loop guards run before any LLM call.
  - **100% prompt-injection resistance** across 4 models.
  - Its evals caught a real double-confirmation bug.
- **[speech-pipeline-bench](https://github.com/hirjoabaioan/speech-pipeline-bench)** — a provider-agnostic STT/TTS layer with a transcript-based video editor, plus an honest Romanian/English benchmark: Whisper vs Scribe vs Gemini vs Google vs OpenAI.
  - Finding: whisper-1 **silently skips speech**; it transcribed 186 of 271 words on one clip.

## Open-source agent work

| Repo | What it demonstrates | Stack | Results |
|---|---|---|---|
| [tool-calling-agent](https://github.com/hirjoabaioan/tool-calling-agent) | Guarded tool use, proposals, router + breaker, MCP (stdio + HTTP, bearer/audience, RFC 9728 metadata) | TypeScript, Zod, SQLite, MCP SDK | Gemini 2.5 Flash 98% · Claude Haiku 4.5 95% · DeepSeek 93% · GPT-4.1 mini 88% |
| [autonomy-levels-agent](https://github.com/hirjoabaioan/autonomy-levels-agent) | Messaging agent safety: autonomy levels, customer-confirmed writes, server-side identity, dedup / self-echo / loop breaker / handoff | TypeScript, SQLite | Injection 100% on all 4 models; pipeline guarantees 9/9 |
| [speech-pipeline-bench](https://github.com/hirjoabaioan/speech-pipeline-bench) | Provider abstraction, async job pipeline, ffmpeg cutting + captions, WER benchmark on FLEURS | TypeScript, ffmpeg | RO WER: Gemini 3.8%, Scribe 4.3%, Groq Whisper 11.3% |
| [world-pulse](https://github.com/hirjoabaioan/world-pulse) | Real-time global events map from free public sources | Node (zero deps), D3 | 659 RSS feeds + GDELT, USGS, GDACS, EONET |

All three agent repos have CI (lint, build, tests, offline eval replay) and README sections on design decisions and known limitations.

## Agents running in production (closed source)

These run inside **[IFindSpec / Avocățescu](./ifindspec)**, a practice-management SaaS. The code is private. The design is described below, with clean rewrites in the repos above and in [`snippets/`](./snippets).

| Agent | What it does | Autonomy | Guardrails | Numbers |
|---|---|---|---|---|
| In-app assistant | Acts on the user's CRM, calendar, finance, marketing and creative tools | Reads run immediately; every write is a confirm card | RBAC per audience + permission level, checked at exposure, in the loop and again at execution; max 10 steps | **62 tools** (31 read / 31 write) |
| Messaging agent (WhatsApp/SMS) | Answers customers, books / reschedules / cancels | off / suggest / auto per business | Queue dedup, self-echo, sender identity resolved server-side, cancellations need two confirmations | 9 tools; per-iteration cost audit. **Pilot on staging, not yet on production traffic.** |
| Model router | One entry point for every AI feature | — | Retry with backoff on transient errors, no retry on quota errors, BYOK keys sealed with AES-256-GCM + HKDF | **29 AI purposes** |
| Auto-heal agent | Fixes incidents found by a synthetic monitor | Bounded: TEST → re-verify → PROD → re-verify + watch | ≤ 3 files / 60 lines, no DB changes, path allow-list, daily budget, circuit breaker, auto-rollback — [policy](./snippets/autoheal-boundary.md) | Ticket-raised fixes become **draft PRs** for human review |
| Campaign planner | Drafts multi-step marketing campaigns | Proposal → user approval | The LLM plan is a graph that is validated, cycle-checked and repaired by code — [snippet](./snippets/plan-graph-validate-repair.ts) | — |
| Data import assistant | Maps messy spreadsheets from other tools | The model returns a spec, never code | It sees headers + masked samples only; transforms are whitelisted — [snippet](./snippets/spec-not-code-import.ts) | — |

**Metering:** every AI call is logged with tokens, cost and latency. A daily rollup with p50/p95 per feature and model, plus an admin dashboard, is on staging and rolling out.

**Development tooling:** I also run my own agent infrastructure for building all of this:
- a router that dispatches tasks to orchestrator profiles;
- an orchestrator that goes investigate → plan → human checkpoint → phased execution, with lint/test/review gates and an escalation ladder across cheaper and stronger models;
- a paid-credit fallback with spend caps and reduced parallelism.

The healer part is published in [`ai-orchestration/`](./ai-orchestration).

## Products

| Product | What it is | Status |
|---|---|---|
| **[IFindSpec / Avocățescu](./ifindspec)** | Practice-management SaaS: CRM, scheduling, payments, invoicing, AI assistants, video studio, social publishing. Dual-branded from one codebase. | Live · [ifindspec.com](https://ifindspec.com) · [avocatescu.ro](https://avocatescu.ro) |
| **[StoryFuze](./storyfuze)** | Content studio: edit video by transcript, AI creatives, multi-channel publishing | Launching |
| **[Event Creator Hub](./eventcreatorhub)** | Scored competitions: digital judging, live scoreboards, WhatsApp | Live · [eventcreatorhub.com](https://eventcreatorhub.com) |
| **[WeddingPages](./weddingpages)** | Wedding-site builder + venue partner portal with Stripe Connect | Live · [weddingpages.ro](https://weddingpages.ro) |
| **[World Pulse](./world-pulse)** | Global events map | Open source |
| **[Jobs Finder](./jobs-finder)** | Job search over 7 free sources with LLM query generation and fit scoring | Live demo |

## How I work with AI

- **Routing:** one purpose → provider/model map, so features don't hard-code models. → [router + breaker](https://github.com/hirjoabaioan/tool-calling-agent/tree/main/src/router)
- **Metering:** every call is recorded with tokens, cost, latency and fallback reason; reports show p50/p95. → [meter](https://github.com/hirjoabaioan/tool-calling-agent/tree/main/src/metering)
- **Autonomy boundary:** models propose and code decides. Writes are proposals or pending actions, confirmed by a human or customer and re-validated at execution. → [loop](https://github.com/hirjoabaioan/tool-calling-agent/blob/main/src/agent/loop.ts) · [pending actions](https://github.com/hirjoabaioan/autonomy-levels-agent/blob/main/src/agent/pending.ts)
- **Evals:** deterministic scorers, live runs across providers, offline replay in CI, and deliberate failures to prove the scorers bite. → [evals](https://github.com/hirjoabaioan/tool-calling-agent/tree/main/evals)
- **Prompt injection:** tool output is wrapped as untrusted data; identity and authority never come from text the model reads. → [eval cases](https://github.com/hirjoabaioan/tool-calling-agent/blob/main/evals/cases/injection.jsonl)

## Stack

TypeScript / Node, PHP 8.2, MariaDB, SQLite · Claude, Gemini, OpenAI, DeepSeek, Groq, ElevenLabs · MCP · ffmpeg · nginx, pm2, systemd · GitHub Actions

## Contact

Open to full-time remote roles (EU/CET) or B2B contracts in AI agent engineering. **[hirjoaba.ioan@gmail.com](mailto:hirjoaba.ioan@gmail.com)**

---

<p align="center"><sub>Screenshots are from demo/test accounts; no real customer data is shown. Code in <code>ai-orchestration/</code> and <code>snippets/</code> is MIT licensed.</sub></p>
