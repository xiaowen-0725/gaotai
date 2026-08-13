import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";
import { copyDocumentText } from "@/domain/generators";

describe("Copy and Share", () => {
  function withWrites() {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const src = store.addDocument(board.id, "原料", "正文");
    store.updateFile(src.id, { selected: true });
    const long = store.generateWrite(board.id, "长文");
    const outline = store.generateWrite(board.id, "短文提纲");
    const xhs = store.generateWrite(board.id, "小红书图文");
    const script = store.generateWrite(board.id, "口播稿");
    return { store, board, long, outline, xhs, script };
  }

  it("copies 长文 as plain text with title, body and sources", () => {
    const { long } = withWrites();
    const text = copyDocumentText(long);
    expect(text).toContain(long.title);
    expect(text).toContain("来源");
    expect(text).not.toMatch(/<[^>]+>/);
  });

  it("copies 短文提纲 as topic plus nested outline", () => {
    const { outline } = withWrites();
    const text = copyDocumentText(outline);
    expect(text).toContain("主题");
    expect(text).toMatch(/-/);
  });

  it("copies 小红书图文 with title, body and tags, no image binary", () => {
    const { xhs } = withWrites();
    const text = copyDocumentText(xhs);
    expect(text).toContain(xhs.title);
    expect(text).toMatch(/#\S+/);
    expect(text).not.toContain("data:image");
  });

  it("copies 口播稿 in speaking order with section cues", () => {
    const { script } = withWrites();
    const text = copyDocumentText(script);
    expect(text.indexOf("开场钩子")).toBeLessThan(text.indexOf("展开点"));
    expect(text.indexOf("展开点")).toBeLessThan(text.indexOf("收束"));
    expect(text).not.toContain("配音");
    expect(text).not.toContain("视频文件");
  });

  it("creates a per-document share link and invalidates it when the board is deleted", () => {
    const { store, board, long, outline } = withWrites();
    const share = store.createShare(long.id);
    expect(store.getShare(share.token)?.file.id).toBe(long.id);
    expect(store.createShare(outline.id).token).not.toBe(share.token);
    store.deleteBoard(board.id);
    expect(store.getShare(share.token)).toBeNull();
    expect(store.boards.find((b) => b.id === board.id)).toBeUndefined();
  });
});
