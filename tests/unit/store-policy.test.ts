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
    const c = store.createBoard("C");
    expect(store.currentBoardId).toBe(c.id);
    store.deleteBoard(a.id);
    expect(store.currentBoardId).toBe(c.id);
    expect(store.currentBoardId).not.toBe(b.id);
    store.deleteBoard(c.id);
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

  it("deletes only the target board's files, highlights, tasks, folders and shares", () => {
    const store = new GaotaiStore();
    const keep = store.createBoard("Keep");
    const drop = store.createBoard("Drop");
    const keepFile = store.addDocument(keep.id, "留");
    const dropFile = store.addDocument(drop.id, "删");
    store.updateFile(keepFile.id, { selected: true });
    store.updateFile(dropFile.id, { selected: true });
    const keepHl = store.addHighlight(keepFile.id, "留摘");
    const dropHl = store.addHighlight(dropFile.id, "删摘");
    const keepFolder = store.createFolder(keep.id, "留夹");
    const dropFolder = store.createFolder(drop.id, "删夹");
    const keepTask = store.startChatTask(keep.id, "留聊");
    const dropTask = store.startChatTask(drop.id, "删聊");
    const keepShare = store.createShare(keepFile.id);
    const dropShare = store.createShare(dropFile.id);
    store.setCurrentBoard(keep.id);
    store.deleteBoard(drop.id);
    expect(store.currentBoardId).toBe(keep.id);
    expect(store.boards.map((b) => b.id)).toEqual([keep.id]);
    expect(store.files.map((f) => f.id)).toEqual([keepFile.id]);
    expect(store.highlights.map((h) => h.id)).toEqual([keepHl.id]);
    expect(store.folders.map((f) => f.id)).toEqual([keepFolder.id]);
    expect(store.tasks.map((t) => t.id)).toEqual([keepTask.id]);
    expect(store.shareLinks.map((s) => s.token)).toEqual([keepShare.token]);
    expect(store.getShare(dropShare.token)).toBeNull();
    expect(store.requireBoard(keep.id).id).toBe(keep.id);
    expect(store.askChat(keepTask.id, "仍在").text.length).toBeGreaterThan(0);
    expect(() => store.askChat(dropTask.id, "已删")).toThrow("Task 不存在");
  });

  it("scopes write sources and chat cites to the current board", () => {
    const store = new GaotaiStore();
    const a = store.createBoard("A");
    const b = store.createBoard("B");
    const aFile = store.addDocument(a.id, "甲", "正文甲");
    const bFile = store.addDocument(b.id, "乙", "正文乙");
    store.updateFile(aFile.id, { selected: true });
    store.updateFile(bFile.id, { selected: true });
    const aHl = store.addHighlight(aFile.id, "摘甲");
    store.addHighlight(bFile.id, "摘乙");
    const doc = store.generateWrite(a.id, "长文");
    expect(doc.sourceFileIds).toEqual([aFile.id]);
    expect(doc.sourceHighlightIds).toEqual([aHl.id]);
    expect(doc.selected).toBe(false);
    expect(doc.sourceFileIds).not.toContain(bFile.id);
    const writeTask = store.tasks.find((t) => t.writeFileId === doc.id);
    expect(writeTask?.kind).toBe("write");
    expect(writeTask?.messages).toEqual([]);
    const task = store.startChatTask(a.id, "问");
    const answer = store.askChat(task.id, "解释");
    expect(answer.citedFileIds).toEqual([aFile.id]);
    expect(answer.citedHighlightIds).toEqual([aHl.id]);
    expect(answer.role).toBe("assistant");
    expect(task.messages[0]).toMatchObject({ role: "user", text: "解释" });
    expect(task.kind).toBe("chat");
    expect(task.messages[0].id.startsWith("msg-")).toBe(true);
    expect(answer.id.startsWith("msg-")).toBe(true);
  });

  it("uses prefixed ids and default flags on new records", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    expect(board.id.startsWith("board-")).toBe(true);
    expect(board.archived).toBe(false);
    const file = store.addDocument(board.id, "甲", "正文");
    expect(file.id.startsWith("file-")).toBe(true);
    expect(file.selected).toBe(false);
    expect(file.sourceFileIds).toEqual([]);
    expect(file.sourceHighlightIds).toEqual([]);
    expect(store.addHighlight(file.id, "摘").id.startsWith("hl-")).toBe(true);
    expect(store.createFolder(board.id, "夹").id.startsWith("folder-")).toBe(true);
    expect(store.startChatTask(board.id, "聊").id.startsWith("task-")).toBe(true);
    const write = store.generateWrite(board.id, "长文");
    expect(store.tasks.find((t) => t.writeFileId === write.id)?.id.startsWith("task-")).toBe(true);
    const revised = store.askChat(store.startChatTask(board.id, "改").id, "修改", write.id);
    expect(revised.role).toBe("assistant");
    expect(revised.citedFileIds).toEqual([write.id]);
    expect(revised.id.startsWith("msg-")).toBe(true);
  });

  it("invalidates a share when its board is gone but another board remains", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addDocument(board.id, "甲", "正文");
    const share = store.createShare(file.id);
    const other = new GaotaiStore();
    other.load({
      ...store.snapshot(),
      boards: [{ id: "other", name: "Other", ownerId: "author-1", archived: false, createdAt: "t" }],
    });
    expect(other.boards).toHaveLength(1);
    expect(other.getShare(share.token)).toBeNull();
  });

  it("ensureBoard keeps the second board when it is current", () => {
    const store = new GaotaiStore();
    const a = store.createBoard("A");
    const b = store.createBoard("B");
    store.setCurrentBoard(b.id);
    expect(store.ensureBoard().id).toBe(b.id);
    expect(store.ensureBoard().id).not.toBe(a.id);
  });
});

