<h1 align="center">Production SaaS & AI Infrastructure — Showcase</h1>

<p align="center">
  Six platforms I designed, built, and run (or am launching) in production — end to end, solo.<br>
  Plus the AI agent infrastructure (router, orchestrator, autonomous healer) I use to build and maintain all of them.
</p>

<p align="center">
  <a href="https://hirjoaba-ioan.ro"><b>hirjoaba-ioan.ro</b></a> ·
  <a href="https://hirjoaba-ioan.ro/cv.html">CV</a> ·
  <a href="mailto:hirjoaba.ioan@gmail.com">hirjoaba.ioan@gmail.com</a>
</p>

---

> **About this repository.** Most of the projects below are **closed-source, commercial products**, so most of this repo is a *showcase* — architecture notes, feature breakdowns and screenshots, not the source code. Two folders are the exception: **[World Pulse](./world-pulse)** links to a fully open-source repo, and **[AI Orchestration](./ai-orchestration)** contains real, running source from my own personal infrastructure.

## Projects

| Project | What it is | Live / Source | Stack |
|---|---|---|---|
| **[IFindSpec / Avocatesc](./ifindspec)** | All-in-one practice-management SaaS for independent professionals & businesses (CRM, scheduling, payments, AI, video & social marketing). Dual-branded from one codebase. | [ifindspec.com](https://ifindspec.com) · [avocatescu.ro](https://avocatescu.ro) | PHP 8.2 · MariaDB · Node · AI · nginx |
| **[StoryFuze](./storyfuze)** | Content-creation SaaS — one workspace, three studios: video editing by transcript, AI creatives and multi-channel publishing, with per-channel copy. | [storyfuze.com](https://storyfuze.com) *(launching soon, not yet live)* | PHP 8.2 · Node · fal.ai · ffmpeg · Stripe |
| **[Event Creator Hub](./eventcreatorhub)** | Platform for running scored competitions & events — paperless digital judging, real-time scoreboards, allocations, chat & WhatsApp. | [eventcreatorhub.com](https://eventcreatorhub.com) | PHP · MySQL · Bootstrap · Stripe · WhatsApp |
| **[WeddingPages](./weddingpages)** | Dynamic wedding-site builder (digital invitations, RSVP, guest photo wall, SMS invites) + a partner/venue portal with bulk ordering & Stripe Connect. | [weddingpages.ro](https://weddingpages.ro) | PHP 8.2 · MariaDB · Stripe Connect · Wasabi S3 |
| **[World Pulse](./world-pulse)** | Real-time global events map — conflicts, news, official announcements, disasters — from free public sources, on a zero-dependency D3 globe. | **Open source**: [github.com/hirjoabaioan/world-pulse](https://github.com/hirjoabaioan/world-pulse) · [live](https://hirjoaba-ioan.ro/projects/world-pulse/) | Node (zero deps) · D3 · GDELT |
| **[Jobs Finder](./jobs-finder)** | Job search across 7 free, no-API-key sources, with a public tier and an authenticated admin tier. | [live](https://hirjoaba-ioan.ro/projects/jobs-finder/) | Node (zero deps) · scrypt auth |

## [AI Orchestration →](./ai-orchestration)

The agent infrastructure behind all of the above: a **router** that dispatches tasks to the right **orchestrator** profile (investigate → plan → execute through sub-agents, with gates), and a **healer** — an autonomous agent that watches its own stack for problems and decides, by itself, what's safe to auto-fix (isolated, non-core, high-confidence) versus what has to go to a human review queue. Lease + budget gates make it fail closed, not open. This folder has real, running source — not just a description.

## Common engineering themes across all six

- **Full-stack, solo** — database schema, backend, frontend, integrations, deployment and monitoring, all by one person.
- **PHP + MariaDB core, surrounded by services** — pragmatic, framework-free PHP with Node microservices (media, PDF, messaging) and Python automation around it.
- **Real integrations, in production** — Stripe & Stripe Connect, Oblio invoicing, WhatsApp, Wasabi/S3, Google, Meta/TikTok/YouTube, Brevo, and AI (Gemini, Claude).
- **Own infrastructure** — nginx on Hetzner behind Cloudflare, pm2 workers with job queues, a custom DB migration system, and autoscaling.
- **Security-minded** — prepared statements, CSRF guards, ownership checks, least-privilege storage keys, and periodic self-run audits (IDOR, SQLi).

## Role

Founder & sole engineer on all six, plus the AI orchestration layer. I own the product from architecture to the running service.

---

<p align="center"><sub>Screenshots in each project folder are from demo/test accounts; no real customer data is shown.</sub></p>
