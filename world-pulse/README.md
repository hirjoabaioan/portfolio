# World Pulse

**A real-time global events map** — four layers (conflicts, news, official announcements, disasters) aggregated from free public sources, rendered on a dependency-free D3 globe.

**This one is fully open source**: **[github.com/hirjoabaioan/world-pulse](https://github.com/hirjoabaioan/world-pulse)** — live at **[hirjoaba-ioan.ro/projects/world-pulse](https://hirjoaba-ioan.ro/projects/world-pulse/)**.

## What it does

- **Four layers**: conflicts, news, official announcements, natural disasters — each with its own sources and its own point/choropleth rendering on the globe.
- **Sources**: GDELT (Events feed every 15 min, geolocated, plus the DOC API per country), ~300 regional RSS feeds (Europe, Middle East, Africa, with more regions staged), USGS (earthquakes), GDACS, NASA EONET.
- **Geolocation from free text** (`src/lib/geo.js`) — a "place beats actor" rule: in "Israeli strikes on Gaza" or "Ukrainian drones hit Moscow", the city wins over the demonym. Priority is concrete place > country name > demonym, short acronyms (UK, DRC) only match uppercase.
- **Classification** (`src/lib/classify.js`) — multilingual keyword matching (EN/RO/FR/ES/DE), severity 0-3.
- **Zero npm dependencies** — Node ≥ 18 native `fetch`, vendored D3/topojson on the frontend.

## Why it's here

It's the project I pick when I want to show backend engineering without a framework underneath — source adapters, deduplication, persistence, and a non-trivial text-processing problem (geolocation disambiguation) all written from scratch, not wired together from libraries.

## Stack

Node.js, D3 (frontend, vendored), GDELT/USGS/GDACS/EONET APIs, pm2 for process management.

---

**Role:** sole author. See the [repo](https://github.com/hirjoabaioan/world-pulse) for the full architecture, API reference and known limitations.
