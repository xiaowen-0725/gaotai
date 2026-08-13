import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";

describe("Board", () => {
  it("creates a board owned by the author and sets it current", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    expect(board.name).toBe("Chaos");
    expect(board.ownerId).toBe(store.author.id);
    expect(store.currentBoardId).toBe(board.id);
    expect(store.boards).toHaveLength(1);
  });

  it("renames a board", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("旧名");
    store.renameBoard(board.id, "新名称");
    expect(store.boards[0].name).toBe("新名称");
  });

  it("deletes own board and drops it from the list", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("待删");
    store.deleteBoard(board.id);
    expect(store.boards.find((b) => b.id === board.id)).toBeUndefined();
  });

  it("switches current board", () => {
    const store = new GaotaiStore();
    const a = store.createBoard("A");
    const b = store.createBoard("B");
    store.setCurrentBoard(a.id);
    expect(store.currentBoardId).toBe(a.id);
    store.setCurrentBoard(b.id);
    expect(store.currentBoardId).toBe(b.id);
  });

  it("requires a board before continuing a new task", () => {
    const store = new GaotaiStore();
    expect(() => store.ensureBoard()).toThrow("须先创建或选择一个 Board 才能继续");
  });
});
