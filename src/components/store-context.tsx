"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { StoreSnapshot } from "@/domain/types";

export type AppState = StoreSnapshot & {
  loggedIn: boolean;
  defaultModel: string;
};

type Ctx = {
  state: AppState;
  refresh: () => Promise<void>;
  act: (type: string, payload?: Record<string, unknown>) => Promise<unknown>;
  toast: string | null;
  showToast: (msg: string) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

const empty: AppState = {
  boards: [],
  folders: [],
  files: [],
  highlights: [],
  tasks: [],
  shareLinks: [],
  currentBoardId: null,
  author: { id: "author-1", name: "zhoujw07", plan: "Free" },
  loggedIn: true,
  defaultModel: "default",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(empty);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.ok) setState(await res.json());
  }, []);

  const act = useCallback(async (type: string, payload?: Record<string, unknown>) => {
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    });
    const data = await res.json();
    if (data.state) setState(data.state);
    return data.result;
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 8000);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <StoreCtx.Provider value={{ state, refresh, act, toast, showToast }}>
      {children}
      {toast ? <div className="toast" data-testid="toast">{toast}</div> : null}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

export function closedStub(showToast: (m: string) => void) {
  showToast("未开放");
}
