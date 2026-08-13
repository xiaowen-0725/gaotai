import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { classifyLink, classifyLocalName, isTextMime } from "@/domain/classify";
import {
  copyDocumentText,
  generateWriteContent,
  highlightTextFromSelection,
  isReviseQuestion,
} from "@/domain/generators";
import { sharePath } from "@/domain/share";
import { GaotaiStore } from "@/domain/store";
import type { MaterialFile, WriteGenre } from "@/domain/types";
import { WRITE_GENRES } from "@/domain/write-templates";

const GENRES = WRITE_GENRES as WriteGenre[];
const titleArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s.trim().length > 0 && !/[<>]/.test(s));

function asWriteFile(genre: WriteGenre, title: string, body: string): MaterialFile {
  return {
    id: "f",
    boardId: "b",
    kind: "write",
    title,
    body,
    folderId: null,
    selected: false,
    sourceFileIds: [],
    sourceHighlightIds: [],
    createdAt: "t",
    writeGenre: genre,
  };
}

describe("domain invariants", () => {
  it("classifies links and local names deterministically", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.webUrl(),
          fc.constant("https://www.youtube.com/watch?v=1"),
          fc.constant("https://youtu.be/2"),
          fc.string({ maxLength: 80 }),
        ),
        (url) => {
          expect(classifyLink(url)).toBe(classifyLink(url));
          expect(["youtube", "web"]).toContain(classifyLink(url));
        },
      ),
    );
    fc.assert(
      fc.property(
        fc.oneof(fc.constantFrom("a.png", "b.JPG", "c.mp3", "d.wav", "e.mp4", "notes.txt", "x"), fc.string({ maxLength: 40 })),
        fc.option(fc.constantFrom("image/png", "audio/mpeg", "video/mp4", "text/plain", ""), { nil: undefined }),
        (name, mime) => {
          const kind = classifyLocalName(name, mime);
          expect(kind).toBe(classifyLocalName(name, mime));
          expect(["image", "audio", "video", "document"]).toContain(kind);
        },
      ),
    );
  });

  it("never lets one write overwrite another, including the same genre twice", () => {
    fc.assert(
      fc.property(fc.constantFrom(...GENRES), fc.constantFrom(...GENRES), titleArb, (first, second, title) => {
        const store = new GaotaiStore();
        const board = store.createBoard("Chaos");
        const src = store.addDocument(board.id, title, "正文");
        store.updateFile(src.id, { selected: true });
        const a = store.generateWrite(board.id, first);
        const before = a.body;
        const b = store.generateWrite(board.id, second);
        expect(a.id).not.toBe(b.id);
        expect(store.requireFile(a.id).body).toBe(before);
        expect(store.files.filter((f) => f.kind === "write")).toHaveLength(2);
      }),
    );
  });

  it("omits unchecked files and highlights from generated sources", () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), fc.constantFrom(...GENRES), (flags, genre) => {
        const store = new GaotaiStore();
        const board = store.createBoard("Chaos");
        const files = flags.map((selected, i) => {
          const file = store.addDocument(board.id, `file-${i}`, "x");
          store.updateFile(file.id, { selected });
          const hl = store.addHighlight(file.id, `hl-${i}`);
          store.toggleHighlight(hl.id, selected);
          return { file, selected, hl };
        });
        const doc = store.generateWrite(board.id, genre);
        const selectedIds = files.filter((f) => f.selected).map((f) => f.file.id);
        const uncheckedIds = files.filter((f) => !f.selected).map((f) => f.file.id);
        expect(doc.sourceFileIds).toEqual(selectedIds);
        uncheckedIds.forEach((id) => expect(doc.sourceFileIds).not.toContain(id));
        files
          .filter((f) => !f.selected)
          .forEach((f) => expect(doc.sourceHighlightIds).not.toContain(f.hl.id));
        expect(doc.sourceFileIds.every((id) => store.requireFile(id).kind !== "write")).toBe(true);
      }),
    );
  });

  it("cites only selected files and highlights in chat", () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), titleArb, (flags, question) => {
        const store = new GaotaiStore();
        const board = store.createBoard("Chaos");
        const picked = flags.map((selected, i) => {
          const file = store.addDocument(board.id, `file-${i}`, "x");
          store.updateFile(file.id, { selected });
          const hl = store.addHighlight(file.id, `hl-${i}`);
          store.toggleHighlight(hl.id, selected);
          return { file, selected, hl };
        });
        const task = store.startChatTask(board.id, "问");
        const answer = store.askChat(task.id, question);
        const selectedFileIds = new Set(picked.filter((p) => p.selected).map((p) => p.file.id));
        const selectedHlIds = new Set(picked.filter((p) => p.selected).map((p) => p.hl.id));
        if (isReviseQuestion(question)) {
          return;
        }
        (answer.citedFileIds ?? []).forEach((id) => expect(selectedFileIds.has(id)).toBe(true));
        (answer.citedHighlightIds ?? []).forEach((id) => expect(selectedHlIds.has(id)).toBe(true));
      }),
    );
  });

  it("deletes a board from the list and invalidates its share links", () => {
    fc.assert(
      fc.property(titleArb, (title) => {
        const store = new GaotaiStore();
        const board = store.createBoard("Chaos");
        const other = store.createBoard("Keep");
        const file = store.addDocument(board.id, title, "正文");
        const share = store.createShare(file.id);
        expect(store.getShare(share.token)?.file.id).toBe(file.id);
        store.deleteBoard(board.id);
        expect(store.boards.find((b) => b.id === board.id)).toBeUndefined();
        expect(store.boards.some((b) => b.id === other.id)).toBe(true);
        expect(store.getShare(share.token)).toBeNull();
      }),
    );
  });

  it("copies genre documents as title plus the required body fields", () => {
    fc.assert(
      fc.property(fc.constantFrom(...GENRES), titleArb, (genre, title) => {
        const content = generateWriteContent(genre, [{ title } as MaterialFile], []);
        const copied = copyDocumentText(asWriteFile(genre, content.title, content.body));
        expect(copied).toBe(`${content.title}\n\n${content.body}`);
        expect(copied).not.toMatch(/<\/?[a-zA-Z][^>]*>/);
        if (genre === "长文") expect(copied).toContain("来源");
        if (genre === "短文提纲") {
          expect(copied).toContain("主题");
          expect(copied).toMatch(/-/);
        }
        if (genre === "小红书图文") {
          expect(copied).toMatch(/#\S+/);
          expect(copied).toContain("建议配图");
          expect(copied).not.toContain("data:image");
        }
        if (genre === "口播稿") {
          expect(copied.indexOf("开场钩子")).toBeLessThan(copied.indexOf("展开点"));
          expect(copied.indexOf("展开点")).toBeLessThan(copied.indexOf("收束"));
          expect(copied).not.toContain("配音");
          expect(copied).not.toContain("视频文件");
        }
      }),
    );
  });

  it("round-trips a snapshot without IO", () => {
    fc.assert(
      fc.property(titleArb, fc.boolean(), (title, selected) => {
        const store = new GaotaiStore();
        const board = store.createBoard("Chaos");
        const file = store.addDocument(board.id, title, "正文");
        store.updateFile(file.id, { selected });
        store.addHighlight(file.id, "摘");
        store.createShare(file.id);
        const again = new GaotaiStore();
        again.load(JSON.parse(JSON.stringify(store.snapshot())));
        expect(again.boards.map((b) => b.id)).toEqual(store.boards.map((b) => b.id));
        expect(again.files.map((f) => ({ id: f.id, title: f.title, selected: f.selected }))).toEqual(
          store.files.map((f) => ({ id: f.id, title: f.title, selected: f.selected })),
        );
        expect(again.highlights.map((h) => h.text)).toEqual(store.highlights.map((h) => h.text));
        expect(again.shareLinks.map((s) => s.token)).toEqual(store.shareLinks.map((s) => s.token));
      }),
    );
  });

  it("revises the open document in place when the question asks to edit", () => {
    fc.assert(
      fc.property(fc.constantFrom("修改当前这篇", "改一下结尾", "更新这一段"), (question) => {
        const store = new GaotaiStore();
        const board = store.createBoard("Chaos");
        const current = store.generateWrite(board.id, "长文");
        const other = store.generateWrite(board.id, "短文提纲");
        const otherBody = other.body;
        const beforeCount = store.files.length;
        const task = store.startChatTask(board.id, "改");
        store.askChat(task.id, question, current.id);
        expect(store.files).toHaveLength(beforeCount);
        expect(store.requireFile(current.id).body).toContain("修订");
        expect(store.requireFile(other.id).body).toBe(otherBody);
      }),
    );
  });

  it("keeps highlight text and share path policy in domain", () => {
    fc.assert(
      fc.property(titleArb, fc.string({ maxLength: 12 }), (title, selected) => {
        const text = highlightTextFromSelection({ title, body: "abcdefghijklmnop" }, selected);
        expect(text).toBe(selected || "abcdefghijklmnop".slice(0, 24) || title);
      }),
    );
    expect(sharePath("tok-1")).toBe("/share/tok-1");
    expect(isTextMime("text/html")).toBe(true);
  });
});
