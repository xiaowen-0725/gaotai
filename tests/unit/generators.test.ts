import { describe, expect, it } from "vitest";
import {
  copyDocumentText,
  fakeTranscription,
  generateChatAnswer,
  highlightTextFromSelection,
  isReviseQuestion,
} from "@/domain/generators";
import { GaotaiStore } from "@/domain/store";
import type { MaterialFile } from "@/domain/types";

function file(partial: Partial<MaterialFile> & Pick<MaterialFile, "id" | "title">): MaterialFile {
  return {
    boardId: "b",
    kind: "document",
    body: "",
    folderId: null,
    selected: true,
    sourceFileIds: [],
    sourceHighlightIds: [],
    createdAt: "t",
    ...partial,
  };
}

describe("generators", () => {
  it("joins multiple chat sources with a顿号 and falls back when none are selected", () => {
    const a = file({ id: "1", title: "甲" });
    const b = file({ id: "2", title: "乙" });
    const withSources = generateChatAnswer("问", [a, b], []);
    expect(withSources.text).toContain("来源 file「甲」");
    expect(withSources.text).toContain("来源 file「乙」");
    expect(withSources.text).toContain("、");
    const empty = generateChatAnswer("问", [], []);
    expect(empty.text).toContain("已选材料");
    expect(empty.citedFileIds).toEqual([]);
  });

  it("takes the first 24 body characters when nothing is selected", () => {
    const body = "abcdefghijklmnopqrstuvwxyz0123";
    expect(highlightTextFromSelection({ title: "T", body }, "")).toBe(body.slice(0, 24));
    expect(highlightTextFromSelection({ title: "T", body }, "")).not.toBe(body);
    expect(highlightTextFromSelection({ title: "T", body: "" }, "")).toBe("T");
  });

  it("fails transcription from force, title, or url, independently", () => {
    expect(fakeTranscription(file({ id: "1", title: "ok.mp3" }), "failed").status).toBe("failed");
    expect(fakeTranscription(file({ id: "1", title: "FAIL.mp3" })).status).toBe("failed");
    expect(fakeTranscription(file({ id: "1", title: "ok.mp3", url: "https://cdn.example.com/fail-take.mp3" })).status).toBe(
      "failed",
    );
    expect(fakeTranscription(file({ id: "1", title: "ok.mp3" }), "success").status).toBe("success");
    expect(isReviseQuestion("更新")).toBe(true);
    expect(isReviseQuestion("改一下")).toBe(true);
  });

  it("emits the three timeline cues in order", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const audio = store.addLocalFile(board.id, "ok-audio.mp3", { mime: "audio/mpeg" });
    expect(audio.transcription?.cues).toEqual([
      { t: 0, text: "开场" },
      { t: 12, text: "要点" },
      { t: 30, text: "收束" },
    ]);
    expect(copyDocumentText(file({ id: "1", title: "T", body: "B" }))).toBe("T\n\nB");
  });
});
