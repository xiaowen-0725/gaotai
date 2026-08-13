import type { Highlight, MaterialFile, WriteGenre } from "./types";

export function generateWriteContent(
  genre: WriteGenre,
  files: MaterialFile[],
  highlights: Highlight[],
): { title: string; body: string } {
  const fileTitles = files.map((f) => f.title);
  const highlightTexts = highlights.map((h) => h.text);
  const topic = fileTitles[0] || highlightTexts[0] || "主题";

  if (genre === "长文") {
    const title = `关于「${topic}」的长文`;
    const body = [
      `## 引言`,
      `围绕「${topic}」展开讨论。`,
      `## 分析`,
      highlightTexts.length
        ? `摘录要点：${highlightTexts.join("；")}`
        : `结合已选材料进行分析。`,
      `## 结论`,
      `以上基于所选材料整理而成。`,
      ``,
      `来源：`,
      ...fileTitles.map((t) => `- ${t}`),
      ...highlightTexts.map((t) => `- 高亮：${t}`),
    ].join("\n");
    return { title, body };
  }

  if (genre === "短文提纲") {
    const title = `${topic} · 短文提纲`;
    const body = [
      `主题：${topic}`,
      `- 背景`,
      `  - 这段写什么：交代「${topic}」从何而来`,
      `- 核心观点`,
      `  - 这段写什么：${highlightTexts[0] || "说明主论点"}`,
      `- 收束`,
      `  - 这段写什么：给出下一步`,
    ].join("\n");
    return { title, body };
  }

  if (genre === "小红书图文") {
    const title = `${topic}怎么看`;
    const body = [
      `先记住这一点。`,
      `步骤一：抓住「${topic}」的核心。`,
      `对比：有材料时更清楚，没有则容易散。`,
      highlightTexts[0] ? `摘一句：${highlightTexts[0]}` : "",
      ``,
      `#${topic.replace(/\s+/g, "")} #知识管理 #稿台笔记`,
      `建议配图：封面用一句短标题即可`,
    ]
      .filter(Boolean)
      .join("\n");
    return { title, body };
  }

  const title = `${topic} · 口播稿`;
  const body = [
    `【开场钩子】`,
    `今天只讲一件事：${topic}。`,
    `【展开点 1】`,
    `第一点，先把概念说清楚。`,
    `【展开点 2】`,
    highlightTexts[0] ? `第二点，材料里提到：${highlightTexts[0]}` : `第二点，用一个例子落地。`,
    `【展开点 3】`,
    `第三点，告诉听众可以马上做什么。`,
    `【收束】`,
    `记住：从材料出发，再开口。`,
  ].join("\n");
  return { title, body };
}

export function generateChatAnswer(
  question: string,
  files: MaterialFile[],
  highlights: Highlight[],
): { text: string; citedFileIds: string[]; citedHighlightIds: string[] } {
  const citedFileIds = files.map((f) => f.id);
  const citedHighlightIds = highlights.map((h) => h.id);
  const fileBits = files.map((f) => `来源 file「${f.title}」`);
  const highlightBits = highlights.map((h) => `高亮「${h.text}」`);
  const cites = [...fileBits, ...highlightBits].join("、") || "已选材料";
  const text = `依据 ${cites}：${question} 的要点是，先回到上述来源再作答。`;
  return { text, citedFileIds, citedHighlightIds };
}

export function applyChatEdit(current: MaterialFile, instruction: string): MaterialFile {
  return {
    ...current,
    body: `${current.body}\n\n（修订）${instruction}`,
  };
}

export function copyDocumentText(file: MaterialFile): string {
  const genre = file.writeGenre;
  if (genre === "长文") {
    return `${file.title}\n\n${file.body}`;
  }
  if (genre === "短文提纲") {
    return `${file.title}\n\n${file.body}`;
  }
  if (genre === "小红书图文") {
    return `${file.title}\n\n${file.body}`;
  }
  if (genre === "口播稿") {
    return `${file.title}\n\n${file.body}`;
  }
  return `${file.title}\n\n${file.body}`;
}

export function classifyLink(url: string): FileKind {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  return "web";
}

export function classifyLocalName(name: string, mime?: string): FileKind {
  const lower = name.toLowerCase();
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return "image";
  if (m.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg)$/.test(lower)) return "audio";
  if (m.startsWith("video/") || /\.(mp4|webm|mov)$/.test(lower)) return "video";
  return "document";
}

export function fakeTranscription(file: MaterialFile, force?: "success" | "failed") {
  const failHint =
    force === "failed" ||
    (file.title + (file.url || "")).toLowerCase().includes("fail");
  if (failHint) {
    return {
      status: "failed" as const,
      error: "转录失败",
    };
  }
  return {
    status: "success" as const,
    text: `这是「${file.title}」的转录文本。`,
    cues: [
      { t: 0, text: "开场" },
      { t: 12, text: "要点" },
      { t: 30, text: "收束" },
    ],
  };
}
