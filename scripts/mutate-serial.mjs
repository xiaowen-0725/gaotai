#!/usr/bin/env node
/**
 * File-serial mutation over domain then adapters. Never mutates the whole tree at once.
 * Usage: node scripts/mutate-serial.mjs
 */
import { spawnSync } from "child_process";
import fs from "fs";

const FILES = [
  "src/domain/classify.ts",
  "src/domain/share.ts",
  "src/domain/generators.ts",
  "src/domain/snapshot.ts",
  "src/domain/write-templates.ts",
  "src/domain/id.ts",
  "src/domain/store.ts",
  "src/adapters/author-action.ts",
  "src/adapters/http.ts",
  "src/adapters/browser.ts",
];

function scoreOf(reportFile, mutatePath) {
  if (!fs.existsSync(reportFile)) return null;
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  const file = report.files[mutatePath];
  if (!file) return null;
  const by = {};
  for (const mutant of file.mutants) {
    by[mutant.status] = (by[mutant.status] || 0) + 1;
  }
  const killed = (by.Killed || 0) + (by.Timeout || 0);
  const survived = by.Survived || 0;
  const total = file.mutants.length;
  const detected = killed;
  const score = total ? Number(((detected / total) * 100).toFixed(2)) : 100;
  return { by, killed, survived, total, score };
}

const summary = [];
for (const file of FILES) {
  console.log(`\n=== mutate ${file} ===\n`);
  const result = spawnSync("node", ["scripts/mutate-file.mjs", file], {
    stdio: "inherit",
    env: process.env,
  });
  const report = `reports/mutation/${file.split("/").pop()}`;
  summary.push({
    file,
    exit: result.status ?? 1,
    ...(scoreOf(`${report}.json`, file) || {}),
  });
}

fs.mkdirSync("reports/mutation", { recursive: true });
fs.writeFileSync("reports/mutation/summary.json", JSON.stringify(summary, null, 2));
console.log("\nmutation summary");
console.log(JSON.stringify(summary, null, 2));
const failed = summary.some((row) => row.exit !== 0 && row.exit !== 1);
process.exit(failed ? 1 : 0);
