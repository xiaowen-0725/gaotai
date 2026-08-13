#!/usr/bin/env node
/**
 * File-serial mutation: npx stryker run --mutate <file>
 * Usage: node scripts/mutate-file.mjs src/domain/classify.ts
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const target = process.argv[2];
if (!target) {
  console.error("usage: node scripts/mutate-file.mjs <src-file>");
  process.exit(2);
}

const abs = path.resolve(target);
if (!fs.existsSync(abs)) {
  console.error(`missing file ${target}`);
  process.exit(2);
}

fs.mkdirSync("reports/mutation", { recursive: true });
const result = spawnSync("npx", ["stryker", "run", "--mutate", target], {
  stdio: "inherit",
  env: process.env,
});

const reportPath = `reports/mutation/${path.basename(target)}.json`;
if (fs.existsSync("reports/mutation/mutation.json")) {
  fs.copyFileSync("reports/mutation/mutation.json", reportPath);
}

process.exit(result.status ?? 1);
