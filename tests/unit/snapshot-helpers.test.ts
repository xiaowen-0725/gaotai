import { describe, expect, it } from "vitest";
import { copyDocumentText, isReviseQuestion } from "@/domain/generators";
import { filledSnapshot } from "@/domain/snapshot";
import { topicFrom } from "@/domain/write-templates";
import { canvasMode, composerBoardId, fileViewKind, homeTabAction, questionToAsk } from "@/components/file-view";
import { showArchivedEmpty, boardsOnTab, boardListClass, toggleClass, switcherName } from "@/components/board-list";
import { runCreatePick } from "@/components/composer-actions";
import { materialsProgress, sourceBatch } from "@/components/source-batch";
import { readLocalTextBody } from "@/adapters/browser";
import { runAuthorAction } from "@/adapters/author-action";
import { GaotaiStore } from "@/domain/store";

describe("snapshot and copy helpers", () => {
  it("fills a snapshot without wiping provided fields", () => {
    const next = filledSnapshot({
      boards: [{ id: "b1", name: "A", ownerId: "author-1", archived: false, createdAt: "t" }],
    });
    expect(next.currentBoardId).toBe("b1");
    expect(next.author.name).toBe("zhoujw07");
    expect(filledSnapshot({ currentBoardId: "keep" }).currentBoardId).toBe("keep");
    expect(filledSnapshot({ currentBoardId: null }).currentBoardId).toBeNull();
    expect(filledSnapshot({
      boards: [{ id: "b1", name: "A", ownerId: "author-1", archived: false, createdAt: "t" }],
      currentBoardId: null,
    }).currentBoardId).toBe("b1");
    expect(filledSnapshot({}).boards).toEqual([]);
  });

  it("copies any document as title plus body", () => {
    expect(copyDocumentText({
      id: "1",
      boardId: "b",
      kind: "write",
      title: "T",
      body: "B",
      folderId: null,
      selected: false,
      sourceFileIds: [],
      sourceHighlightIds: [],
      createdAt: "t",
      writeGenre: "长文",
    })).toBe("T\n\nB");
  });

  it("detects revise questions and topics", () => {
    expect(isReviseQuestion("修改当前这篇")).toBe(true);
    expect(isReviseQuestion("随便问问")).toBe(false);
    expect(topicFrom([{ title: "甲" } as never], [])).toBe("甲");
    expect(topicFrom([], [{ text: "摘" } as never])).toBe("摘");
    expect(topicFrom([], [])).toBe("主题");
  });
});

describe("ui decision helpers", () => {
  it("maps file kinds and home tabs", () => {
    expect(fileViewKind("write")).toBe("document");
    expect(fileViewKind("youtube")).toBe("media");
    expect(homeTabAction("Write")).toBe("write");
    expect(homeTabAction("Research")).toBe("research");
    expect(homeTabAction("Image")).toBe("stub");
    expect(homeTabAction("For you")).toBe("none");
  });

  it("picks composer board, question, canvas mode, archived empty", async () => {
    expect(composerBoardId(null, "b2")).toBe("b2");
    expect(composerBoardId("b1", "b2")).toBe("b1");
    expect(questionToAsk("  hi  ")).toBe("hi");
    expect(questionToAsk("   ")).toBeNull();
    expect(canvasMode({ newTaskOpen: true, hasTask: true, hasFile: true })).toBe("new-task");
    expect(canvasMode({ newTaskOpen: false, hasTask: true, hasFile: true })).toBe("chat");
    expect(canvasMode({ newTaskOpen: false, hasTask: false, hasFile: true })).toBe("file");
    expect(canvasMode({ newTaskOpen: false, hasTask: false, hasFile: false })).toBe("wall");
    expect(showArchivedEmpty("Archived", 0)).toBe(true);
    expect(showArchivedEmpty("Active", 0)).toBe(false);
    expect(boardsOnTab([{ archived: false }, { archived: true }], "Active")).toEqual([{ archived: false }]);
    expect(boardsOnTab([{ archived: false }, { archived: true }], "Archived")).toEqual([{ archived: true }]);
    expect(boardListClass("grid")).toBe("grid");
    expect(boardListClass("list")).toBe("card-row");
    expect(toggleClass("pill", true)).toBe("pill active");
    expect(toggleClass("pill", false)).toBe("pill");
    expect(switcherName(undefined)).toBe("选择 Board");
    expect(switcherName({ name: "Alpha" })).toBe("Alpha");
    expect(materialsProgress(1, 3)).toBe("Adding materials… (1/3)");
    expect(sourceBatch("https://a.com\nhttps://b.com", null).urls).toHaveLength(2);
    expect(sourceBatch("", [{ name: "a.txt" }]).total).toBe(1);
    await expect(readLocalTextBody({ type: "text/plain", text: async () => "hi" })).resolves.toBe("hi");
    await expect(readLocalTextBody({ type: "image/png", text: async () => "no" })).resolves.toBeUndefined();
  });

  it("runs create-menu picks or the stub fallback", () => {
    const hits: string[] = [];
    runCreatePick("write", { write: () => hits.push("write") }, () => hits.push("stub"));
    runCreatePick("image", { write: () => hits.push("write") }, () => hits.push("stub"));
    expect(hits).toEqual(["write", "stub"]);
  });
});

describe("runAuthorAction", () => {
  it("dispatches known actions and rejects unknown ones", () => {
    const store = new GaotaiStore();
    const board = runAuthorAction(store, "createBoard", { name: "Chaos" }) as { id: string; name: string };
    expect(board.name).toBe("Chaos");
    expect(() => runAuthorAction(store, "nope", {})).toThrow("未知操作 nope");
    const copied = runAuthorAction(store, "addDocument", { boardId: board.id, title: "D", body: "x" }) as { id: string };
    expect(store.requireFile(copied.id).title).toBe("D");
    const unnamed = runAuthorAction(store, "createBoard", { name: "" }) as { name: string };
    expect(unnamed.name).toBe("未命名 Board");
    runAuthorAction(store, "updateFile", { id: copied.id, selected: true });
    expect(store.requireFile(copied.id).title).toBe("D");
  });
});
