import { NextResponse } from "next/server";
import { withStore } from "@/lib/server-store";
import { defaultModel, isAuthorLoggedIn } from "@/lib/session";
import type { WriteGenre } from "@/domain/types";

export async function POST(req: Request) {
  if (!isAuthorLoggedIn()) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { type, payload } = (await req.json()) as { type: string; payload?: Record<string, unknown> };
  const p = payload || {};

  const result = withStore((store) => {
    switch (type) {
      case "createBoard":
        return store.createBoard(String(p.name || "未命名 Board"));
      case "renameBoard":
        return store.renameBoard(String(p.id), String(p.name));
      case "deleteBoard":
        store.deleteBoard(String(p.id));
        return { ok: true };
      case "setCurrentBoard":
        store.setCurrentBoard(String(p.id));
        return { ok: true };
      case "addLink":
        return store.addLink(String(p.boardId), String(p.url));
      case "addLinks":
        return (String(p.text || "")
          .split(/[\s\n]+/)
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, 50) as string[]).map((url) => store.addLink(String(p.boardId), url));
      case "addLocalFile":
        return store.addLocalFile(String(p.boardId), String(p.name), {
          mime: p.mime ? String(p.mime) : undefined,
          dataUrl: p.dataUrl ? String(p.dataUrl) : undefined,
          body: p.body ? String(p.body) : undefined,
        });
      case "addDocument":
        return store.addDocument(String(p.boardId), String(p.title || "未命名文档"), String(p.body || ""));
      case "updateFile":
        return store.updateFile(String(p.id), {
          title: p.title !== undefined ? String(p.title) : undefined,
          body: p.body !== undefined ? String(p.body) : undefined,
          selected: typeof p.selected === "boolean" ? p.selected : undefined,
          folderId: p.folderId === null ? null : p.folderId ? String(p.folderId) : undefined,
        });
      case "addHighlight":
        return store.addHighlight(String(p.fileId), String(p.text));
      case "toggleHighlight":
        return store.toggleHighlight(String(p.id), typeof p.selected === "boolean" ? p.selected : undefined);
      case "createFolder":
        return store.createFolder(String(p.boardId), String(p.name || "新文件夹"));
      case "moveFileToFolder":
        return store.moveFileToFolder(String(p.fileId), p.folderId ? String(p.folderId) : null);
      case "setTranscription":
        return store.setTranscription(String(p.fileId), p.outcome === "failed" ? "failed" : "success");
      case "startChat":
        return store.startChatTask(String(p.boardId), String(p.title || "Chat"));
      case "askChat":
        return store.askChat(String(p.taskId), String(p.question), p.currentFileId ? String(p.currentFileId) : undefined);
      case "generateWrite":
        return store.generateWrite(String(p.boardId), p.genre as WriteGenre);
      case "createShare":
        return store.createShare(String(p.fileId));
      case "copyFile":
        return { text: store.copyFile(String(p.fileId)) };
      default:
        throw new Error(`未知操作 ${type}`);
    }
  });

  const store = (await import("@/lib/server-store")).loadStore();
  return NextResponse.json({
    result,
    state: {
      ...store.snapshot(),
      loggedIn: true,
      defaultModel: defaultModel(),
    },
  });
}
