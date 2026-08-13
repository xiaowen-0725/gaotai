import { describe, expect, it } from "vitest";
import { GaotaiStore } from "@/domain/store";

describe("Task chat", () => {
  it("answers from selected files and highlights and cites them", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    const file = store.addLink(board.id, "https://example.com/km");
    store.updateFile(file.id, { selected: true, title: "Knowledge management" });
    const hl = store.addHighlight(file.id, "组织知识");
    const task = store.startChatTask(board.id, "定义");
    const answer = store.askChat(task.id, "一句话解释知识管理");
    expect(answer.role).toBe("assistant");
    expect(answer.text).toContain("Knowledge management");
    expect(answer.text).toContain("组织知识");
    expect(answer.citedFileIds).toContain(file.id);
    expect(answer.citedHighlightIds).toContain(hl.id);
    expect(answer.ranForSeconds).toBeGreaterThan(0);
  });

  it("allows chat without any write document", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    expect(store.files.some((f) => f.kind === "write")).toBe(false);
    const task = store.startChatTask(board.id, "闲聊");
    const answer = store.askChat(task.id, "你好");
    expect(answer.text.length).toBeGreaterThan(0);
  });

  it("updates the current document in place instead of saving a copy", () => {
    const store = new GaotaiStore();
    const board = store.createBoard("Chaos");
    store.addDocument(board.id, "甲", "正文甲").selected = true;
    const current = store.generateWrite(board.id, "长文");
    const other = store.generateWrite(board.id, "短文提纲");
    const otherBody = other.body;
    const task = store.startChatTask(board.id, "改稿");
    store.askChat(task.id, "修改当前这篇：加一句收束", current.id);
    expect(store.files.filter((f) => f.kind === "write")).toHaveLength(2);
    expect(store.requireFile(current.id).body).toContain("修订");
    expect(store.requireFile(other.id).body).toBe(otherBody);
  });
});
