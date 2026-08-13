"use client";

import { useRouter } from "next/navigation";
import { WRITE_GENRES } from "@/domain/write-templates";
import { useStore } from "./store-context";

export function WriteDialog({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const { act } = useStore();
  const router = useRouter();

  return (
    <div className="modal-backdrop" data-testid="write-dialog">
      <div className="modal">
        <h3>Write 流程 · 选择体裁</h3>
        <p>体裁选择在 Write 流程内</p>
        <div className="row" style={{ flexWrap: "wrap", margin: "12px 0" }}>
          {WRITE_GENRES.map((g) => (
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
        <button className="ghost" data-testid="close-write" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
