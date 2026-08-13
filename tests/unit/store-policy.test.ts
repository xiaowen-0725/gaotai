import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";

describe("store policy", () => {
  it("uses default names and the specified author id as board owner", () => {
    const store = new GaotaiStore();
    expect(store.createBoard().name).toBe("未命名 Board");
    expect(store.boards[0].ownerId).toBe("author-1");
    expect(store.addDocument(store.boards[0].id).title).toBe("未命名文档");
    expect(store.addDocument(store.boards[0].id).body).toBe("");
    expect(store.createFolder(store.boards[0].id).name).toBe("新文件夹");
  });

  it("resets to an empty snapshot without dropping the default author", () => {
    const store = new GaotaiStore();
    store.createBoard("Chaos");
    store.reset();
    expect(store.boards).toEqual([]);
    expect(store.files).toEqual([]);
    expect(store.author).toEqual({ id: "author-1", name: "zhoujw07", plan: "Free" });
    expect(store.currentBoardId).toBeNull();
  });

  it("moves current board to the remaining first board, or null", () => {
    const store = new GaotaiStore();
    const a = store.createBoard("A");
    const b = store.createBoard("B");
    expect(store.currentBoardId).toBe(b.id);
    store.deleteBoard(a.id);
    expect(store.currentBoardId).toBe(b.id);
    store.deleteBoard(b.id);
    expect(store.currentBoardId).toBeNull();
    expect(store.boards).toEqual([]);
  });

  it("ensureBoard returns the current board, or adopts the first, or throws", () => {
    const store = new GaotaiStore();
    expect(() => store.ensureBoard()).toThrow("须先创建或选择一个 Board 才能继续");
    const a = store.createBoard("A");
    const b = store.createBoard("B");
    store.setCurrentBoard(a.id);
    expect(store.ensureBoard().id).toBe(a.id);
    store.currentBoardId = null;
    expect(store.ensureBoard().id).toBe(a.id);
    expect(store.currentBoardId).toBe(a.id);
    expect(b.id).not.toBe(a.id);
  });

  it("throws the specified missing-entity errors", () => {
    const store = new GaotaiStore();
    expect(() => store.requireBoard("missing")).toThrow("Board 不存在");
    expect(() => store.requireFile("missing")).toThrow("File 不存在");
    expect(() => store.setCurrentBoard("missing")).toThrow("Board 不存在");
    expect(() => store.askChat("missing", "问")).toThrow("Task 不存在");
    expect(() => store.toggleHighlight("missing")).toThrow("高亮不存在");
  });

  it("assignDefined writes empty strings and false, but skips undefined", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addDocument(board.id, "标题", "正文");
    store.updateFile(file.id, { title: undefined, selected: true });
    expect(store.requireFile(file.id).title).toBe("标题");
    expect(store.requireFile(file.id).selected).toBe(true);
    store.updateFile(file.id, { title: "", selected: false });
    expect(store.requireFile(file.id).title).toBe("");
    expect(store.requireFile(file.id).selected).toBe(false);
  });

  it("toggles highlight when selected is omitted, and honors an explicit flag", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addDocument(board.id, "甲");
    const hl = store.addHighlight(file.id, "摘");
    expect(hl.selected).toBe(true);
    store.toggleHighlight(hl.id);
    expect(store.highlights[0].selected).toBe(false);
    store.toggleHighlight(hl.id, true);
    expect(store.highlights[0].selected).toBe(true);
    store.toggleHighlight(hl.id, false);
    expect(store.highlights[0].selected).toBe(false);
  });

  it("ungroups a file with null and rejects a missing folder", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addDocument(board.id, "甲");
    const folder = store.createFolder(board.id, "资料");
    store.moveFileToFolder(file.id, folder.id);
    expect(store.requireFile(file.id).folderId).toBe(folder.id);
    store.moveFileToFolder(file.id, null);
    expect(store.requireFile(file.id).folderId).toBeNull();
    expect(() => store.moveFileToFolder(file.id, "nope")).toThrow("文件夹不存在");
  });

  it("attaches transcripts only to audio and video", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    expect(store.addLocalFile(board.id, "shot.png", { mime: "image/png" }).transcription).toBeUndefined();
    expect(store.addDocument(board.id, "笔记").transcription).toBeUndefined();
    expect(store.addLocalFile(board.id, "ok.mp3", { mime: "audio/mpeg" }).transcription?.status).toBe("success");
    expect(store.addLocalFile(board.id, "ok.mp4", { mime: "video/mp4" }).transcription?.status).toBe("success");
  });

  it("omits selected write documents from later write sources", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const src = store.addDocument(board.id, "原料", "正文");
    store.updateFile(src.id, { selected: true });
    const long = store.generateWrite(board.id, "长文");
    store.updateFile(long.id, { selected: true });
    const outline = store.generateWrite(board.id, "短文提纲");
    expect(outline.sourceFileIds).toEqual([src.id]);
    expect(outline.sourceFileIds).not.toContain(long.id);
    expect(store.tasks.some((t) => t.title === "Write · 长文" && t.writeFileId === long.id)).toBe(true);
  });

  it("revises only when both a current file and a revise question are present", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const current = store.generateWrite(board.id, "长文");
    const before = current.body;
    const task = store.startChatTask(board.id, "改");
    const chat = store.askChat(task.id, "修改当前这篇");
    expect(store.requireFile(current.id).body).toBe(before);
    expect(chat.ranForSeconds).toBe(5);
    const still = store.askChat(task.id, "你好", current.id);
    expect(store.requireFile(current.id).body).toBe(before);
    expect(still.ranForSeconds).toBe(5);
    const revised = store.askChat(task.id, "修改当前这篇", current.id);
    expect(store.requireFile(current.id).body).toContain("修订");
    expect(revised.ranForSeconds).toBe(3);
    expect(revised.text).toContain("没有另存");
  });

  it("reuses an existing share and returns null for each broken lookup", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addDocument(board.id, "甲", "正文");
    const first = store.createShare(file.id);
    const again = store.createShare(file.id);
    expect(again.token).toBe(first.token);
    expect(store.shareLinks).toHaveLength(1);
    expect(store.getShare(first.token)?.file.id).toBe(file.id);
    expect(store.getShare("missing")).toBeNull();
    const danglingFile = new GaotaiStore();
    danglingFile.load({
      ...store.snapshot(),
      files: [],
    });
    expect(danglingFile.getShare(first.token)).toBeNull();
    const danglingBoard = new GaotaiStore();
    danglingBoard.load({
      ...store.snapshot(),
      boards: [],
    });
    expect(danglingBoard.getShare(first.token)).toBeNull();
    expect(store.copyFile(file.id)).toBe("甲\n\n正文");
  });
});
