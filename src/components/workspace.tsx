"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MaterialFile } from "@/domain/types";
import { WriteDialog } from "./home-view";
import { Composer } from "./composer";
import { closedStub, useStore } from "./store-context";
import {
  IconAa,
  IconCheck,
  IconCopy,
  IconCover,
  IconFiles,
  IconFolder,
  IconGlobe,
  IconImage,
  IconPlus,
  IconRetry,
  IconSave,
  IconSearch,
  IconShare,
  IconSpark,
  IconSprite,
  IconThumb,
  IconThumbDown,
  IconTranslate,
  IconWand,
} from "./icons";

export function Workspace({ boardId }: { boardId: string }) {
  const { state, act, showToast } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const board = state.boards.find((b) => b.id === boardId);
  const [seg, setSeg] = useState<"tasks" | "files">(params.get("task") ? "tasks" : "files");
  const [addOpen, setAddOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [researchEmpty, setResearchEmpty] = useState(false);
  const [cue, setCue] = useState<number | null>(null);
  const fileId = params.get("file");
  const taskId = params.get("task");
  const file = state.files.find((f) => f.id === fileId) || null;
  const task = state.tasks.find((t) => t.id === taskId) || null;
  const files = state.files.filter((f) => f.boardId === boardId);
  const folders = state.folders.filter((f) => f.boardId === boardId);
  const tasks = state.tasks.filter((t) => t.boardId === boardId);
  const highlights = state.highlights.filter((h) => h.fileId === file?.id);

  if (!board) return <div className="page">加载中…</div>;

  function openFile(id: string) {
    setSeg("files");
    router.push(`/boards/${boardId}?file=${id}`);
  }

  return (
    <div className="workspace" data-testid="board-workspace">
      <aside className="board-side" data-testid="board-side">
        <div className="row" style={{ padding: "8px 6px" }}>
          <strong data-testid="board-name">{board.name}</strong>
        </div>
        <div className="seg" data-testid="board-segments">
          <button className={`pill ${seg === "tasks" ? "active" : ""}`} data-testid="seg-tasks" onClick={() => { setSeg("tasks"); router.push(`/boards/${boardId}`); }}>
            <IconCheck /> Tasks
          </button>
          <button className={`pill ${seg === "files" ? "active" : ""}`} data-testid="seg-files" onClick={() => setSeg("files")}>
            <IconFiles /> Files
          </button>
          <button className="icon-btn" data-testid="seg-globe" aria-label="globe" onClick={() => closedStub(showToast)}>
            <IconGlobe />
          </button>
          <div style={{ position: "relative" }}>
            <button className="icon-btn" data-testid="board-plus" aria-label="+" onClick={() => setAddOpen((v) => !v)}>
              <IconPlus />
            </button>
            {addOpen ? (
              <div className="menu" data-testid="board-add-menu" style={{ top: 40, left: 0 }}>
                <button onClick={() => { setAddOpen(false); setNewTaskOpen(true); }}>New task</button>
                <button
                  onClick={async () => {
                    setAddOpen(false);
                    const doc = (await act("addDocument", { boardId, title: "未命名文档", body: "" })) as { id: string };
                    openFile(doc.id);
                  }}
                >
                  New document
                </button>
                <button onClick={() => { setAddOpen(false); setSourcesOpen(true); }}>Add sources</button>
              </div>
            ) : null}
          </div>
        </div>
        {seg === "files" ? (
          <div data-testid="your-files">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Your files</strong>
              <div className="row">
                <button className="icon-btn" aria-label="search files"><IconSearch /></button>
                <button
                  className="icon-btn"
                  data-testid="new-folder"
                  aria-label="新建文件夹"
                  onClick={() => void act("createFolder", { boardId, name: "资料夹" })}
                >
                  <IconFolder />
                </button>
              </div>
            </div>
            {folders.map((folder) => (
              <div key={folder.id} className="folder-block" data-testid={`folder-${folder.id}`}>
                <div>{folder.name}</div>
                {files.filter((f) => f.folderId === folder.id).map((f) => (
                  <FileRow key={f.id} file={f} active={f.id === fileId} onOpen={() => openFile(f.id)} onToggle={() => void act("updateFile", { id: f.id, selected: !f.selected })} />
                ))}
              </div>
            ))}
            <div data-testid="ungrouped-files">
              {files.filter((f) => !f.folderId).map((f) => (
                <FileRow
                  key={f.id}
                  file={f}
                  active={f.id === fileId}
                  onOpen={() => openFile(f.id)}
                  onToggle={() => void act("updateFile", { id: f.id, selected: !f.selected })}
                  onMove={folders[0] ? () => void act("moveFileToFolder", { fileId: f.id, folderId: folders[0].id }) : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          <div data-testid="your-tasks">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Your tasks</strong>
              <IconSearch />
            </div>
            {tasks.length === 0 ? (
              <div className="empty" data-testid="tasks-empty">Nothing here</div>
            ) : (
              tasks.map((t) => (
                <button key={t.id} className={`file-item ${t.id === taskId ? "active" : ""}`} onClick={() => { setSeg("tasks"); router.push(`/boards/${boardId}?task=${t.id}`); }}>
                  <IconCheck /> {t.title}
                </button>
              ))
            )}
          </div>
        )}
      </aside>
      <section className="canvas" data-testid="middle-canvas">
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="icon-btn" data-testid="sprite-corner" aria-label="Sprite" onClick={() => closedStub(showToast)}>
            <IconSprite />
          </button>
        </div>
        {researchEmpty ? <p data-testid="research-empty">没有可加入的结果</p> : null}
        {newTaskOpen ? (
          <div data-testid="board-new-task">
            <h1>What can I do for you?</h1>
            <Composer
              boardId={boardId}
              onWrite={() => setWriteOpen(true)}
              onChatMode={async () => {
                const created = (await act("startChat", { boardId, title: "Chat" })) as { id: string };
                setNewTaskOpen(false);
                router.push(`/boards/${boardId}?task=${created.id}`);
              }}
              onResearch={() => {
                setResearchEmpty(true);
                showToast("没有可加入的结果");
              }}
            />
          </div>
        ) : task ? (
          <ChatPane taskId={task.id} boardId={boardId} currentFileId={fileId} />
        ) : file ? (
          <FileCanvas file={file} highlights={highlights} cue={cue} setCue={setCue} />
        ) : (
          <div className="grid" data-testid="card-wall">
            {files.map((f) => (
              <button key={f.id} className="file-card" onClick={() => openFile(f.id)}>
                <strong>{f.title}</strong>
                <p>{f.body.slice(0, 80)}</p>
              </button>
            ))}
          </div>
        )}
      </section>
      {sourcesOpen ? <AddSources boardId={boardId} onClose={() => setSourcesOpen(false)} /> : null}
      {writeOpen ? <WriteDialog boardId={boardId} onClose={() => setWriteOpen(false)} /> : null}
    </div>
  );
}

function FileRow({
  file,
  active,
  onOpen,
  onToggle,
  onMove,
}: {
  file: MaterialFile;
  active: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onMove?: () => void;
}) {
  return (
    <div className={`file-item ${active ? "active" : ""}`} data-testid={`file-row-${file.id}`}>
      <input type="checkbox" checked={file.selected} onChange={onToggle} aria-label={`勾选 ${file.title}`} />
      <button onClick={onOpen} style={{ border: 0, background: "transparent", textAlign: "left", flex: 1 }}>
        {file.title}
        {file.writeGenre ? ` · ${file.writeGenre}` : ""}
        {file.transcription?.status === "failed" ? " · 转录失败" : ""}
      </button>
      {onMove ? (
        <button className="ghost" data-testid={`move-${file.id}`} onClick={onMove}>放入文件夹</button>
      ) : null}
    </div>
  );
}

function FileCanvas({
  file,
  highlights,
  cue,
  setCue,
}: {
  file: MaterialFile;
  highlights: { id: string; text: string; selected: boolean }[];
  cue: number | null;
  setCue: (n: number | null) => void;
}) {
  const { act, showToast } = useStore();
  const [title, setTitle] = useState(file.title);
  const [body, setBody] = useState(file.body);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const isDoc = file.kind === "document" || file.kind === "write";
  const isWeb = file.kind === "web";
  const isImage = file.kind === "image";
  const isMedia = file.kind === "audio" || file.kind === "video" || file.kind === "youtube";

  async function highlightSelected() {
    const selected = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
    const text = selected || file.body.slice(0, 24) || file.title;
    await act("addHighlight", { fileId: file.id, text });
  }

  async function copy() {
    const result = (await act("copyFile", { fileId: file.id })) as { text: string };
    await navigator.clipboard?.writeText(result.text).catch(() => undefined);
    (window as unknown as { __lastCopy?: string }).__lastCopy = result.text;
    document.body.setAttribute("data-last-copy", result.text);
    showToast("已复制");
  }

  async function share() {
    const link = (await act("createShare", { fileId: file.id })) as { token: string };
    const url = `${window.location.origin}/share/${link.token}`;
    setShareUrl(url);
    await navigator.clipboard?.writeText(url).catch(() => undefined);
  }

  return (
    <div className="reader" data-testid="file-canvas">
      <div className="toolbar" data-testid="doc-toolbar">
        <div className="row">
          <button className="icon-btn" aria-label="+"><IconPlus /></button>
          <button className="icon-btn" aria-label="Aa"><IconAa /></button>
          <button className="icon-btn" data-testid="icon-generate-title" aria-label="生成标题" onClick={() => closedStub(showToast)}><IconSpark /></button>
          <button className="icon-btn" data-testid="icon-translate" aria-label="Translate" onClick={() => closedStub(showToast)}><IconTranslate /></button>
          <button className="icon-btn" data-testid="icon-image" aria-label="配图" onClick={() => closedStub(showToast)}><IconImage /></button>
          <button className="icon-btn" data-testid="icon-cover" aria-label="封面出图" onClick={() => closedStub(showToast)}><IconCover /></button>
          <button className="ghost" data-testid="btn-highlight" onClick={() => void highlightSelected()}>高亮所选</button>
        </div>
        <div className="row">
          <button className="ghost" data-testid="btn-copy" onClick={() => void copy()}>复制</button>
          <button className="ghost" data-testid="btn-share" onClick={() => void share()}><IconShare /> Share</button>
        </div>
      </div>
      {isWeb ? (
        <div data-testid="web-reader">
          <h2>{file.title} ↗</h2>
          <div className="source-chip" data-testid="source-chip">{file.title}</div>
          <div className="readonly" data-testid="reader-body">{file.body}</div>
        </div>
      ) : null}
      {isDoc ? (
        <div data-testid="document-canvas">
          <input
            className="doc-title"
            data-testid="doc-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              void act("updateFile", { id: file.id, title: e.target.value });
            }}
          />
          <textarea
            className="doc-body"
            data-testid="doc-body"
            value={body}
            ref={bodyRef}
            onChange={(e) => {
              setBody(e.target.value);
              void act("updateFile", { id: file.id, body: e.target.value });
            }}
          />
          {file.writeGenre ? <div data-testid="write-genre">体裁：{file.writeGenre}</div> : null}
          {file.sourceFileIds.length ? (
            <div data-testid="doc-sources">
              来源
              {file.sourceFileIds.map((id) => (
                <div key={id} data-source-id={id}>来源 file {id}</div>
              ))}
              <SourceNames ids={file.sourceFileIds} />
            </div>
          ) : null}
        </div>
      ) : null}
      {isImage ? (
        <div data-testid="image-viewer">
          <h2>{file.title}</h2>
          {file.dataUrl ? <img className="image-view" src={file.dataUrl} alt={file.title} /> : <div>图片可查看</div>}
        </div>
      ) : null}
      {isMedia ? (
        <div data-testid="media-viewer">
          <h2>{file.title}</h2>
          {file.url ? <p>原始链接：{file.url}</p> : <p>原始文件仍可打开</p>}
          {file.transcription?.status === "failed" ? (
            <p data-testid="transcribe-fail">转录失败</p>
          ) : (
            <div>
              <p data-testid="transcript-text">{file.transcription?.text || "转录文本"}</p>
              <div>
                {(file.transcription?.cues || []).map((c) => (
                  <button key={c.t} className="cue ghost" onClick={() => setCue(c.t)}>
                    {c.t}s {c.text}
                  </button>
                ))}
              </div>
              {cue !== null ? <p data-testid="timeline-position">已跳转到 {cue}s</p> : null}
            </div>
          )}
        </div>
      ) : null}
      {highlights.length ? (
        <div data-testid="highlight-list">
          {highlights.map((h) => (
            <label key={h.id} className="hl-item">
              <input
                type="checkbox"
                checked={h.selected}
                onChange={(e) => void act("toggleHighlight", { id: h.id, selected: e.target.checked })}
              />
              高亮属于该 file：{h.text}
            </label>
          ))}
        </div>
      ) : null}
      {shareUrl ? (
        <p data-testid="share-url">{shareUrl}</p>
      ) : null}
      <div className="sr-only">稿台文档画布</div>
    </div>
  );
}

function SourceNames({ ids }: { ids: string[] }) {
  const { state } = useStore();
  const names = useMemo(
    () => ids.map((id) => state.files.find((f) => f.id === id)?.title).filter(Boolean) as string[],
    [ids, state.files],
  );
  return (
    <div>
      {names.map((n) => (
        <div key={n} data-testid="source-name">{n}</div>
      ))}
    </div>
  );
}

function ChatPane({ taskId, boardId, currentFileId }: { taskId: string; boardId: string; currentFileId: string | null }) {
  const { state, act, showToast } = useStore();
  const task = state.tasks.find((t) => t.id === taskId);
  const [text, setText] = useState("");
  if (!task) return null;

  async function send() {
    if (!text.trim()) return;
    await act("askChat", { taskId, question: text, currentFileId });
    setText("");
  }

  return (
    <div className="chat" data-testid="chat-pane">
      <div className="bubbles">
        {task.messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="user-bubble" data-testid="user-bubble">{m.text}</div>
          ) : (
            <div key={m.id} className="assistant" data-testid="assistant-bubble">
              <div className="ran">Ran for {m.ranForSeconds ?? 5}s &gt;</div>
              <div>{m.text}</div>
              <div className="msg-tools" data-testid="answer-toolbar">
                <button className="icon-btn" aria-label="复制"><IconCopy /></button>
                <button className="icon-btn" aria-label="保存"><IconSave /></button>
                <button className="icon-btn" aria-label="重试"><IconRetry /></button>
                <button className="icon-btn" aria-label="赞"><IconThumb /></button>
                <button className="icon-btn" aria-label="踩"><IconThumbDown /></button>
                <button className="icon-btn" aria-label="翻译" onClick={() => closedStub(showToast)}><IconWand /></button>
              </div>
            </div>
          ),
        )}
      </div>
      <div className="composer">
        <textarea
          data-testid="chat-input"
          placeholder="Message"
          aria-label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="composer-bar">
          <div className="row">
            <button className="icon-btn" data-testid="chat-plus" aria-label="+"><IconPlus /></button>
            <button className="icon-btn" data-testid="chat-cube" aria-label="cube"><IconSpark /></button>
          </div>
          <button className="icon-btn round" onClick={() => void send()} aria-label="发送">↑</button>
        </div>
      </div>
    </div>
  );
}

function AddSources({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const { act } = useStore();
  const [links, setLinks] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const count = links.split(/[\s\n]+/).filter(Boolean).length;

  async function addAll(files: FileList | null) {
    const urls = links.split(/[\s\n]+/).map((s) => s.trim()).filter(Boolean).slice(0, 50);
    const local = files ? Array.from(files) : [];
    const total = urls.length + local.length;
    let done = 0;
    setProgress(`Adding materials… (0/${total})`);
    for (const url of urls) {
      await act("addLink", { boardId, url });
      done += 1;
      setProgress(`Adding materials… (${done}/${total})`);
    }
    for (const file of local) {
      const dataUrl = await readFile(file);
      await act("addLocalFile", {
        boardId,
        name: file.name,
        mime: file.type,
        dataUrl,
        body: file.type.startsWith("text/") ? await file.text() : undefined,
      });
      done += 1;
      setProgress(`Adding materials… (${done}/${total})`);
    }
  }

  return (
    <div className="modal-backdrop" data-testid="add-sources">
      <div className="modal">
        <div className="page-head">
          <h3>Add sources</h3>
          <button className="ghost" onClick={onClose}>关闭</button>
        </div>
        <label className="drop" data-testid="drop-zone">
          Drop or click to upload your files.
          <div>pdf, docs, images, audio, video, and more.</div>
          <input
            className="hidden-file"
            type="file"
            multiple
            data-testid="source-file-input"
            onChange={(e) => void addAll(e.target.files)}
          />
        </label>
        <div className="link-box">
          <textarea
            data-testid="source-links"
            placeholder="Or paste links here to add from YouTube, Podcasts, or any webpages. To add multiple links, separate with space or new line."
            value={links}
            onChange={(e) => setLinks(e.target.value)}
          />
          <div className="link-meta">
            <span data-testid="link-count">{Math.min(count, 50)}/50</span>
            <button
              className="primary"
              disabled={count === 0}
              onClick={() => void addAll(null)}
            >
              Add links
            </button>
          </div>
        </div>
        {progress ? <div className="progress" data-testid="add-progress">{progress}</div> : null}
      </div>
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}
