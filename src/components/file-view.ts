import type { FileKind } from "@/domain/types";

export const FILE_KIND_VIEW = {
  web: "web",
  document: "document",
  write: "document",
  image: "image",
  audio: "media",
  video: "media",
  youtube: "media",
} as const;

export type FileViewKind = (typeof FILE_KIND_VIEW)[FileKind];

export function fileViewKind(kind: FileKind): FileViewKind {
  return FILE_KIND_VIEW[kind];
}

export const STUB_HOME_TABS = ["Image", "Slides", "Video", "Webpage"] as const;

export function homeTabAction(name: string): "write" | "research" | "stub" | "none" {
  if (name === "Write") return "write";
  if (name === "Research") return "research";
  if ((STUB_HOME_TABS as readonly string[]).includes(name)) return "stub";
  return "none";
}

export function composerBoardId(boardId?: string | null, currentBoardId?: string | null) {
  return boardId ?? currentBoardId ?? null;
}

export function questionToAsk(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed : null;
}

export function canvasMode(flags: { newTaskOpen: boolean; hasTask: boolean; hasFile: boolean }) {
  if (flags.newTaskOpen) return "new-task";
  if (flags.hasTask) return "chat";
  if (flags.hasFile) return "file";
  return "wall";
}
