export function showArchivedEmpty(tab: string, archivedCount: number) {
  return tab === "Archived" && archivedCount === 0;
}

export function boardsOnTab<T extends { archived: boolean }>(boards: T[], tab: string) {
  return boards.filter((board) => board.archived === (tab === "Archived"));
}

export function boardListClass(view: string) {
  return view === "grid" ? "grid" : "card-row";
}

export function toggleClass(base: string, on: boolean) {
  return on ? `${base} active` : base;
}

export function switcherName(board?: { name: string }) {
  return board ? board.name : "选择 Board";
}
