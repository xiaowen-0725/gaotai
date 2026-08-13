/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
  },
  mutate: [
    "src/domain/**/*.ts",
    "src/adapters/**/*.ts",
    "!src/domain/types.ts",
    "!src/domain/index.ts",
  ],
  ignorePatterns: [".next", ".data", "features", "reports", "playwright-report"],
  reporters: ["clear-text", "json", "html"],
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  htmlReporter: { fileName: "reports/mutation/index.html" },
  timeoutMS: 60000,
  timeoutFactor: 2,
  concurrency: 2,
  disableTypeChecks: true,
  incremental: false,
};
