import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

function walk(dir: string, acc: string[] = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (full.endsWith(".ts")) acc.push(full);
  }
  return acc;
}

describe("dependency rule", () => {
  it("keeps domain free of IO-near imports", () => {
    for (const file of walk("src/domain")) {
      const src = fs.readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/from ["']next(\/|$)/);
      expect(src, file).not.toMatch(/from ["']react(\/|$)/);
      expect(src, file).not.toMatch(/from ["']fs["']/);
      expect(src, file).not.toMatch(/from ["']node:/);
      expect(src, file).not.toMatch(/from ["']@\/adapters/);
      expect(src, file).not.toMatch(/from ["']@\/lib/);
      expect(src, file).not.toMatch(/from ["']@\/components/);
      expect(src, file).not.toMatch(/from ["']@\/app/);
      expect(src, file).not.toMatch(/\bfetch\s*\(/);
      expect(src, file).not.toMatch(/\bdocument\./);
      expect(src, file).not.toMatch(/\bwindow\./);
      expect(src, file).not.toMatch(/FileReader/);
      expect(src, file).not.toMatch(/navigator\.clipboard/);
    }
  });
});
