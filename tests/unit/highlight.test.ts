import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";

describe("Highlight", () => {
  it("belongs to the file and can be checked for Task or Write", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addLink(board.id, "https://example.com/a");
    const hl = store.addHighlight(file.id, "knowledge management");
    expect(hl.fileId).toBe(file.id);
    expect(hl.boardId).toBe(board.id);
    expect(hl.selected).toBe(true);
    store.toggleHighlight(hl.id, false);
    expect(store.highlights[0].selected).toBe(false);
    store.toggleHighlight(hl.id, true);
    expect(store.highlights[0].selected).toBe(true);
  });
});
