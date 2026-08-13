import { spawn } from "child_process";
import { existsSync } from "fs";

const PORT = process.env.PORT || "3000";
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
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

async function main() {
  if (!existsSync("node_modules/playwright")) {
    throw new Error("playwright is not installed");
  }
  const server = spawn("npx", ["next", "dev", "-p", PORT], {
    stdio: "inherit",
    env: {
      ...process.env,
      GAOTAI_DEFAULT_MODEL: process.env.GAOTAI_DEFAULT_MODEL || "default",
    },
  });
  const stop = () => {
    server.kill("SIGTERM");
  };
  process.on("exit", stop);
  try {
    await waitForServer();
    await run("npx", ["cucumber-js", "features/gaotai-v1.feature"], {
      env: { ...process.env, BASE_URL: BASE },
    });
  } finally {
    stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
