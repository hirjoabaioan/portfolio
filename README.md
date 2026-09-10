<h1 align="center">Production SaaS — Showcase</h1>

<p align="center">
  Four commercial SaaS platforms I designed, built, and run (or am launching) in production — end to end, solo.<br>
  Architecture, backend, frontend, AI, media pipelines, payments and infrastructure.
</p>

<p align="center">
  <a href="https://hirjoaba-ioan.ro"><b>hirjoaba-ioan.ro</b></a> ·
  <a href="https://hirjoaba-ioan.ro/cv.html">CV</a> ·
  <a href="mailto:hirjoaba.ioan@gmail.com">hirjoaba.ioan@gmail.com</a>
</p>

---

> **About this repository.** These are **closed-source, commercial products**, so this repo is a *showcase* — architecture notes, feature breakdowns and screenshots — not the source code. Each project below has its own page with details and images.

## Projects

| Project | What it is | Live | Stack |
|---|---|---|---|
| **[StoryFuze](./storyfuze)** | Content-creation SaaS — one workspace, three studios: video editing by transcript, AI creatives and multi-channel publishing, with per-channel copy. | [storyfuze.com](https://storyfuze.com) *(launching soon, not yet live)* | PHP 8.2 · Node · fal.ai · ffmpeg · Stripe |
| **[IFindSpec / Avocatesc](./ifindspec)** | All-in-one practice-management SaaS for independent professionals & businesses (CRM, scheduling, payments, AI, video & social marketing). Dual-branded from one codebase. | [ifindspec.com](https://ifindspec.com) · [avocatescu.ro](https://avocatescu.ro) | PHP 8.2 · MariaDB · Node · AI · nginx |
| **[Event Creator Hub](./eventcreatorhub)** | Platform for running scored competitions & events — paperless digital judging, real-time scoreboards, allocations, chat & WhatsApp. | [eventcreatorhub.com](https://eventcreatorhub.com) | PHP · MySQL · Bootstrap · Stripe · WhatsApp |
| **[WeddingPages](./weddingpages)** | Dynamic wedding-site builder (digital invitations, RSVP, guest photo wall, SMS invites) + a partner/venue portal with bulk ordering & Stripe Connect. | [weddingpages.ro](https://weddingpages.ro) | PHP 8.2 · MariaDB · Stripe Connect · Wasabi S3 |

## Common engineering themes across all four

- **Full-stack, solo** — database schema, backend, frontend, integrations, deployment and monitoring, all by one person.
- **PHP + MariaDB core, surrounded by services** — pragmatic, framework-free PHP with Node microservices (media, PDF, messaging) and Python automation around it.
- **Real integrations, in production** — Stripe & Stripe Connect, Oblio invoicing, WhatsApp, Wasabi/S3, Google, Meta/TikTok/YouTube, Brevo, and AI (Gemini, Claude).
- **Own infrastructure** — nginx on Hetzner behind Cloudflare, pm2 workers with job queues, a custom DB migration system, and autoscaling.
- **Security-minded** — prepared statements, CSRF guards, ownership checks, least-privilege storage keys, and periodic self-run audits (IDOR, SQLi).

## Role

Founder & sole engineer on all four. I own the product from architecture to the running service.

---

<p align="center"><sub>Screenshots in each project folder are from demo/test accounts; no real customer data is shown.</sub></p>
