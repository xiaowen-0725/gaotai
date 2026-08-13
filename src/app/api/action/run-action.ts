import { parsePastedLinks } from "@/domain/classify";
import type { GaotaiStore } from "@/domain/store";
import type { WriteGenre } from "@/domain/types";

type Payload = Record<string, unknown>;
type Handler = (store: GaotaiStore, p: Payload) => unknown;

const asString = (value: unknown, fallback = "") => String(value || fallback);

const HANDLERS: Record<string, Handler> = {
  createBoard: (store, p) => store.createBoard(asString(p.name, "未命名 Board")),
  renameBoard: (store, p) => store.renameBoard(asString(p.id), asString(p.name)),
  deleteBoard: (store, p) => {
    store.deleteBoard(asString(p.id));
    return { ok: true };
  },
  setCurrentBoard: (store, p) => {
    store.setCurrentBoard(asString(p.id));
    return { ok: true };
  },
  addLink: (store, p) => store.addLink(asString(p.boardId), asString(p.url)),
  addLinks: (store, p) =>
    parsePastedLinks(asString(p.text)).urls.map((url) => store.addLink(asString(p.boardId), url)),
  addLocalFile: (store, p) =>
    store.addLocalFile(asString(p.boardId), asString(p.name), {
      mime: p.mime ? String(p.mime) : undefined,
      dataUrl: p.dataUrl ? String(p.dataUrl) : undefined,
      body: p.body ? String(p.body) : undefined,
    }),
  addDocument: (store, p) =>
    store.addDocument(asString(p.boardId), asString(p.title, "未命名文档"), asString(p.body)),
  updateFile: (store, p) =>
    store.updateFile(asString(p.id), {
      title: p.title !== undefined ? String(p.title) : undefined,
      body: p.body !== undefined ? String(p.body) : undefined,
      selected: typeof p.selected === "boolean" ? p.selected : undefined,
      folderId: p.folderId === null ? null : p.folderId ? String(p.folderId) : undefined,
    }),
  addHighlight: (store, p) => store.addHighlight(asString(p.fileId), asString(p.text)),
  toggleHighlight: (store, p) =>
    store.toggleHighlight(asString(p.id), typeof p.selected === "boolean" ? p.selected : undefined),
  createFolder: (store, p) => store.createFolder(asString(p.boardId), asString(p.name, "新文件夹")),
  moveFileToFolder: (store, p) =>
    store.moveFileToFolder(asString(p.fileId), p.folderId ? String(p.folderId) : null),
  setTranscription: (store, p) =>
    store.setTranscription(asString(p.fileId), p.outcome === "failed" ? "failed" : "success"),
  startChat: (store, p) => store.startChatTask(asString(p.boardId), asString(p.title, "Chat")),
  askChat: (store, p) =>
    store.askChat(asString(p.taskId), asString(p.question), p.currentFileId ? String(p.currentFileId) : undefined),
  generateWrite: (store, p) => store.generateWrite(asString(p.boardId), p.genre as WriteGenre),
  createShare: (store, p) => store.createShare(asString(p.fileId)),
  copyFile: (store, p) => ({ text: store.copyFile(asString(p.fileId)) }),
};

export function runAuthorAction(store: GaotaiStore, type: string, payload: Payload = {}) {
  const handler = HANDLERS[type];
  if (!handler) throw new Error(`未知操作 ${type}`);
  return handler(store, payload);
}
