const languages = require("@cucumber/gherkin/dist/src/gherkin-languages.json");
if (!languages.zh && languages["zh-CN"]) {
  languages.zh = languages["zh-CN"];
}

try {
  const gherkin = require("@cucumber/gherkin");
  if (gherkin.dialects && !gherkin.dialects.zh && gherkin.dialects["zh-CN"]) {
    gherkin.dialects.zh = gherkin.dialects["zh-CN"];
  }
} catch {
  /* cucumber will load this later; JSON mutation is enough */
}
