#!/usr/bin/env node
// budget.mjs — cross-host budget gate for the healer's Claude sessions.
// Source of truth is a local usage widget (runs only on the laptop, autostarted),
// which keeps five_hour/seven_day utilization live in config.json. The server can't
// check the budget itself (no widget there) — it receives a snapshot pushed from
// the laptop.
//
// Threshold: the healer does NOT start any Claude session if five_hour OR
// seven_day >= 80%. If the snapshot is too old (laptop off for a while), the
// budget is treated as UNKNOWN and the gate rejects conservatively — better to
// miss a run than to blow through the limit.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const HEALER_DIR = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(HEALER_DIR, "state");

const WIDGET_CONFIG_PATH = process.env.HEALER_WIDGET_CONFIG ?? join(os.homedir(), ".config", "usage-widget", "config.json");
const LOCAL_SNAPSHOT_PATH = process.env.HEALER_BUDGET_SNAPSHOT ?? join(STATE_DIR, "budget-snapshot.json");

const IS_SERVER = process.env.HEALER_ROLE === "server"; // laptop = default; server runs with HEALER_ROLE=server
const REMOTE_HOST = process.env.HEALER_REMOTE_HOST ?? "prod-host";
const REMOTE_SNAPSHOT_PATH = process.env.HEALER_REMOTE_SNAPSHOT_PATH ?? "/root/orchestrator-mirror/healer/budget-snapshot.json";

const THRESHOLD_PCT = Number(process.env.HEALER_BUDGET_THRESHOLD_PCT ?? 80);
const SNAPSHOT_STALE_MS = Number(process.env.HEALER_SNAPSHOT_STALE_MIN ?? 45) * 60_000;

function readWidgetSnapshot() {
  if (!existsSync(WIDGET_CONFIG_PATH)) {
    throw new Error(`Widget config missing: ${WIDGET_CONFIG_PATH} (is the widget running? installed?)`);
  }
  const cfg = JSON.parse(readFileSync(WIDGET_CONFIG_PATH, "utf8"));
  const usage = cfg.latestUsageData;
  if (!usage?.five_hour || !usage?.seven_day) {
    throw new Error("Widget config.json has no latestUsageData.five_hour/seven_day — unexpected format");
  }
  return {
    fiveHourPct: usage.five_hour.utilization,
    fiveHourResetsAt: usage.five_hour.resets_at,
    sevenDayPct: usage.seven_day.utilization,
    sevenDayResetsAt: usage.seven_day.resets_at,
    capturedAt: new Date().toISOString(),
    host: os.hostname(),
  };
}

// Produces a local snapshot (laptop only) and pushes it to the server, so the
// server has something to read when it decides whether it can start its own
// healer session.
function publishSnapshot() {
  const snap = readWidgetSnapshot();
  writeFileSync(LOCAL_SNAPSHOT_PATH, JSON.stringify(snap, null, 2));

  try {
    execFileSync("ssh", [REMOTE_HOST, `mkdir -p ${dirname(REMOTE_SNAPSHOT_PATH)}`], { stdio: "pipe" });
    execFileSync("scp", ["-q", LOCAL_SNAPSHOT_PATH, `${REMOTE_HOST}:${REMOTE_SNAPSHOT_PATH}`], { stdio: "pipe" });
  } catch (err) {
    console.error(`Warning: could not push the snapshot to the server (${err.message}). The server will see a stale snapshot.`);
  }

  return snap;
}

function readSnapshotForGate() {
  if (IS_SERVER) {
    if (!existsSync(REMOTE_SNAPSHOT_PATH)) {
      return { snapshot: null, reason: `No snapshot received from the laptop yet (${REMOTE_SNAPSHOT_PATH} missing)` };
    }
    try {
      return { snapshot: JSON.parse(readFileSync(REMOTE_SNAPSHOT_PATH, "utf8")), reason: null };
    } catch {
      return { snapshot: null, reason: "Corrupt snapshot (invalid JSON)" };
    }
  }
  // on the laptop: publish fresh every time a gate check happens
  try {
    return { snapshot: publishSnapshot(), reason: null };
  } catch (err) {
    return { snapshot: null, reason: err.message };
  }
}

export function checkBudgetGate() {
  const { snapshot, reason } = readSnapshotForGate();

  if (!snapshot) {
    return { allowed: false, reason: reason ?? "Snapshot unavailable", fiveHourPct: null, sevenDayPct: null };
  }

  const age = Date.now() - Date.parse(snapshot.capturedAt);
  if (!Number.isFinite(age) || age > SNAPSHOT_STALE_MS) {
    return {
      allowed: false,
      reason: `Stale snapshot (${Math.round(age / 60_000)} min, threshold ${SNAPSHOT_STALE_MS / 60_000} min) — laptop is off or the widget isn't running`,
      fiveHourPct: snapshot.fiveHourPct,
      sevenDayPct: snapshot.sevenDayPct,
      snapshotAge: age,
    };
  }

  const over5h = snapshot.fiveHourPct >= THRESHOLD_PCT;
  const over7d = snapshot.sevenDayPct >= THRESHOLD_PCT;

  if (over5h || over7d) {
    return {
      allowed: false,
      reason: `Over the ${THRESHOLD_PCT}% threshold (5h=${snapshot.fiveHourPct}% 7d=${snapshot.sevenDayPct}%)`,
      fiveHourPct: snapshot.fiveHourPct,
      sevenDayPct: snapshot.sevenDayPct,
    };
  }

  return {
    allowed: true,
    reason: `Under threshold (5h=${snapshot.fiveHourPct}% 7d=${snapshot.sevenDayPct}%, threshold ${THRESHOLD_PCT}%)`,
    fiveHourPct: snapshot.fiveHourPct,
    sevenDayPct: snapshot.sevenDayPct,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = checkBudgetGate();
  console.log(`Gate: ${result.allowed ? "ALLOWED" : "BLOCKED"} — ${result.reason}`);
  process.exit(result.allowed ? 0 : 1);
}
