#!/usr/bin/env node
/**
 * Soft-mutate copies of features/gaotai-v1.feature. Never writes the source of truth.
 * A mutant must fail the acceptance pipeline. Usage: node scripts/gherkin-mutate.mjs
 */
import { execSync, spawn, spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const ORIGINAL = "features/gaotai-v1.feature";
const OUT_DIR = "reports/gherkin-mutants";
const PORT = process.env.PORT || "3000";
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

const MUTANTS = [
  {
    id: "home-hero-literal",
    scenario: "打开应用落在 New task 而非 Board 列表",
    from: '而且 中央可见 "What can I do for you?"',
    to: '而且 中央可见 "What can I do for them?"',
  },
  {
    id: "home-not-boards-swapped",
    scenario: "打开应用落在 New task 而非 Board 列表",
    from: "而且 不是 Board 列表页",
    to: "而且 标题为 Boards",
  },
  {
    id: "composer-placeholder-literal",
    scenario: "New task 提问框与页签可见",
    from: '那么 提问框占位为 "Describe a task or ask anything"',
    to: '那么 提问框占位为 "Ask me anything"',
  },
  {
    id: "empty-tasks-literal",
    scenario: "Tasks 空状态为 Nothing here",
    from: '而且 空状态为 "Nothing here"',
    to: '而且 空状态为 "Something here"',
  },
  {
    id: "plus-menu-literal",
    scenario: "加号打开添加菜单",
    from: "那么 可见 Add from files、从稿台已有 file 加入、Use browser 开关、Add connectors",
    to: "那么 可见 Add from files、从别处加入、Use browser 开关、Add connectors",
  },
  {
    id: "no-board-guard-inverted",
    scenario: "无当前 Board 时须先创建或选择才能继续 New task",
    from: "那么 须先创建或选择一个 Board 才能继续",
    to: "那么 可以开始 Board 内 Chat",
  },
  {
    id: "create-menu-genres-swapped",
    scenario: "Create 菜单没有四种体裁按钮",
    from: "那么 菜单上没有「长文」「短文提纲」「小红书图文」「口播稿」四个按钮",
    to: "那么 可见四种中文模板名：长文、短文提纲、小红书图文、口播稿",
  },
  {
    id: "longform-outcome-swapped",
    scenario: "按长文模板生成独立文档",
    from: "那么 Files 中出现一篇独立文档：标题、连续分段正文、可见来源",
    to: "那么 Files 中出现一篇独立文档：主题加分层条目，条目可有一句「这段写什么」",
  },
  {
    id: "unchecked-source-negated",
    scenario: "未勾选 file 不出现在该文档来源中",
    from: "而且 该文档来源中不可见 file 乙",
    to: "而且 该文档来源中可见 file 乙",
  },
  {
    id: "guest-readonly-swapped",
    scenario: "未登录访客只读且看不到 Board 其余内容",
    from: "而且 访客不能编辑",
    to: "而且 标题与正文可编辑",
  },
  {
    id: "deleted-board-outcome-swapped",
    scenario: "删除自己的 Board 后列表消失",
    from: "那么 该 Board 从列表中消失",
    to: "那么 出现一个可打开的 Board",
  },
  {
    id: "share-invalid-negated",
    scenario: "删除 Board 后分享链接失效且无撤销分享按钮",
    from: "而且 访客再打开原链接时打不开该文档",
    to: "而且 访客能看到该文档内容",
  },
];

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function waitForServer() {
  for (let i = 0; i < 90; i += 1) {
    try {
      const res = await fetch(BASE);
      if (res.ok || res.status === 404 || res.status === 307) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready at ${BASE}`);
}

function runMutant(mutant, source) {
  if (!source.includes(mutant.from)) {
    return { id: mutant.id, status: "error", detail: "source fragment missing" };
  }
  const mutated = source.replace(mutant.from, mutant.to);
  const dest = path.join(OUT_DIR, `${mutant.id}.feature`);
  fs.writeFileSync(dest, mutated);
  const result = spawnSync(
    "node",
    [
      "--require",
      "./features/support/register-zh.cjs",
      "./node_modules/@cucumber/cucumber/bin/cucumber.js",
      dest,
      "--config",
      "scripts/gherkin-cucumber.cjs",
      "--name",
      `^${mutant.scenario}$`,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, BASE_URL: BASE },
    },
  );
  const killed = result.status !== 0;
  return {
    id: mutant.id,
    scenario: mutant.scenario,
    from: mutant.from,
    to: mutant.to,
    status: killed ? "killed" : "survived",
    exit: result.status,
    output: `${result.stdout || ""}\n${result.stderr || ""}`.trim().split("\n").slice(-12).join("\n"),
  };
}

async function main() {
  const before = hashFile(ORIGINAL);
  const source = fs.readFileSync(ORIGINAL, "utf8");
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  try {
    execSync(`fuser -k ${PORT}/tcp`, { stdio: "ignore" });
  } catch {
    /* port was free */
  }
  const server = spawn("npx", ["next", "dev", "-p", PORT], {
    stdio: "inherit",
    env: { ...process.env, GAOTAI_DEFAULT_MODEL: process.env.GAOTAI_DEFAULT_MODEL || "default" },
  });
  const stop = () => server.kill("SIGTERM");
  process.on("exit", stop);

  const results = [];
  try {
    await waitForServer();
    for (const mutant of MUTANTS) {
      console.log(`\n=== gherkin mutant ${mutant.id} ===\n`);
      const row = runMutant(mutant, source);
      console.log(row.status, row.id);
      if (row.output) console.log(row.output);
      results.push(row);
    }
  } finally {
    stop();
  }

  const after = hashFile(ORIGINAL);
  if (after !== before) {
    throw new Error("features/gaotai-v1.feature was modified; restore the approved Chinese scenarios");
  }

  const summary = {
    source: ORIGINAL,
    sourceHash: before,
    killed: results.filter((r) => r.status === "killed").length,
    survived: results.filter((r) => r.status === "survived").length,
    results,
  };
  fs.writeFileSync("reports/gherkin-mutants/summary.json", JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ killed: summary.killed, survived: summary.survived }, null, 2));
  if (summary.survived) {
    console.error("gherkin mutants survived; tighten step defs or unit tests");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
