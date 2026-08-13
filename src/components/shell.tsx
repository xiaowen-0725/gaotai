"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { switcherName, toggleClass } from "./board-list";
import { closedStub, useStore } from "./store-context";
import {
  IconBoards,
  IconBolt,
  IconPlus,
  IconRocket,
  IconSearch,
  IconSkills,
  IconSprite,
} from "./icons";

export function Shell({ children }: { children: React.ReactNode }) {
  const { state, act, showToast } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const current = state.boards.find((b) => b.id === state.currentBoardId);

  return (
    <div className="app-root" data-testid="app-root">
      <aside className="sidebar" data-testid="global-sidebar">
        <div className="brand" data-testid="brand">稿台</div>
        <button
          className={toggleClass("nav-item", pathname === "/")}
          data-testid="nav-new-task"
          onClick={() => router.push("/")}
        >
          <IconPlus /> New task
        </button>
        <button
          className={toggleClass("nav-item", pathname.startsWith("/boards"))}
          data-testid="nav-boards"
          onClick={() => router.push("/boards")}
        >
          <IconBoards /> Boards
        </button>
        <button
          className={toggleClass("nav-item", pathname.startsWith("/skills"))}
          data-testid="nav-skills"
          onClick={() => router.push("/skills")}
        >
          <IconSkills /> Skills
        </button>
        <button
          className="nav-item"
          data-testid="nav-sprite"
          onClick={() => closedStub(showToast)}
        >
          <IconSprite /> Sprite
        </button>
        <button className="nav-item" data-testid="nav-search" onClick={() => closedStub(showToast)}>
          <IconSearch /> Search
        </button>
        <div className="recents-label">Recents</div>
        <div data-testid="recents">
          {state.boards.slice(0, 6).map((b) => (
            <button
              key={b.id}
              className={toggleClass("recent-item", b.id === state.currentBoardId)}
              onClick={() => {
                void act("setCurrentBoard", { id: b.id });
                router.push(`/boards/${b.id}`);
              }}
            >
              <IconBoards /> {b.name}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button className="upgrade" data-testid="upgrade" onClick={() => closedStub(showToast)}>
            <span className="row"><IconRocket /> Upgrade</span>
          </button>
          <div className="account" data-testid="account">
            <div className="avatar">{state.author.name.slice(0, 1)}</div>
            <div>
              <div>{state.author.name}</div>
              <span className="badge">Free</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="main-inner">
          <div className="topbar">
            <BoardSwitcher currentName={switcherName(current)} boards={state.boards} onPick={(id) => void act("setCurrentBoard", { id })} />
            <div className="credits" data-testid="credits">
              <IconBolt /> 300
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function BoardSwitcher({
  currentName,
  boards,
  onPick,
}: {
  currentName: string;
  boards: { id: string; name: string }[];
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        className="board-switcher"
        data-testid="board-switcher"
        onClick={() => setOpen((v) => !v)}
      >
        {currentName}
      </button>
      <SwitcherMenu open={open} boards={boards} onPick={(id) => { onPick(id); setOpen(false); }} />
    </div>
  );
}

function SwitcherMenu({
  open,
  boards,
  onPick,
}: {
  open: boolean;
  boards: { id: string; name: string }[];
  onPick: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="switcher-menu" data-testid="board-switcher-menu">
      {boards.map((b) => (
        <button key={b.id} onClick={() => onPick(b.id)}>
          {b.name}
        </button>
      ))}
    </div>
  );
}
