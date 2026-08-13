"use client";

import type { MaterialFile } from "@/domain/types";

export function FileRow({
  file,
  active,
  onOpen,
  onToggle,
  onMove,
}: {
  file: MaterialFile;
  active: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onMove?: () => void;
}) {
  return (
    <div className={`file-item ${active ? "active" : ""}`} data-testid={`file-row-${file.id}`}>
      <input type="checkbox" checked={file.selected} onChange={onToggle} aria-label={`勾选 ${file.title}`} />
      <button onClick={onOpen} style={{ border: 0, background: "transparent", textAlign: "left", flex: 1 }}>
        {file.title}
        {file.writeGenre ? ` · ${file.writeGenre}` : ""}
        {file.transcription?.status === "failed" ? " · 转录失败" : ""}
      </button>
      {onMove ? (
        <button className="ghost" data-testid={`move-${file.id}`} onClick={onMove}>放入文件夹</button>
      ) : null}
    </div>
  );
}
