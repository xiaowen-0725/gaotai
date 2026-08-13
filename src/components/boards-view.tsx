"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const active = state.boards.filter((b) => !b.archived);
  const archived = state.boards.filter((b) => b.archived);
  const shown = tab === "Active" ? active : archived;

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
          <button className={`pill ${tab === "Active" ? "active" : ""}`} onClick={() => setTab("Active")}>
            Active
          </button>
          <button className={`pill ${tab === "Archived" ? "active" : ""}`} onClick={() => setTab("Archived")}>
            Archived
          </button>
        </div>
        <div className="row">
          <button className={`ghost ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}>
            Grid view
          </button>
          <button className={`ghost ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
            List view
          </button>
        </div>
      </div>
      {tab === "Archived" && archived.length === 0 ? <p data-testid="archived-empty">Archived 为空</p> : null}
      <div className={view === "grid" ? "grid" : "card-row"} data-testid="boards-list" style={{ marginTop: 16 }}>
        {shown.map((b) => (
          <div key={b.id} className="board-card" data-testid={`board-card-${b.id}`}>
            <button onClick={() => router.push(`/boards/${b.id}`)}>
              <strong>{b.name}</strong>
            </button>
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="ghost"
                onClick={() => {
                  setRenameId(b.id);
                  setRenameValue(b.name);
                }}
              >
                重命名
              </button>
              <button className="ghost" data-testid={`delete-board-${b.id}`} onClick={() => void act("deleteBoard", { id: b.id })}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
      {creating ? (
        <div className="modal-backdrop" data-testid="new-board-modal">
          <div className="modal">
            <h3>New board</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} data-testid="new-board-name" />
            <div className="row" style={{ marginTop: 12 }}>
              <button
                className="primary"
                data-testid="confirm-new-board"
                onClick={async () => {
                  const board = (await act("createBoard", { name })) as { id: string };
                  setCreating(false);
                  router.push(`/boards/${board.id}`);
                }}
              >
                确认
              </button>
              <button className="ghost" onClick={() => setCreating(false)}>取消</button>
            </div>
          </div>
        </div>
      ) : null}
      {renameId ? (
        <div className="modal-backdrop">
          <div className="modal">
            <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} data-testid="rename-board-input" />
            <button
              className="primary"
              data-testid="confirm-rename"
              onClick={async () => {
                await act("renameBoard", { id: renameId, name: renameValue });
                setRenameId(null);
              }}
            >
              确认
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
