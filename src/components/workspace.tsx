"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Folder, MaterialFile, Task } from "@/domain/types";
import { AddSources } from "./add-sources";
import { ChatPane } from "./chat-pane";
import { Composer } from "./composer";
import { FileCanvas } from "./file-canvas";
import { FileRow } from "./file-row";
import { closedStub, useStore } from "./store-context";
import { WriteDialog } from "./write-dialog";
import { canvasMode } from "./file-view";
import { IconCheck, IconFiles, IconFolder, IconGlobe, IconPlus, IconSearch, IconSprite } from "./icons";

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
  if (!board) return <div className="page">加载中…</div>;

  const fileId = params.get("file");
  const taskId = params.get("task");
  const file = state.files.find((f) => f.id === fileId) || null;
  const task = state.tasks.find((t) => t.id === taskId) || null;
  const files = state.files.filter((f) => f.boardId === boardId);
  const folders = state.folders.filter((f) => f.boardId === boardId);
  const tasks = state.tasks.filter((t) => t.boardId === boardId);
  const highlights = state.highlights.filter((h) => h.fileId === file?.id);

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
          <BoardPlus
            addOpen={addOpen}
            setAddOpen={setAddOpen}
            onNewTask={() => { setAddOpen(false); setNewTaskOpen(true); }}
            onNewDocument={async () => {
              setAddOpen(false);
              const doc = (await act("addDocument", { boardId, title: "未命名文档", body: "" })) as { id: string };
              openFile(doc.id);
            }}
            onAddSources={() => { setAddOpen(false); setSourcesOpen(true); }}
          />
        </div>
        <SideList
          seg={seg}
          boardId={boardId}
          files={files}
          folders={folders}
          fileId={fileId}
          openFile={openFile}
          tasks={tasks}
          taskId={taskId}
          onOpenTasks={() => setSeg("tasks")}
        />
      </aside>
      <section className="canvas" data-testid="middle-canvas">
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="icon-btn" data-testid="sprite-corner" aria-label="Sprite" onClick={() => closedStub(showToast)}>
            <IconSprite />
          </button>
        </div>
        <MiddlePane
          boardId={boardId}
          researchEmpty={researchEmpty}
          newTaskOpen={newTaskOpen}
          setNewTaskOpen={setNewTaskOpen}
          setWriteOpen={setWriteOpen}
          setResearchEmpty={setResearchEmpty}
          task={task}
          file={file}
          files={files}
          highlights={highlights}
          cue={cue}
          setCue={setCue}
          fileId={fileId}
          openFile={openFile}
        />
      </section>
      <SourcesLayer open={sourcesOpen} boardId={boardId} onClose={() => setSourcesOpen(false)} />
      <WriteLayer open={writeOpen} boardId={boardId} onClose={() => setWriteOpen(false)} />
    </div>
  );
}

function SourcesLayer({ open, boardId, onClose }: { open: boolean; boardId: string; onClose: () => void }) {
  if (!open) return null;
  return <AddSources boardId={boardId} onClose={onClose} />;
}

function WriteLayer({ open, boardId, onClose }: { open: boolean; boardId: string; onClose: () => void }) {
  if (!open) return null;
  return <WriteDialog boardId={boardId} onClose={onClose} />;
}

function BoardPlus({
  addOpen,
  setAddOpen,
  onNewTask,
  onNewDocument,
  onAddSources,
}: {
  addOpen: boolean;
  setAddOpen: (fn: (v: boolean) => boolean) => void;
  onNewTask: () => void;
  onNewDocument: () => void;
  onAddSources: () => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <button className="icon-btn" data-testid="board-plus" aria-label="+" onClick={() => setAddOpen((v) => !v)}>
        <IconPlus />
      </button>
      <BoardAddMenu open={addOpen} onNewTask={onNewTask} onNewDocument={onNewDocument} onAddSources={onAddSources} />
    </div>
  );
}

