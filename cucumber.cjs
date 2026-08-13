module.exports = {
  default: {
    paths: ["features/gaotai-v1.feature"],
    requireModule: ["tsx/cjs"],
    require: ["features/support/register-zh.cjs", "features/steps/steps.ts"],
    format: ["progress"],
    timeout: 60000,
  },
};
