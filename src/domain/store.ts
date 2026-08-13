import { createId } from "./id";
import {
  applyChatEdit,
  copyDocumentText,
  fakeTranscription,
  generateChatAnswer,
  generateWriteContent,
  isReviseQuestion,
} from "./generators";
import { classifyLocalName, linkPreview, localFileBody } from "./classify";
import { DEFAULT_AUTHOR, filledSnapshot } from "./snapshot";
import type {
  Author,
  Board,
  ChatMessage,
  Folder,
  Highlight,
  MaterialFile,
  ShareLink,
  StoreSnapshot,
  Task,
  WriteGenre,
} from "./types";

export class GaotaiStore {
  boards: Board[] = [];
  folders: Folder[] = [];
  files: MaterialFile[] = [];
  highlights: Highlight[] = [];
  tasks: Task[] = [];
  shareLinks: ShareLink[] = [];
  currentBoardId: string | null = null;
  author: Author = { ...DEFAULT_AUTHOR };

  snapshot(): StoreSnapshot {
    return {
      boards: this.boards,
      folders: this.folders,
      files: this.files,
      highlights: this.highlights,
      tasks: this.tasks,
      shareLinks: this.shareLinks,
      currentBoardId: this.currentBoardId,
      author: this.author,
    };
  }

  load(data: Partial<StoreSnapshot>) {
    const next = filledSnapshot(data);
    this.boards = next.boards;
    this.folders = next.folders;
    this.files = next.files;
    this.highlights = next.highlights;
    this.tasks = next.tasks;
    this.shareLinks = next.shareLinks;
    this.currentBoardId = next.currentBoardId;
    this.author = next.author;
  }

  reset() {
    this.load({});
  }

