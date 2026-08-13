import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";

describe("File / sources", () => {
  it("adds a web link and a local file to Your files", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const web = store.addLink(board.id, "https://en.wikipedia.org/wiki/Knowledge_management");
    const local = store.addLocalFile(board.id, "notes.txt", { body: "hello" });
    expect(web.kind).toBe("web");
    expect(local.kind).toBe("document");
    expect(store.files.filter((f) => f.boardId === board.id)).toHaveLength(2);
  });

  it("classifies youtube, image and audio", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const yt = store.addLink(board.id, "https://www.youtube.com/watch?v=abc");
    const img = store.addLocalFile(board.id, "cover.png", { mime: "image/png" });
    const audio = store.addLocalFile(board.id, "voice.mp3", { mime: "audio/mpeg" });
    expect(yt.kind).toBe("youtube");
    expect(img.kind).toBe("image");
    expect(audio.kind).toBe("audio");
  });

  it("creates an editable document without a separate note object", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const doc = store.addDocument(board.id, "想法", "一段想法");
    expect(doc.kind).toBe("document");
    expect(store.files.every((f) => f.kind !== ("note" as string))).toBe(true);
  });

  it("puts a file in a folder while ungrouped files stay visible", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const a = store.addDocument(board.id, "甲");
    const b = store.addDocument(board.id, "乙");
    const folder = store.createFolder(board.id, "资料");
    store.moveFileToFolder(a.id, folder.id);
    expect(store.files.find((f) => f.id === a.id)?.folderId).toBe(folder.id);
    expect(store.files.find((f) => f.id === b.id)?.folderId).toBeNull();
  });

  it("does not wipe title when only toggling selected", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addDocument(board.id, "file甲", "正文");
    store.updateFile(file.id, { selected: true });
    expect(store.requireFile(file.id).title).toBe("file甲");
    expect(store.requireFile(file.id).selected).toBe(true);
  });

  it("does not invent a kanban collection", () => {
    const store = new GaotaiStore();
    expect((store as unknown as { kanban?: unknown }).kanban).toBeUndefined();
  });
});
