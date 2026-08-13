"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Board } from "@/domain/types";
import { boardListClass, boardsOnTab, showArchivedEmpty, toggleClass } from "./board-list";
import { useStore } from "./store-context";
import { IconHouse, IconPlus } from "./icons";

export function BoardsView() {
  const { state, act } = useStore();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Chaos");
  const [tab, setTab] = useState<"Active" | "Archived">("Active");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const archived = boardsOnTab(state.boards, "Archived");
  const shown = boardsOnTab(state.boards, tab);

  return (
    <div className="page" data-testid="boards-page">
      <div className="page-head">
        <div className="row">
          <h1>Boards</h1>
          <span className="ghost"><IconHouse /> Home</span>
        </div>
        <button className="primary" data-testid="new-board" onClick={() => setCreating(true)}>
          <IconPlus /> New board
        </button>
      </div>
      <div className="section-label">Recents &gt;</div>
      <div className="card-row" data-testid="recents-cards">
        {state.boards.map((b) => (
          <button key={b.id} className="board-card" onClick={() => router.push(`/boards/${b.id}`)}>
            <strong>{b.name}</strong>
            <div className="section-label">刚刚</div>
          </button>
        ))}
        <div className="board-card">View all</div>
      </div>
      <div className="page-head" style={{ marginTop: 20 }}>
        <div className="row">
          <button className={toggleClass("pill", tab === "Active")} onClick={() => setTab("Active")}>
            Active
          </button>
          <button className={toggleClass("pill", tab === "Archived")} onClick={() => setTab("Archived")}>
            Archived
          </button>
        </div>
        <div className="row">
          <button className={toggleClass("ghost", view === "grid")} onClick={() => setView("grid")}>
            Grid view
          </button>
          <button className={toggleClass("ghost", view === "list")} onClick={() => setView("list")}>
            List view
          </button>
        </div>
      </div>
      <ArchivedEmpty tab={tab} archivedCount={archived.length} />
      <div className={boardListClass(view)} data-testid="boards-list" style={{ marginTop: 16 }}>
        {shown.map((b) => (
          <BoardCard
            key={b.id}
            board={b}
            onOpen={() => router.push(`/boards/${b.id}`)}
            onRename={() => {
              setRenameId(b.id);
              setRenameValue(b.name);
            }}
            onDelete={() => void act("deleteBoard", { id: b.id })}
          />
        ))}
      </div>
      <NewBoardDialog
        open={creating}
        name={name}
        setName={setName}
        onCancel={() => setCreating(false)}
        onConfirm={async () => {
          const board = (await act("createBoard", { name })) as { id: string };
          setCreating(false);
          router.push(`/boards/${board.id}`);
        }}
      />
      <RenameDialog
        open={Boolean(renameId)}
        value={renameValue}
        setValue={setRenameValue}
        onConfirm={async () => {
          await act("renameBoard", { id: renameId, name: renameValue });
          setRenameId(null);
        }}
      />
    </div>
  );
}

function ArchivedEmpty({ tab, archivedCount }: { tab: string; archivedCount: number }) {
  if (!showArchivedEmpty(tab, archivedCount)) return null;
  return <p data-testid="archived-empty">Archived 为空</p>;
}

function BoardCard({
  board,
  onOpen,
  onRename,
  onDelete,
}: {
  board: Board;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="board-card" data-testid={`board-card-${board.id}`}>
      <button onClick={onOpen}>
        <strong>{board.name}</strong>
      </button>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="ghost" onClick={onRename}>重命名</button>
        <button className="ghost" data-testid={`delete-board-${board.id}`} onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}

function NewBoardDialog({
  open,
  name,
  setName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  name: string;
  setName: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" data-testid="new-board-modal">
      <div className="modal">
        <h3>New board</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} data-testid="new-board-name" />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" data-testid="confirm-new-board" onClick={() => void onConfirm()}>确认</button>
          <button className="ghost" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}

function RenameDialog({
  open,
  value,
  setValue,
  onConfirm,
}: {
  open: boolean;
  value: string;
  setValue: (v: string) => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <input value={value} onChange={(e) => setValue(e.target.value)} data-testid="rename-board-input" />
        <button className="primary" data-testid="confirm-rename" onClick={() => void onConfirm()}>确认</button>
      </div>
    </div>
  );
}
