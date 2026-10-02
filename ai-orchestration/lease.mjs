#!/usr/bin/env node
// lease.mjs — cross-host mutual exclusion for autonomous healer runs.
// Held on the server (the one host that's always on, reachable from the laptop via
// SSH; the server can't reach back to the laptop). Acquire is atomic via `set -C`
// (noclobber) — the write fails if the file already exists, so only one process can
// win the lease. Expires after LEASE_TTL_MIN so it can't stay stuck if a process
// crashes without releasing it.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import os from "node:os";

const IS_SERVER = process.env.HEALER_ROLE === "server";
const REMOTE_HOST = process.env.HEALER_REMOTE_HOST ?? "prod-host";
const REMOTE_LEASE_PATH = process.env.HEALER_REMOTE_LEASE_PATH ?? "/root/orchestrator-mirror/healer/lease.json";
const LEASE_TTL_MS = Number(process.env.HEALER_LEASE_TTL_MIN ?? 30) * 60_000;

function sshExec(cmd) {
  return execFileSync("ssh", [REMOTE_HOST, cmd], { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function nowIso() {
  return new Date().toISOString();
}

function leaseBody(purpose) {
  return JSON.stringify({
    holder: os.hostname(),
    purpose,
    acquiredAt: nowIso(),
    expiresAt: new Date(Date.now() + LEASE_TTL_MS).toISOString(),
    pid: process.pid,
  });
}

function isExpired(leaseObj) {
  const exp = Date.parse(leaseObj?.expiresAt ?? "");
  return !Number.isFinite(exp) || Date.now() > exp;
}

// Returns { acquired: bool, reason, holder? }
export function acquireLease(purpose = "healer-run") {
  const body = leaseBody(purpose);

  if (IS_SERVER) {
    if (existsSync(REMOTE_LEASE_PATH)) {
      const existing = JSON.parse(readFileSync(REMOTE_LEASE_PATH, "utf8"));
      if (!isExpired(existing)) {
        return { acquired: false, reason: `Lease held by ${existing.holder} (expires ${existing.expiresAt})`, holder: existing.holder };
      }
      unlinkSync(REMOTE_LEASE_PATH); // expired, clean up and take it
    }
    writeFileSync(REMOTE_LEASE_PATH, body);
    return { acquired: true, reason: "Lease acquired locally (server)" };
  }

  // laptop: check/write the lease on the server over SSH, atomic via noclobber
  try {
    sshExec(`mkdir -p $(dirname ${REMOTE_LEASE_PATH})`);
  } catch {
    // dir probably already exists, ignore
  }

  try {
    const existingRaw = sshExec(`cat ${REMOTE_LEASE_PATH} 2>/dev/null || true`);
    if (existingRaw.trim()) {
      const existing = JSON.parse(existingRaw);
      if (!isExpired(existing)) {
        return { acquired: false, reason: `Lease held by ${existing.holder} (expires ${existing.expiresAt})`, holder: existing.holder };
      }
      sshExec(`rm -f ${REMOTE_LEASE_PATH}`); // expired
    }
  } catch (err) {
    return { acquired: false, reason: `Could not check the remote lease: ${err.message}` };
  }

  try {
    // set -C = noclobber: fails if the file was created between the check and the
    // write (a race won by a concurrent server/laptop run) — prevents the race condition.
    const escaped = body.replace(/'/g, `'\\''`);
    sshExec(`set -C; echo '${escaped}' > ${REMOTE_LEASE_PATH}`);
    return { acquired: true, reason: "Lease acquired remotely (server, via SSH)" };
  } catch (err) {
    return { acquired: false, reason: `Lost the race writing the lease: ${err.message}` };
  }
}

export function releaseLease() {
  if (IS_SERVER) {
    if (existsSync(REMOTE_LEASE_PATH)) unlinkSync(REMOTE_LEASE_PATH);
    return;
  }
  try {
    sshExec(`rm -f ${REMOTE_LEASE_PATH}`);
  } catch {
    // best-effort — if it fails, the lease still expires on its own via TTL
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === "acquire") {
    console.log(JSON.stringify(acquireLease(process.argv[3] ?? "manual-test"), null, 2));
  } else if (cmd === "release") {
    releaseLease();
    console.log("Lease released.");
  } else {
    console.log("Usage: node lease.mjs acquire|release");
    process.exit(1);
  }
}
