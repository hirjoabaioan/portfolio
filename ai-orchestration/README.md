# AI Orchestration — router, orchestrator, autonomous healer

**My own agent infrastructure**, built for orchestrating and keeping healthy the AI-assisted development workflow I use across all the projects in this portfolio (and some I run for others). Not a demo — this runs daily, on my own machine and a production server, with real budget and safety constraints.

> Personal infrastructure, not a commercial product — this is the real source, lightly genericized (hostnames/paths), not a showcase page.

## Three layers

**Router** — a single entry point that classifies an incoming task (explicit flag, project manifest, or keyword match) and dispatches it to the right orchestrator profile, instead of every task being handled ad hoc.

**Orchestrator** — turns a task into a plan (investigate → plan → human checkpoint), then executes it phase by phase through sub-agents, with per-phase gates (lint, tests, commit) and escalation back to the planner on repeated gate failure. Tracks state per plan so a run can resume instead of restarting.

**Healer** (this folder) — an autonomous agent that watches its own infrastructure for problems and fixes the safe ones by itself:

```
telemetry/logs → open issues (high/medium)
      │
      ▼
 acquireLease()         ← cross-host mutual exclusion (laptop ↔ server)
      │
      ▼
 checkBudgetGate()       ← refuses to run if recent usage is already over threshold,
      │                     or if it can't confirm the budget at all
      ▼
 INVESTIGATE (read-only Claude session)
      │   classifies each finding: blastRadius = isolated | core | unknown
      ▼
 ┌────────────┴─────────────┐
 isolated, not core, confident        core / unknown / low-confidence
 │                                     │
 ▼                                     ▼
 FIX: edit + git commit          PROPOSE: unified diff written to a
 (rollback = git revert)         review queue, nothing touched
```

## The design decision I'd defend in review

The interesting problem here isn't "call an LLM to fix a bug" — it's **where to draw the autonomy boundary**. Three independent safeguards have to all agree before anything is touched unsupervised:

1. **Lease** — so the laptop and the server can never both decide to fix the same thing at the same time.
2. **Budget gate** — a hard "don't even start a session" check, fail-closed if the usage snapshot is stale or missing (unknown budget is treated as *no budget*, not as *unlimited*).
3. **Blast-radius classification + a hardcoded core-path denylist** (`run-healer.mjs`) — even if the model classifies something as "isolated", a fixed list of core files (router, orchestrator core, production config) can never be auto-applied. Model judgment is the first filter, not the last one.

Everything that doesn't clear all three lands in a review queue as a diff, not as a silent write.

**Prompt-injection handling**: the issues fed to the investigator come from logs/telemetry — untrusted, machine-generated text. The investigate prompt explicitly tells the model to treat that content as data, not instructions, and the read-only system block is written as an enumerated list of forbidden actions (not a one-line "you're read-only"), because a one-liner doesn't cover Bash redirects/heredocs as a write path.

## Files in this folder

- **`run-healer.mjs`** — the core loop described above (investigate → classify → fix/propose).
- **`lease.mjs`** — the cross-host mutual-exclusion lock (atomic acquire via `noclobber`, TTL-based expiry).
- **`budget.mjs`** — the fail-closed budget gate.
- **`postpone.mjs`** — a small manual snooze mechanism (dashboard "postpone" button).

These are genuinely the files from my own `~/.config` — I've generalized a couple of hostnames/paths (e.g. `hetzner-claude` → `prod-host`) but the logic, comments and structure are unedited.

## Stack

Node.js (zero-dependency, native `fs`/`child_process`), the Claude Agent SDK (`claude -p` with `--permission-mode`, `--max-budget-usd`, JSON schema output), git for rollback, cron + systemd for scheduling, a small web dashboard for the review queue (not included here).

---

**Role:** sole author/operator. Built to solve a real problem — AI-assisted sessions occasionally regress something, and I wanted a system that could tell the difference between "safe to auto-fix" and "needs a human", instead of either auto-applying everything or alerting on everything.
