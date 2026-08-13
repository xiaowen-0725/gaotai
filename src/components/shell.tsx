"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  const [switchOpen, setSwitchOpen] = useState(false);
  const current = state.boards.find((b) => b.id === state.currentBoardId);

  return (
    <div className="app-root" data-testid="app-root">
      <aside className="sidebar" data-testid="global-sidebar">
        <div className="brand" data-testid="brand">稿台</div>
        <button
          className={`nav-item ${pathname === "/" ? "active" : ""}`}
          data-testid="nav-new-task"
          onClick={() => router.push("/")}
        >
          <IconPlus /> New task
        </button>
        <button
          className={`nav-item ${pathname.startsWith("/boards") ? "active" : ""}`}
          data-testid="nav-boards"
          onClick={() => router.push("/boards")}
        >
          <IconBoards /> Boards
        </button>
        <button
          className={`nav-item ${pathname.startsWith("/skills") ? "active" : ""}`}
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
              className={`recent-item ${b.id === state.currentBoardId ? "active" : ""}`}
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
            <div style={{ position: "relative" }}>
              <button
                className="board-switcher"
                data-testid="board-switcher"
                onClick={() => setSwitchOpen((v) => !v)}
              >
                {current ? current.name : "选择 Board"}
              </button>
              {switchOpen ? (
                <div className="switcher-menu" data-testid="board-switcher-menu">
                  {state.boards.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        void act("setCurrentBoard", { id: b.id });
                        setSwitchOpen(false);
                      }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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
