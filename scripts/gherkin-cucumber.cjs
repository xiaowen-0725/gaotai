module.exports = {
  default: {
    requireModule: ["tsx/cjs"],
    require: ["features/support/register-zh.cjs", "features/steps/steps.ts"],
    format: ["progress"],
    timeout: 60000,
  },
};
