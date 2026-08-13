export type WriteGenre = "长文" | "短文提纲" | "小红书图文" | "口播稿";

export type FileKind =
  | "web"
  | "document"
  | "image"
  | "youtube"
  | "audio"
  | "video"
  | "write";

export type TranscriptionStatus = "pending" | "success" | "failed";

export type TranscriptCue = {
  t: number;
  text: string;
};

export type Board = {
  id: string;
  name: string;
  ownerId: string;
  archived: boolean;
  createdAt: string;
};

export type Folder = {
  id: string;
  boardId: string;
  name: string;
};

export type MaterialFile = {
  id: string;
  boardId: string;
  kind: FileKind;
  title: string;
  body: string;
  url?: string;
  folderId: string | null;
  selected: boolean;
  mime?: string;
  dataUrl?: string;
  writeGenre?: WriteGenre;
  sourceFileIds: string[];
  sourceHighlightIds: string[];
  transcription?: {
    status: TranscriptionStatus;
    text?: string;
    cues?: TranscriptCue[];
    error?: string;
  };
  createdAt: string;
};

export type Highlight = {
  id: string;
  fileId: string;
  boardId: string;
  text: string;
  selected: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ranForSeconds?: number;
  citedFileIds?: string[];
  citedHighlightIds?: string[];
};

export type Task = {
  id: string;
  boardId: string;
  title: string;
  kind: "chat" | "write";
  writeFileId?: string;
  messages: ChatMessage[];
};

export type ShareLink = {
  token: string;
  fileId: string;
  boardId: string;
};

export type Author = {
  id: string;
  name: string;
  plan: string;
};

export type StoreSnapshot = {
  boards: Board[];
  folders: Folder[];
  files: MaterialFile[];
  highlights: Highlight[];
  tasks: Task[];
  shareLinks: ShareLink[];
  currentBoardId: string | null;
  author: Author;
};
