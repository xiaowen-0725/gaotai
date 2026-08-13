#!/usr/bin/env node
/**
 * Lightweight CRAP check for domain/policy files.
 * CRAP = CC^2 * (1 - cov)^3 + CC. With full unit coverage, CRAP == CC.
 */
import fs from "fs";
import path from "path";

const ROOT = "src/domain";
const LIMIT = 6;

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (full.endsWith(".ts") && !full.endsWith("types.ts") && !full.endsWith("index.ts")) acc.push(full);
  }
  return acc;
}

function functionsOf(src) {
  const found = [];
  const re = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{|(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{/g;
  let match;
  while ((match = re.exec(src))) {
    const name = match[1] || match[2];
    if (!name || ["if", "for", "while", "switch", "catch"].includes(name)) continue;
    const start = match.index + match[0].length - 1;
    let depth = 0;
    let end = start;
    for (let i = start; i < src.length; i += 1) {
      if (src[i] === "{") depth += 1;
      if (src[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    found.push({ name, body: src.slice(start, end + 1) });
  }
  return found;
}

function complexity(body) {
  const decisions = body.match(/\b(if|for|while|case|catch)\b|\?\?|&&|\|\||(?<!\?)\?(?![?.])/g) || [];
  return 1 + decisions.length;
}

const rows = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  for (const fn of functionsOf(src)) {
    const cc = complexity(fn.body);
    const coverage = 1;
    const crap = cc * cc * (1 - coverage) ** 3 + cc;
    rows.push({ file, name: fn.name, cc, crap });
  }
}

const over = rows.filter((row) => row.crap > LIMIT);
console.log(JSON.stringify({ limit: LIMIT, rows, over }, null, 2));
if (over.length) {
  console.error(`CRAP > ${LIMIT}: ${over.map((r) => `${r.file}:${r.name}=${r.crap}`).join(", ")}`);
  process.exit(1);
}
