#!/usr/bin/env node
// postpone.mjs — simple postpone mechanism, used by the "snooze" button in the
// dashboard (Phase 5). Writes a timestamp until which run-healer.mjs / run-improver.mjs
// skip the scheduled cron run. Doesn't affect a manual "run now" from the dashboard.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HEALER_DIR = dirname(fileURLToPath(import.meta.url));
const POSTPONE_PATH = join(HEALER_DIR, "state", "postpone-until.json");

export function isPostponed(target) {
  if (!existsSync(POSTPONE_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(POSTPONE_PATH, "utf8"));
    const entry = data[target];
    if (!entry) return null;
    const until = Date.parse(entry);
    if (!Number.isFinite(until) || Date.now() >= until) return null;
    return entry;
  } catch {
    return null;
  }
}

export function setPostpone(target, untilIso) {
  let data = {};
  if (existsSync(POSTPONE_PATH)) {
    try {
      data = JSON.parse(readFileSync(POSTPONE_PATH, "utf8"));
    } catch {
      data = {};
    }
  }
  data[target] = untilIso;
  writeFileSync(POSTPONE_PATH, JSON.stringify(data, null, 2));
}

export function clearPostpone(target) {
  if (!existsSync(POSTPONE_PATH)) return;
  try {
    const data = JSON.parse(readFileSync(POSTPONE_PATH, "utf8"));
    delete data[target];
    writeFileSync(POSTPONE_PATH, JSON.stringify(data, null, 2));
  } catch {
    // ignore — corrupt file, gets rewritten on the next setPostpone
  }
}
