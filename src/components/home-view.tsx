"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Composer } from "./composer";
import { homeTabAction } from "./file-view";
import { closedStub, useStore } from "./store-context";
import { WriteDialog } from "./write-dialog";

const TABS = ["For you", "Research", "Write", "Image", "Slides", "Video", "Webpage"] as const;

export function HomeView({ boardId }: { boardId?: string }) {
  const { state, act, showToast } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("For you");
  const [needBoard, setNeedBoard] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const currentId = boardId ?? state.currentBoardId;

  function runWhenBoardReady(fn: () => void) {
    if (!currentId) {
      setNeedBoard(true);
      return;
    }
    fn();
  }

  const tabRuns = {
    write: () => runWhenBoardReady(() => setWriteOpen(true)),
    research: () => showToast("没有可加入的结果"),
    stub: () => closedStub(showToast),
    none: () => undefined,
  };

  return (
    <div className="home" data-testid="new-task-page">
      <h1 data-testid="home-prompt">What can I do for you?</h1>
      <Composer
        boardId={currentId}
        onNeedBoard={() => setNeedBoard(true)}
        onWrite={() => runWhenBoardReady(() => setWriteOpen(true))}
        onChatMode={() =>
          runWhenBoardReady(() => {
            void (async () => {
              const task = (await act("startChat", { boardId: currentId, title: "Chat" })) as { id: string };
              router.push(`/boards/${currentId}?task=${task.id}`);
            })();
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
              tabRuns[homeTabAction(name)]();
            }}
          >
            {name}
          </button>
        ))}
        <button className="browse" data-testid="browse-all" onClick={() => closedStub(showToast)}>
          Browse all
        </button>
      </div>
      <NeedBoardModal
        open={needBoard}
        onConfirm={async () => {
          const board = (await act("createBoard", { name: "Chaos" })) as { id: string };
          setNeedBoard(false);
          router.push(`/boards/${board.id}`);
        }}
      />
      <HomeWrite open={writeOpen} boardId={currentId} onClose={() => setWriteOpen(false)} />
    </div>
  );
}

function HomeWrite({ open, boardId, onClose }: { open: boolean; boardId?: string | null; onClose: () => void }) {
  if (!open || !boardId) return null;
  return <WriteDialog boardId={boardId} onClose={onClose} />;
}

function NeedBoardModal({ open, onConfirm }: { open: boolean; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" data-testid="need-board-modal">
      <div className="modal">
        <p>须先创建或选择一个 Board 才能继续</p>
        <button className="primary" onClick={() => void onConfirm()}>
          创建 Board
        </button>
      </div>
    </div>
  );
}
