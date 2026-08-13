export function runCreatePick(key: string, runs: Record<string, () => void>, fallback: () => void) {
  const run = runs[key];
  if (run) {
    run();
    return;
  }
  fallback();
}
