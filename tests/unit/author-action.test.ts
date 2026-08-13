import { describe, expect, it } from "vitest";
import { runAuthorAction } from "@/adapters/author-action";
import { GaotaiStore } from "@/domain/store";

describe("author-action adapter", () => {
  it("falls back empty names and keeps unknown ops rejected", () => {
    const store = new GaotaiStore();
    expect((runAuthorAction(store, "createBoard", { name: "" }) as { name: string }).name).toBe("未命名 Board");
    expect((runAuthorAction(store, "createBoard", {}) as { name: string }).name).toBe("未命名 Board");
    expect(() => runAuthorAction(store, "nope", {})).toThrow("未知操作 nope");
  });

  it("maps folderId null, missing, and a real id without wiping other fields", () => {
    const store = new GaotaiStore();
    const board = runAuthorAction(store, "createBoard", { name: "Chaos" }) as { id: string };
    const file = runAuthorAction(store, "addDocument", { boardId: board.id, title: "甲", body: "正文" }) as { id: string };
    const folder = runAuthorAction(store, "createFolder", { boardId: board.id, name: "" }) as { id: string; name: string };
    expect(folder.name).toBe("新文件夹");
    runAuthorAction(store, "moveFileToFolder", { fileId: file.id, folderId: folder.id });
    expect(store.requireFile(file.id).folderId).toBe(folder.id);
    runAuthorAction(store, "updateFile", { id: file.id, folderId: null, title: undefined });
    expect(store.requireFile(file.id).folderId).toBeNull();
    expect(store.requireFile(file.id).title).toBe("甲");
    runAuthorAction(store, "updateFile", { id: file.id, selected: true });
    expect(store.requireFile(file.id).selected).toBe(true);
    expect(store.requireFile(file.id).title).toBe("甲");
  });

  it("treats only outcome=failed as a failed transcription", () => {
    const store = new GaotaiStore();
    const board = runAuthorAction(store, "createBoard", { name: "Chaos" }) as { id: string };
    const audio = runAuthorAction(store, "addLocalFile", {
      boardId: board.id,
      name: "ok.mp3",
      mime: "audio/mpeg",
    }) as { id: string };
    runAuthorAction(store, "setTranscription", { fileId: audio.id, outcome: "nope" });
    expect(store.requireFile(audio.id).transcription?.status).toBe("success");
    runAuthorAction(store, "setTranscription", { fileId: audio.id, outcome: "failed" });
    expect(store.requireFile(audio.id).transcription?.status).toBe("failed");
  });

  it("adds pasted links, starts chat with a default title, and copies a file", () => {
    const store = new GaotaiStore();
    const board = runAuthorAction(store, "createBoard", { name: "Chaos" }) as { id: string };
    const links = runAuthorAction(store, "addLinks", {
      boardId: board.id,
      text: "https://a.com https://b.com",
    }) as Array<{ url?: string }>;
    expect(links).toHaveLength(2);
    const task = runAuthorAction(store, "startChat", { boardId: board.id }) as { title: string; id: string };
    expect(task.title).toBe("Chat");
    const file = runAuthorAction(store, "addDocument", { boardId: board.id, title: "甲", body: "正文" }) as { id: string };
    expect(runAuthorAction(store, "copyFile", { fileId: file.id })).toEqual({ text: "甲\n\n正文" });
    runAuthorAction(store, "updateFile", { id: file.id, selected: true });
    const hl = runAuthorAction(store, "addHighlight", { fileId: file.id, text: "摘" }) as { id: string; selected: boolean };
    expect(hl.selected).toBe(true);
    runAuthorAction(store, "toggleHighlight", { id: hl.id });
    expect(store.highlights[0].selected).toBe(false);
    const share = runAuthorAction(store, "createShare", { fileId: file.id }) as { token: string };
    expect(share.token.startsWith("share-")).toBe(true);
  });
});
