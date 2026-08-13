import type { Author, StoreSnapshot } from "./types";

export const DEFAULT_AUTHOR: Author = {
  id: "author-1",
  name: "zhoujw07",
  plan: "Free",
};

export const EMPTY_SNAPSHOT: StoreSnapshot = {
  boards: [],
  folders: [],
  files: [],
  highlights: [],
  tasks: [],
  shareLinks: [],
  currentBoardId: null,
  author: { ...DEFAULT_AUTHOR },
};

function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export function filledSnapshot(data: Partial<StoreSnapshot>): StoreSnapshot {
  const merged: StoreSnapshot = {
    ...EMPTY_SNAPSHOT,
    ...omitUndefined(data),
    author: data.author ?? { ...DEFAULT_AUTHOR },
  };
  return {
    ...merged,
    currentBoardId: data.currentBoardId ?? merged.boards[0]?.id ?? null,
  };
}
