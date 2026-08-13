"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Composer } from "./composer";
import { closedStub, useStore } from "./store-context";

const TABS = ["For you", "Research", "Write", "Image", "Slides", "Video", "Webpage"] as const;

export function HomeView({ boardId }: { boardId?: string }) {
  const { state, act, showToast } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("For you");
  const [needBoard, setNeedBoard] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const currentId = boardId ?? state.currentBoardId;

  async function ensureThen(fn: () => void) {
    if (!currentId) {
      setNeedBoard(true);
      return;
    }
    fn();
  }

  async function confirmCreateBoard() {
    const board = (await act("createBoard", { name: "Chaos" })) as { id: string };
    setNeedBoard(false);
    router.push(`/boards/${board.id}`);
  }

  return (
    <div className="home" data-testid="new-task-page">
      <h1 data-testid="home-prompt">What can I do for you?</h1>
      <Composer
        boardId={currentId}
        onNeedBoard={() => setNeedBoard(true)}
        onWrite={() => void ensureThen(() => setWriteOpen(true))}
        onChatMode={() =>
          void ensureThen(async () => {
            const task = (await act("startChat", { boardId: currentId, title: "Chat" })) as { id: string };
            router.push(`/boards/${currentId}?task=${task.id}`);
          })
        }
        onResearch={() => {
          showToast("没有可加入的结果");
        }}
      />
      <div className="tabs" data-testid="home-tabs">
        {TABS.map((name) => (
          <button
            key={name}
            className={`tab ${tab === name ? "active" : ""}`}
            data-testid={`tab-${name}`}
            onClick={() => {
              setTab(name);
              if (name === "Write") {
                void ensureThen(() => setWriteOpen(true));
                return;
              }
              if (name === "Research") {
                showToast("没有可加入的结果");
                return;
              }
              if (["Image", "Slides", "Video", "Webpage"].includes(name)) {
                closedStub(showToast);
              }
            }}
          >
            {name}
          </button>
        ))}
        <button className="browse" data-testid="browse-all" onClick={() => closedStub(showToast)}>
          Browse all
        </button>
      </div>
      {needBoard ? (
        <div className="modal-backdrop" data-testid="need-board-modal">
          <div className="modal">
            <p>须先创建或选择一个 Board 才能继续</p>
            <button className="primary" onClick={() => void confirmCreateBoard()}>
              创建 Board
            </button>
          </div>
        </div>
      ) : null}
      {writeOpen ? (
        <WriteDialog
          boardId={currentId!}
          onClose={() => setWriteOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function WriteDialog({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const { act } = useStore();
  const router = useRouter();
  const genres = ["长文", "短文提纲", "小红书图文", "口播稿"] as const;

  return (
    <div className="modal-backdrop" data-testid="write-dialog">
      <div className="modal">
        <h3>Write 流程 · 选择体裁</h3>
        <p>体裁选择在 Write 流程内</p>
        <div className="row" style={{ flexWrap: "wrap", margin: "12px 0" }}>
          {genres.map((g) => (
            <button
              key={g}
              className="ghost"
              data-testid={`genre-${g}`}
              onClick={async () => {
                const file = (await act("generateWrite", { boardId, genre: g })) as { id: string };
                onClose();
                router.push(`/boards/${boardId}?file=${file.id}`);
              }}
            >
              {g}
            </button>
          ))}
        </div>
        <button className="ghost" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
