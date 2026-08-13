"use client";

import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { runCreatePick } from "./composer-actions";
import { composerBoardId, questionToAsk } from "./file-view";
import { closedStub, useStore } from "./store-context";
import {
  IconBoards,
  IconChat,
  IconCube,
  IconImage,
  IconMic,
  IconNodes,
  IconPaperclip,
  IconPen,
  IconPlus,
  IconResearch,
  IconRobot,
  IconSend,
  IconSlides,
  IconVideo,
  IconWeb,
} from "./icons";

const CREATE_ITEMS = [
  { key: "research", label: "Research", icon: <IconResearch /> },
  { key: "write", label: "Write", icon: <IconPen /> },
  { key: "image", label: "Create image", icon: <IconImage /> },
  { key: "slides", label: "Create slides", icon: <IconSlides /> },
  { key: "video", label: "Create video", icon: <IconVideo /> },
  { key: "webpage", label: "Build webpage", icon: <IconWeb /> },
] as const;

export function Composer({
  onWrite,
  onChatMode,
  onResearch,
  onNeedBoard,
  boardId,
}: {
  onWrite?: () => void;
  onChatMode?: () => void;
  onResearch?: () => void;
  onNeedBoard?: () => void;
  boardId?: string | null;
}) {
  const { state, act, showToast } = useStore();
  const router = useRouter();
  const [text, setText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [browserOn, setBrowserOn] = useState(true);
  const [autoOpen, setAutoOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const createRuns: Record<string, () => void> = {
    write: () => onWrite?.(),
    research: () => onResearch?.(),
    chat: () => onChatMode?.(),
  };

  return (
    <div className="composer" data-testid="composer">
      <textarea
        data-testid="composer-input"
        placeholder="Describe a task or ask anything"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="composer-bar">
        <div className="row" style={{ position: "relative" }}>
          <button className="icon-btn" data-testid="btn-plus" aria-label="+" onClick={() => { setAddOpen((v) => !v); setCreateOpen(false); }}>
            <IconPlus />
          </button>
          <button className="icon-btn" data-testid="btn-cube" aria-label="cube" onClick={() => { setCreateOpen((v) => !v); setAddOpen(false); }}>
            <IconCube />
          </button>
          <AddMenu
            open={addOpen}
            fileRef={fileRef}
            browserOn={browserOn}
            setBrowserOn={setBrowserOn}
            setAddOpen={setAddOpen}
          />
          <CreateMenu
            open={createOpen}
            onPick={(key) => {
              setCreateOpen(false);
              runCreatePick(key, createRuns, () => closedStub(showToast));
            }}
          />
        </div>
        <div className="row" style={{ position: "relative" }}>
          <button className="ghost" data-testid="auto-selector" onClick={() => setAutoOpen((v) => !v)}>
            Auto
          </button>
          <AutoMenu open={autoOpen} defaultModel={state.defaultModel} />
          <button className="icon-btn" data-testid="btn-mic" aria-label="mic" onClick={() => closedStub(showToast)}>
            <IconMic />
          </button>
          <button
            className="icon-btn round"
            data-testid="btn-submit"
            aria-label="提交"
            onClick={() => void submitComposer({ boardId, currentBoardId: state.currentBoardId, text, act, router, onNeedBoard })}
          >
            <IconSend />
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        className="hidden-file"
        type="file"
        data-testid="composer-file-input"
        onChange={() => closedStub(showToast)}
      />
    </div>
  );
}

function AddMenu({
  open,
  fileRef,
  browserOn,
  setBrowserOn,
  setAddOpen,
}: {
  open: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  browserOn: boolean;
  setBrowserOn: Dispatch<SetStateAction<boolean>>;
  setAddOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { showToast } = useStore();
  if (!open) return null;
  return (
    <div className="menu" data-testid="add-menu" style={{ top: 40, left: 0 }}>
      <button onClick={() => { setAddOpen(false); fileRef.current?.click(); }}>
        <IconPaperclip /> Add from files
      </button>
      <button onClick={() => { setAddOpen(false); closedStub(showToast); }}>
        <IconBoards /> 从稿台已有 file 加入
      </button>
      <button
        className="toggle"
        data-testid="use-browser"
        onClick={() => {
          closedStub(showToast);
        }}
      >
        <IconWeb /> Use browser
        <span data-testid="use-browser-toggle">{browserOn ? "On" : "Off"}</span>
        <input
          type="checkbox"
          checked={browserOn}
          onChange={(e) => {
            setBrowserOn(e.target.checked);
            closedStub(showToast);
          }}
          aria-label="Use browser"
        />
      </button>
      <button data-testid="add-connectors" onClick={() => { setAddOpen(false); closedStub(showToast); }}>
        <IconNodes /> Add connectors
      </button>
    </div>
  );
}

function CreateMenu({ open, onPick }: { open: boolean; onPick: (key: string) => void }) {
  const { showToast } = useStore();
  if (!open) return null;
  return (
    <div className="menu" data-testid="create-menu" style={{ top: 40, left: 0 }}>
      {CREATE_ITEMS.map((item) => (
        <button key={item.key} data-testid={`create-${item.key}`} onClick={() => onPick(item.key)}>
          {item.icon} {item.label}
        </button>
      ))}
      <div className="menu-sep" />
      <button data-testid="create-use-skill" onClick={() => closedStub(showToast)}>
        <IconRobot /> Use skill
      </button>
      <button data-testid="create-chat-mode" onClick={() => onPick("chat")}>
        <IconChat /> Chat mode
      </button>
    </div>
  );
}

function AutoMenu({ open, defaultModel }: { open: boolean; defaultModel: string }) {
  if (!open) return null;
  return (
    <div className="menu" data-testid="auto-menu" style={{ right: 0, top: 40 }}>
      <button>默认</button>
      <div className="sr-only">defaultModel:{defaultModel}</div>
    </div>
  );
}

async function submitComposer({
  boardId,
  currentBoardId,
  text,
  act,
  router,
  onNeedBoard,
}: {
  boardId?: string | null;
  currentBoardId: string | null;
  text: string;
  act: (type: string, payload?: Record<string, unknown>) => Promise<unknown>;
  router: { push: (href: string) => void };
  onNeedBoard?: () => void;
}) {
  const current = composerBoardId(boardId, currentBoardId);
  if (!current) {
    onNeedBoard?.();
    return;
  }
  const task = (await act("startChat", { boardId: current, title: text || "New task" })) as { id: string };
  const question = questionToAsk(text);
  if (question) {
    await act("askChat", { taskId: task.id, question });
  }
  router.push(`/boards/${current}?task=${task.id}`);
}
