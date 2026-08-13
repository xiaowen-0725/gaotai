"use client";

import { useMemo, useState } from "react";
import { absoluteShareUrl, rememberCopiedText, selectedText, writeClipboard } from "@/adapters/browser";
import { highlightTextFromSelection } from "@/domain/generators";
import type { MaterialFile } from "@/domain/types";
import { closedStub, useStore } from "./store-context";
import { fileViewKind } from "./file-view";
import {
  IconAa,
  IconCover,
  IconImage,
  IconPlus,
  IconShare,
  IconSpark,
  IconTranslate,
} from "./icons";

export function FileCanvas({
  file,
  highlights,
  cue,
  setCue,
}: {
  file: MaterialFile;
  highlights: { id: string; text: string; selected: boolean }[];
  cue: number | null;
  setCue: (n: number | null) => void;
}) {
  const { act, showToast } = useStore();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  return (
    <div className="reader" data-testid="file-canvas">
      <DocToolbar
        onHighlight={() => void highlightCurrentFile(act, file)}
        onCopy={() => void copyCurrentFile(act, file.id, showToast)}
        onShare={() => void shareCurrentFile(act, file.id, setShareUrl)}
      />
      <KindView file={file} cue={cue} setCue={setCue} />
      <HighlightList highlights={highlights} />
      <ShareUrl url={shareUrl} />
      <div className="sr-only">稿台文档画布</div>
    </div>
  );
}

function DocToolbar({
  onHighlight,
  onCopy,
  onShare,
}: {
  onHighlight: () => void;
  onCopy: () => void;
  onShare: () => void;
}) {
  const { showToast } = useStore();
  return (
    <div className="toolbar" data-testid="doc-toolbar">
      <div className="row">
        <button className="icon-btn" aria-label="+"><IconPlus /></button>
        <button className="icon-btn" aria-label="Aa"><IconAa /></button>
        <button className="icon-btn" data-testid="icon-generate-title" aria-label="生成标题" onClick={() => closedStub(showToast)}><IconSpark /></button>
        <button className="icon-btn" data-testid="icon-translate" aria-label="Translate" onClick={() => closedStub(showToast)}><IconTranslate /></button>
        <button className="icon-btn" data-testid="icon-image" aria-label="配图" onClick={() => closedStub(showToast)}><IconImage /></button>
        <button className="icon-btn" data-testid="icon-cover" aria-label="封面出图" onClick={() => closedStub(showToast)}><IconCover /></button>
        <button className="ghost" data-testid="btn-highlight" onClick={onHighlight}>高亮所选</button>
      </div>
      <div className="row">
        <button className="ghost" data-testid="btn-copy" onClick={onCopy}>复制</button>
        <button className="ghost" data-testid="btn-share" onClick={onShare}><IconShare /> Share</button>
      </div>
    </div>
  );
}

function ShareUrl({ url }: { url: string | null }) {
  if (!url) return null;
  return <p data-testid="share-url">{url}</p>;
}

function KindView({
  file,
  cue,
  setCue,
}: {
  file: MaterialFile;
  cue: number | null;
  setCue: (n: number | null) => void;
}) {
  const view = fileViewKind(file.kind);
  const views = {
    web: <WebReader file={file} />,
    document: <DocumentEditor file={file} />,
    image: <ImageViewer file={file} />,
    media: <MediaViewer file={file} cue={cue} setCue={setCue} />,
  };
  return views[view];
}

function WebReader({ file }: { file: MaterialFile }) {
  return (
    <div data-testid="web-reader">
      <h2>{file.title} ↗</h2>
      <div className="source-chip" data-testid="source-chip">{file.title}</div>
      <div className="readonly" data-testid="reader-body">{file.body}</div>
    </div>
  );
}

