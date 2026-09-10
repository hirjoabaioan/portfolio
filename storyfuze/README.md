# StoryFuze

**A content-creation SaaS** — one workspace, three studios. Video Studio for editing, Creative Studio for AI-generated design and Publishing Hub for multi-channel publishing, all sharing the same project, brand kit and asset library.

Live: **[storyfuze.com](https://storyfuze.com)** — *launching soon (not yet live).*

> Closed-source commercial product. This page is a showcase.

---

## What it does

**One workspace, three studios**

- **Video Studio** — edit footage by editing its transcript: delete a sentence and the footage goes with it. Auto-captions, reframing for vertical (9:16 / 1:1 / 16:9), dubbing and translation into multiple languages, rendered on a worker.
- **Creative Studio** — generate thumbnails, covers and static posts on the same brand system as the video, so nothing drifts between formats.
- **Publishing Hub** — connect channels once (Meta / Instagram / TikTok), then schedule or push a finished asset to all of them from one screen, with per-channel copy and a reorderable queue.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.2 (procedural), nginx |
| Database | MariaDB + a custom migration system |
| Media | ffmpeg, transcript-based editing, auto-captions, dubbing |
| AI | fal.ai (image/video generation), transcription & captioning models |
| Payments | Stripe subscriptions (tiered plans, monthly/yearly) |
| Node services | worker queue for rendering/media jobs |

## Pricing

| Plan | Price/mo |
|---|---|
| Free | $0 |
| Starter (Basic) | $15 |
| Pro | $39 |
| Business | $79 |

A free tier is included (no credit card to start); paid plans scale video, creative and publishing limits. Prices shown in USD.

---

**Role:** Founder & sole engineer.