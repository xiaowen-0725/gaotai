import type { Highlight, MaterialFile } from "./types";

export { classifyLink, classifyLocalName } from "./classify";
export { generateWriteContent } from "./write-templates";

export function generateChatAnswer(
  question: string,
  files: MaterialFile[],
  highlights: Highlight[],
): { text: string; citedFileIds: string[]; citedHighlightIds: string[] } {
  const citedFileIds = files.map((f) => f.id);
  const citedHighlightIds = highlights.map((h) => h.id);
  const fileBits = files.map((f) => `来源 file「${f.title}」`);
  const highlightBits = highlights.map((h) => `高亮「${h.text}」`);
  const cites = [...fileBits, ...highlightBits].join("、") || "已选材料";
  const text = `依据 ${cites}：${question} 的要点是，先回到上述来源再作答。`;
  return { text, citedFileIds, citedHighlightIds };
}

export function applyChatEdit(current: MaterialFile, instruction: string): MaterialFile {
  return {
    ...current,
    body: `${current.body}\n\n（修订）${instruction}`,
  };
}

export function copyDocumentText(file: MaterialFile): string {
  return `${file.title}\n\n${file.body}`;
}

export function isReviseQuestion(question: string) {
  return /修改|改一下|更新/.test(question);
}

export function fakeTranscription(file: MaterialFile, force?: "success" | "failed") {
  const failHint = force === "failed" || `${file.title}${file.url || ""}`.toLowerCase().includes("fail");
  if (failHint) {
    return {
      status: "failed" as const,
      error: "转录失败",
    };
  }
  return {
    status: "success" as const,
    text: `这是「${file.title}」的转录文本。`,
    cues: [
      { t: 0, text: "开场" },
      { t: 12, text: "要点" },
      { t: 30, text: "收束" },
    ],
  };
}
