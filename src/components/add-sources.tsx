"use client";

import { useState } from "react";
import { parsePastedLinks } from "@/domain/classify";
import { materialsProgress, sourceBatch, textUploadBody } from "./source-batch";
import { useStore } from "./store-context";

export function AddSources({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const { act } = useStore();
  const [links, setLinks] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const parsed = parsePastedLinks(links);

  async function addAll(files: FileList | null) {
    const batch = sourceBatch(links, files);
    let done = 0;
    setProgress(materialsProgress(0, batch.total));
    done = await addLinkBatch(act, boardId, batch.urls, batch.total, done, setProgress);
    await addLocalBatch(act, boardId, batch.local as File[], batch.total, done, setProgress);
  }

  return (
    <div className="modal-backdrop" data-testid="add-sources">
      <div className="modal">
        <div className="page-head">
          <h3>Add sources</h3>
          <button className="ghost" onClick={onClose}>关闭</button>
        </div>
        <label className="drop" data-testid="drop-zone">
          Drop or click to upload your files.
          <div>pdf, docs, images, audio, video, and more.</div>
          <input
            className="hidden-file"
            type="file"
            multiple
            data-testid="source-file-input"
            onChange={(e) => void addAll(e.target.files)}
          />
        </label>
        <div className="link-box">
          <textarea
            data-testid="source-links"
            placeholder="Or paste links here to add from YouTube, Podcasts, or any webpages. To add multiple links, separate with space or new line."
            value={links}
            onChange={(e) => setLinks(e.target.value)}
          />
          <div className="link-meta">
            <span data-testid="link-count">{Math.min(parsed.count, 50)}/50</span>
            <button
              className="primary"
              disabled={parsed.count === 0}
              onClick={() => void addAll(null)}
            >
              Add links
            </button>
          </div>
        </div>
        <AddProgress text={progress} />
      </div>
    </div>
  );
}

function AddProgress({ text }: { text: string | null }) {
  if (!text) return null;
  return <div className="progress" data-testid="add-progress">{text}</div>;
}

async function addLinkBatch(
  act: (type: string, payload: Record<string, unknown>) => Promise<unknown>,
  boardId: string,
  urls: string[],
  total: number,
  done: number,
  setProgress: (text: string) => void,
) {
  for (const url of urls) {
    await act("addLink", { boardId, url });
    done += 1;
    setProgress(materialsProgress(done, total));
  }
  return done;
}

async function addLocalBatch(
  act: (type: string, payload: Record<string, unknown>) => Promise<unknown>,
  boardId: string,
  files: File[],
  total: number,
  done: number,
  setProgress: (text: string) => void,
) {
  for (const file of files) {
    const dataUrl = await readFile(file);
    await act("addLocalFile", {
      boardId,
      name: file.name,
      mime: file.type,
      dataUrl,
      body: await textUploadBody(file),
    });
    done += 1;
    setProgress(materialsProgress(done, total));
  }
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}