function BoardAddMenu({
  open,
  onNewTask,
  onNewDocument,
  onAddSources,
}: {
  open: boolean;
  onNewTask: () => void;
  onNewDocument: () => void;
  onAddSources: () => void;
}) {
  if (!open) return null;
  return (
    <div className="menu" data-testid="board-add-menu" style={{ top: 40, left: 0 }}>
      <button onClick={onNewTask}>New task</button>
      <button onClick={onNewDocument}>New document</button>
      <button onClick={onAddSources}>Add sources</button>
    </div>
  );
}

function SideList({
  seg,
  boardId,
  files,
  folders,
  fileId,
  openFile,
  tasks,
  taskId,
  onOpenTasks,
}: {
  seg: "tasks" | "files";
  boardId: string;
  files: MaterialFile[];
  folders: Folder[];
  fileId: string | null;
  openFile: (id: string) => void;
  tasks: Task[];
  taskId: string | null;
  onOpenTasks: () => void;
}) {
  if (seg === "files") {
    return <YourFiles boardId={boardId} files={files} folders={folders} fileId={fileId} openFile={openFile} />;
  }
  return <YourTasks boardId={boardId} tasks={tasks} taskId={taskId} onOpen={onOpenTasks} />;
}

function YourFiles({
  boardId,
  files,
  folders,
  fileId,
  openFile,
}: {
  boardId: string;
  files: MaterialFile[];
  folders: Folder[];
  fileId: string | null;
  openFile: (id: string) => void;
}) {
  const { act } = useStore();
  return (
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
  );
}

function YourTasks({
  boardId,
  tasks,
  taskId,
  onOpen,
}: {
  boardId: string;
  tasks: Task[];
  taskId: string | null;
  onOpen: () => void;
}) {
  const router = useRouter();
  return (
    <div data-testid="your-tasks">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>Your tasks</strong>
        <IconSearch />
      </div>
      {tasks.length === 0 ? (
        <div className="empty" data-testid="tasks-empty">Nothing here</div>
      ) : (
        tasks.map((t) => (
          <button key={t.id} className={`file-item ${t.id === taskId ? "active" : ""}`} onClick={() => { onOpen(); router.push(`/boards/${boardId}?task=${t.id}`); }}>
            <IconCheck /> {t.title}
          </button>
        ))
      )}
    </div>
  );
}

function MiddlePane({
  boardId,
  researchEmpty,
  newTaskOpen,
  setNewTaskOpen,
  setWriteOpen,
  setResearchEmpty,
  task,
  file,
  files,
  highlights,
  cue,
  setCue,
  fileId,
  openFile,
}: {
  boardId: string;
  researchEmpty: boolean;
  newTaskOpen: boolean;
  setNewTaskOpen: (v: boolean) => void;
  setWriteOpen: (v: boolean) => void;
  setResearchEmpty: (v: boolean) => void;
  task: Task | null;
  file: MaterialFile | null;
  files: MaterialFile[];
  highlights: { id: string; text: string; selected: boolean }[];
  cue: number | null;
  setCue: (n: number | null) => void;
  fileId: string | null;
  openFile: (id: string) => void;
}) {
  const { act, showToast } = useStore();
  const router = useRouter();
  const mode = canvasMode({ newTaskOpen, hasTask: Boolean(task), hasFile: Boolean(file) });
  const panes = {
    "new-task": (
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
    ),
    chat: task ? <ChatPane taskId={task.id} currentFileId={fileId} /> : null,
    file: file ? <FileCanvas file={file} highlights={highlights} cue={cue} setCue={setCue} /> : null,
    wall: (
      <div className="grid" data-testid="card-wall">
        {files.map((f) => (
          <button key={f.id} className="file-card" onClick={() => openFile(f.id)}>
            <strong>{f.title}</strong>
            <p>{f.body.slice(0, 80)}</p>
          </button>
        ))}
      </div>
    ),
  };
  return (
    <>
      <ResearchEmpty open={researchEmpty} />
      {panes[mode]}
    </>
  );
}

function ResearchEmpty({ open }: { open: boolean }) {
  if (!open) return null;
  return <p data-testid="research-empty">没有可加入的结果</p>;
}
