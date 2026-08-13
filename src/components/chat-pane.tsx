"use client";

import { useState } from "react";
import { closedStub, useStore } from "./store-context";
import { IconCopy, IconPlus, IconRetry, IconSave, IconSpark, IconThumb, IconThumbDown, IconWand } from "./icons";
import { questionToAsk } from "./file-view";

async function sendChat(
  act: (type: string, payload: Record<string, unknown>) => Promise<unknown>,
  taskId: string,
  text: string,
  currentFileId: string | null,
  setText: (value: string) => void,
) {
  const question = questionToAsk(text);
  if (!question) return;
  await act("askChat", { taskId, question, currentFileId });
  setText("");
}

export function ChatPane({ taskId, currentFileId }: { taskId: string; currentFileId: string | null }) {
  const { state, act, showToast } = useStore();
  const task = state.tasks.find((t) => t.id === taskId);
  const [text, setText] = useState("");
  if (!task) return null;

  return (
    <div className="chat" data-testid="chat-pane">
      <div className="bubbles">
        {task.messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="user-bubble" data-testid="user-bubble">{m.text}</div>
          ) : (
            <div key={m.id} className="assistant" data-testid="assistant-bubble">
              <div className="ran">Ran for {m.ranForSeconds ?? 5}s &gt;</div>
              <div>{m.text}</div>
              <div className="msg-tools" data-testid="answer-toolbar">
                <button className="icon-btn" aria-label="复制"><IconCopy /></button>
                <button className="icon-btn" aria-label="保存"><IconSave /></button>
                <button className="icon-btn" aria-label="重试"><IconRetry /></button>
                <button className="icon-btn" aria-label="赞"><IconThumb /></button>
                <button className="icon-btn" aria-label="踩"><IconThumbDown /></button>
                <button className="icon-btn" aria-label="翻译" onClick={() => closedStub(showToast)}><IconWand /></button>
              </div>
            </div>
          ),
        )}
      </div>
      <div className="composer">
        <textarea
          data-testid="chat-input"
          placeholder="Message"
          aria-label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="composer-bar">
          <div className="row">
            <button className="icon-btn" data-testid="chat-plus" aria-label="+"><IconPlus /></button>
            <button className="icon-btn" data-testid="chat-cube" aria-label="cube"><IconSpark /></button>
          </div>
          <button className="icon-btn round" onClick={() => void sendChat(act, taskId, text, currentFileId, setText)} aria-label="发送">↑</button>
        </div>
      </div>
    </div>
  );
}