function DocumentEditor({ file }: { file: MaterialFile }) {
  const { act } = useStore();
  const [title, setTitle] = useState(file.title);
  const [body, setBody] = useState(file.body);
  return (
    <div data-testid="document-canvas">
      <input
        className="doc-title"
        data-testid="doc-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          void act("updateFile", { id: file.id, title: e.target.value });
        }}
      />
      <textarea
        className="doc-body"
        data-testid="doc-body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          void act("updateFile", { id: file.id, body: e.target.value });
        }}
      />
      {file.writeGenre ? <div data-testid="write-genre">体裁：{file.writeGenre}</div> : null}
      {file.sourceFileIds.length ? (
        <div data-testid="doc-sources">
          来源
          {file.sourceFileIds.map((id) => (
            <div key={id} data-source-id={id}>来源 file {id}</div>
          ))}
          <SourceNames ids={file.sourceFileIds} />
        </div>
      ) : null}
    </div>
  );
}

function ImageViewer({ file }: { file: MaterialFile }) {
  return (
    <div data-testid="image-viewer">
      <h2>{file.title}</h2>
      {file.dataUrl ? <img className="image-view" src={file.dataUrl} alt={file.title} /> : <div>图片可查看</div>}
    </div>
  );
}

function MediaViewer({
  file,
  cue,
  setCue,
}: {
  file: MaterialFile;
  cue: number | null;
  setCue: (n: number | null) => void;
}) {
  return (
    <div data-testid="media-viewer">
      <h2>{file.title}</h2>
      <MediaOrigin url={file.url} />
      <TranscriptBlock file={file} cue={cue} setCue={setCue} />
    </div>
  );
}

function MediaOrigin({ url }: { url?: string }) {
  if (url) return <p>原始链接：{url}</p>;
  return <p>原始文件仍可打开</p>;
}

function TranscriptBlock({
  file,
  cue,
  setCue,
}: {
  file: MaterialFile;
  cue: number | null;
  setCue: (n: number | null) => void;
}) {
  if (file.transcription?.status === "failed") {
    return <p data-testid="transcribe-fail">转录失败</p>;
  }
  return (
    <div>
      <p data-testid="transcript-text">{file.transcription?.text || "转录文本"}</p>
      <div>
        {(file.transcription?.cues || []).map((c) => (
          <button key={c.t} className="cue ghost" onClick={() => setCue(c.t)}>
            {c.t}s {c.text}
          </button>
        ))}
      </div>
      {cue !== null ? <p data-testid="timeline-position">已跳转到 {cue}s</p> : null}
    </div>
  );
}

function HighlightList({ highlights }: { highlights: { id: string; text: string; selected: boolean }[] }) {
  const { act } = useStore();
  if (!highlights.length) return null;
  return (
    <div data-testid="highlight-list">
      {highlights.map((h) => (
        <label key={h.id} className="hl-item">
          <input
            type="checkbox"
            checked={h.selected}
            onChange={(e) => void act("toggleHighlight", { id: h.id, selected: e.target.checked })}
          />
          高亮属于该 file：{h.text}
        </label>
      ))}
    </div>
  );
}

async function highlightCurrentFile(
  act: (type: string, payload: Record<string, unknown>) => Promise<unknown>,
  file: MaterialFile,
) {
  await act("addHighlight", { fileId: file.id, text: highlightTextFromSelection(file, selectedText()) });
}

async function copyCurrentFile(
  act: (type: string, payload: Record<string, unknown>) => Promise<unknown>,
  fileId: string,
  showToast: (msg: string) => void,
) {
  const result = (await act("copyFile", { fileId })) as { text: string };
  await writeClipboard(result.text);
  rememberCopiedText(result.text);
  showToast("已复制");
}

async function shareCurrentFile(
  act: (type: string, payload: Record<string, unknown>) => Promise<unknown>,
  fileId: string,
  setShareUrl: (url: string) => void,
) {
  const link = (await act("createShare", { fileId })) as { token: string };
  const url = absoluteShareUrl(link.token);
  setShareUrl(url);
  await writeClipboard(url);
}

function SourceNames({ ids }: { ids: string[] }) {
  const { state } = useStore();
  const names = useMemo(
    () => ids.map((id) => state.files.find((f) => f.id === id)?.title).filter(Boolean) as string[],
    [ids, state.files],
  );
  return (
    <div>
      {names.map((n) => (
        <div key={n} data-testid="source-name">{n}</div>
      ))}
    </div>
  );
}
