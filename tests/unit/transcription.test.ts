import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";

describe("Transcription", () => {
  it("succeeds with timeline cues", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const audio = store.addLocalFile(board.id, "ok-audio.mp3", { mime: "audio/mpeg" });
    store.setTranscription(audio.id, "success");
    expect(audio.transcription?.status).toBe("success");
    expect(audio.transcription?.cues?.length).toBeGreaterThan(0);
    expect(audio.transcription?.text).toContain("转录文本");
  });

  it("fails with a hint and does not block other files", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const audio = store.addLocalFile(board.id, "fail-audio.mp3", { mime: "audio/mpeg" });
    const other = store.addDocument(board.id, "另一篇");
    store.setTranscription(audio.id, "failed");
    expect(audio.transcription?.status).toBe("failed");
    expect(audio.transcription?.error).toBe("转录失败");
    expect(store.requireFile(other.id).title).toBe("另一篇");
    expect(store.requireFile(audio.id).title).toBe("fail-audio.mp3");
  });
});