  createBoard(name = "未命名 Board"): Board {
    const board: Board = {
      id: createId("board"),
      name,
      ownerId: this.author.id,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    this.boards.push(board);
    this.currentBoardId = board.id;
    return board;
  }

  renameBoard(id: string, name: string): Board {
    const board = this.requireBoard(id);
    board.name = name;
    return board;
  }

  deleteBoard(id: string) {
    this.boards = this.boards.filter((b) => b.id !== id);
    this.files = this.files.filter((f) => f.boardId !== id);
    this.highlights = this.highlights.filter((h) => h.boardId !== id);
    this.tasks = this.tasks.filter((t) => t.boardId !== id);
    this.folders = this.folders.filter((f) => f.boardId !== id);
    this.shareLinks = this.shareLinks.filter((s) => s.boardId !== id);
    if (this.currentBoardId === id) {
      this.currentBoardId = this.boards[0]?.id ?? null;
    }
  }

  setCurrentBoard(id: string) {
    this.requireBoard(id);
    this.currentBoardId = id;
  }

  requireBoard(id: string): Board {
    const board = this.boards.find((b) => b.id === id);
    if (!board) throw new Error("Board 不存在");
    return board;
  }

  ensureBoard(): Board {
    if (this.currentBoardId) return this.requireBoard(this.currentBoardId);
    if (this.boards[0]) {
      this.currentBoardId = this.boards[0].id;
      return this.boards[0];
    }
    throw new Error("须先创建或选择一个 Board 才能继续");
  }

  addLink(boardId: string, url: string): MaterialFile {
    const preview = linkPreview(url);
    return this.pushFile({ boardId, ...preview, url });
  }

  addLocalFile(
    boardId: string,
    name: string,
    options: { mime?: string; dataUrl?: string; body?: string } = {},
  ): MaterialFile {
    const kind = classifyLocalName(name, options.mime);
    const file = this.pushFile({
      boardId,
      kind,
      title: name,
      body: localFileBody(name, kind, options.body),
      mime: options.mime,
      dataUrl: options.dataUrl,
    });
    return attachMediaTranscript(file);
  }

  addDocument(boardId: string, title = "未命名文档", body = ""): MaterialFile {
    return this.pushFile({ boardId, kind: "document", title, body });
  }

  private pushFile(partial: {
    boardId: string;
    kind: MaterialFile["kind"];
    title: string;
    body: string;
    url?: string;
    mime?: string;
    dataUrl?: string;
    writeGenre?: WriteGenre;
    sourceFileIds?: string[];
    sourceHighlightIds?: string[];
  }): MaterialFile {
    const file: MaterialFile = {
      id: createId("file"),
      folderId: null,
      selected: false,
      sourceFileIds: [],
      sourceHighlightIds: [],
      createdAt: new Date().toISOString(),
      ...partial,
    };
    this.files.push(file);
    return file;
  }

  updateFile(id: string, patch: Partial<Pick<MaterialFile, "title" | "body" | "selected" | "folderId">>) {
    const file = this.requireFile(id);
    assignDefined(file, patch);
    return file;
  }

  requireFile(id: string): MaterialFile {
    const file = this.files.find((f) => f.id === id);
    if (!file) throw new Error("File 不存在");
    return file;
  }

  addHighlight(fileId: string, text: string): Highlight {
    const file = this.requireFile(fileId);
    const highlight: Highlight = {
      id: createId("hl"),
      fileId,
      boardId: file.boardId,
      text,
      selected: true,
    };
    this.highlights.push(highlight);
    return highlight;
  }

  toggleHighlight(id: string, selected?: boolean): Highlight {
    const highlight = this.highlights.find((h) => h.id === id);
    if (!highlight) throw new Error("高亮不存在");
    highlight.selected = selected ?? !highlight.selected;
    return highlight;
  }

  createFolder(boardId: string, name = "新文件夹"): Folder {
    const folder: Folder = { id: createId("folder"), boardId, name };
    this.folders.push(folder);
    return folder;
  }

  moveFileToFolder(fileId: string, folderId: string | null) {
    const file = this.requireFile(fileId);
    if (folderId) {
      const folder = this.folders.find((f) => f.id === folderId);
      if (!folder) throw new Error("文件夹不存在");
    }
    file.folderId = folderId;
    return file;
  }

  setTranscription(fileId: string, outcome: "success" | "failed") {
    const file = this.requireFile(fileId);
    file.transcription = fakeTranscription(file, outcome);
    return file;
  }

  startChatTask(boardId: string, title: string): Task {
    const task: Task = {
      id: createId("task"),
      boardId,
      title,
      kind: "chat",
      messages: [],
    };
    this.tasks.push(task);
    return task;
  }

  askChat(taskId: string, question: string, currentFileId?: string): ChatMessage {
    const task = this.requireTask(taskId);
    task.messages.push({ id: createId("msg"), role: "user", text: question });
    if (currentFileId && isReviseQuestion(question)) {
      return this.reviseOpenDocument(task, question, currentFileId);
    }
    return this.replyFromSources(task, question);
  }

  generateWrite(boardId: string, genre: WriteGenre): MaterialFile {
    const selectedFiles = this.selectedSourceFiles(boardId);
    const selectedHighlights = this.selectedHighlightsOn(boardId);
    const content = generateWriteContent(genre, selectedFiles, selectedHighlights);
    const file = this.pushFile({
      boardId,
      kind: "write",
      title: content.title,
      body: content.body,
      writeGenre: genre,
      sourceFileIds: selectedFiles.map((f) => f.id),
      sourceHighlightIds: selectedHighlights.map((h) => h.id),
    });
    this.tasks.push({
      id: createId("task"),
      boardId,
      title: `Write · ${genre}`,
      kind: "write",
      writeFileId: file.id,
      messages: [],
    });
    return file;
  }

  createShare(fileId: string): ShareLink {
    const file = this.requireFile(fileId);
    const existing = this.shareLinks.find((s) => s.fileId === fileId);
    if (existing) return existing;
    const link: ShareLink = {
      token: createId("share"),
      fileId,
      boardId: file.boardId,
    };
    this.shareLinks.push(link);
    return link;
  }

  getShare(token: string): { file: MaterialFile; link: ShareLink } | null {
    const link = this.shareLinks.find((s) => s.token === token);
    if (!link) return null;
    const file = this.files.find((f) => f.id === link.fileId);
    if (!file) return null;
    if (!this.boards.some((b) => b.id === link.boardId)) return null;
    return { file, link };
  }

  copyFile(fileId: string): string {
    return copyDocumentText(this.requireFile(fileId));
  }

  private requireTask(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new Error("Task 不存在");
    return task;
  }

  private selectedSourceFiles(boardId: string) {
    return this.files.filter((f) => f.boardId === boardId && f.selected && f.kind !== "write");
  }

  private selectedHighlightsOn(boardId: string) {
    return this.highlights.filter((h) => h.boardId === boardId && h.selected);
  }

  private reviseOpenDocument(task: Task, question: string, currentFileId: string): ChatMessage {
    const current = this.requireFile(currentFileId);
    current.body = applyChatEdit(current, question).body;
    const assistant: ChatMessage = {
      id: createId("msg"),
      role: "assistant",
      text: `已更新当前文档「${current.title}」，没有另存。`,
      ranForSeconds: 3,
      citedFileIds: [current.id],
    };
    task.messages.push(assistant);
    return assistant;
  }

  private replyFromSources(task: Task, question: string): ChatMessage {
    const answer = generateChatAnswer(
      question,
      this.files.filter((f) => f.boardId === task.boardId && f.selected),
      this.highlights.filter((h) => h.boardId === task.boardId && h.selected),
    );
    const assistant: ChatMessage = {
      id: createId("msg"),
      role: "assistant",
      text: answer.text,
      ranForSeconds: 5,
      citedFileIds: answer.citedFileIds,
      citedHighlightIds: answer.citedHighlightIds,
    };
    task.messages.push(assistant);
    return assistant;
  }
}

function attachMediaTranscript(file: MaterialFile) {
  if (file.kind === "audio" || file.kind === "video") {
    file.transcription = fakeTranscription(file);
  }
  return file;
}

function assignDefined<T extends object>(target: T, patch: Partial<T>) {
  (Object.keys(patch) as (keyof T)[]).forEach((key) => {
    const value = patch[key];
    if (value !== undefined) {
      target[key] = value as T[keyof T];
    }
  });
}
