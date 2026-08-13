import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";
import { generateWriteContent } from "@/domain/generators";

describe("Write genres", () => {
  function primed() {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const a = store.addDocument(board.id, "file甲", "甲正文");
    const b = store.addDocument(board.id, "file乙", "乙正文");
    store.updateFile(a.id, { selected: true });
    store.updateFile(b.id, { selected: false });
    store.addHighlight(a.id, "关键句");
    return { store, board, a, b };
  }

  it("generates 长文 with title, sectioned body and sources", () => {
    const { store, board, a } = primed();
    const doc = store.generateWrite(board.id, "长文");
    expect(doc.kind).toBe("write");
    expect(doc.writeGenre).toBe("长文");
    expect(doc.title.length).toBeGreaterThan(0);
    expect(doc.body).toMatch(/## /);
    expect(doc.body).toContain("来源");
    expect(doc.sourceFileIds).toContain(a.id);
    expect(store.tasks.some((t) => t.writeFileId === doc.id)).toBe(true);
  });

  it("generates 短文提纲 as nested bullets, not prose", () => {
    const { store, board } = primed();
    const doc = store.generateWrite(board.id, "短文提纲");
    expect(doc.body).toContain("主题：");
    expect(doc.body).toContain("这段写什么");
    expect(doc.body).toMatch(/^- /m);
    expect(doc.body.includes("## 引言")).toBe(false);
  });

  it("generates 小红书图文 with short title, sentences and required tags", () => {
    const { store, board } = primed();
    const doc = store.generateWrite(board.id, "小红书图文");
    expect(doc.title.length).toBeLessThan(40);
    expect(doc.body).toMatch(/#\S+/);
    expect(doc.body).toContain("建议配图");
    expect(doc.body).not.toContain("九宫格");
  });

  it("generates 口播稿 with hook, 2-4 points and close", () => {
    const { store, board } = primed();
    const doc = store.generateWrite(board.id, "口播稿");
    expect(doc.body).toContain("【开场钩子】");
    expect(doc.body).toContain("【收束】");
    const points = doc.body.match(/【展开点 \d+】/g) || [];
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(points.length).toBeLessThanOrEqual(4);
    expect(doc.body).not.toContain("分镜");
    expect(doc.body).not.toContain("配音");
  });

  it("can generate only one genre without requiring 长文 first", () => {
    const { store, board } = primed();
    store.generateWrite(board.id, "小红书图文");
    const writes = store.files.filter((f) => f.kind === "write");
    expect(writes).toHaveLength(1);
    expect(writes[0].writeGenre).toBe("小红书图文");
  });

  it("does not auto-convert an existing 长文 into other genres", () => {
    const { store, board } = primed();
    store.generateWrite(board.id, "长文");
    const genres = store.files.filter((f) => f.kind === "write").map((f) => f.writeGenre);
    expect(genres).toEqual(["长文"]);
  });

  it("keeps four sibling documents independent", () => {
    const { store, board } = primed();
    const a = store.generateWrite(board.id, "长文");
    const b = store.generateWrite(board.id, "短文提纲");
    const c = store.generateWrite(board.id, "小红书图文");
    const d = store.generateWrite(board.id, "口播稿");
    expect(new Set([a.id, b.id, c.id, d.id]).size).toBe(4);
    const old = b.body;
    store.updateFile(a.id, { body: a.body + "改" });
    expect(store.requireFile(b.id).body).toBe(old);
  });

  it("can generate the same genre twice independently", () => {
    const { store, board } = primed();
    const first = store.generateWrite(board.id, "小红书图文");
    const second = store.generateWrite(board.id, "小红书图文");
    expect(first.id).not.toBe(second.id);
    expect(store.files.filter((f) => f.writeGenre === "小红书图文")).toHaveLength(2);
  });

  it("omits unchecked files from sources", () => {
    const { store, board, a, b } = primed();
    const doc = store.generateWrite(board.id, "长文");
    expect(doc.sourceFileIds).toContain(a.id);
    expect(doc.sourceFileIds).not.toContain(b.id);
    expect(doc.body).toContain("file甲");
    expect(doc.body).not.toContain("file乙");
  });

  it("exposes four Chinese template names", () => {
    const names = ["长文", "短文提纲", "小红书图文", "口播稿"] as const;
    names.forEach((genre) => {
      const content = generateWriteContent(genre, [], []);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.body.length).toBeGreaterThan(0);
    });
  });
});
