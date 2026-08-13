import type { Highlight, MaterialFile, WriteGenre } from "./types";

export const WRITE_GENRES: WriteGenre[] = ["长文", "短文提纲", "小红书图文", "口播稿"];

export function topicFrom(files: MaterialFile[], highlights: Highlight[]): string {
  return files[0]?.title || highlights[0]?.text || "主题";
}

function writeLongform(topic: string, fileTitles: string[], highlightTexts: string[]) {
  const analysis = highlightTexts.length
    ? `摘录要点：${highlightTexts.join("；")}`
    : `结合已选材料进行分析。`;
  return {
    title: `关于「${topic}」的长文`,
    body: [
      `## 引言`,
      `围绕「${topic}」展开讨论。`,
      `## 分析`,
      analysis,
      `## 结论`,
      `以上基于所选材料整理而成。`,
      ``,
      `来源：`,
      ...fileTitles.map((t) => `- ${t}`),
      ...highlightTexts.map((t) => `- 高亮：${t}`),
    ].join("\n"),
  };
}

function writeOutline(topic: string, _fileTitles: string[], highlightTexts: string[]) {
  return {
    title: `${topic} · 短文提纲`,
    body: [
      `主题：${topic}`,
      `- 背景`,
      `  - 这段写什么：交代「${topic}」从何而来`,
      `- 核心观点`,
      `  - 这段写什么：${highlightTexts[0] || "说明主论点"}`,
      `- 收束`,
      `  - 这段写什么：给出下一步`,
    ].join("\n"),
  };
}

function writeXhs(topic: string, _fileTitles: string[], highlightTexts: string[]) {
  return {
    title: `${topic}怎么看`,
    body: [
      `先记住这一点。`,
      `步骤一：抓住「${topic}」的核心。`,
      `对比：有材料时更清楚，没有则容易散。`,
      highlightTexts[0] ? `摘一句：${highlightTexts[0]}` : "",
      ``,
      `#${topic.replace(/\s+/g, "")} #知识管理 #稿台笔记`,
      `建议配图：封面用一句短标题即可`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function writeScript(topic: string, _fileTitles: string[], highlightTexts: string[]) {
  const pointTwo = highlightTexts[0]
    ? `第二点，材料里提到：${highlightTexts[0]}`
    : `第二点，用一个例子落地。`;
  return {
    title: `${topic} · 口播稿`,
    body: [
      `【开场钩子】`,
      `今天只讲一件事：${topic}。`,
      `【展开点 1】`,
      `第一点，先把概念说清楚。`,
      `【展开点 2】`,
      pointTwo,
      `【展开点 3】`,
      `第三点，告诉听众可以马上做什么。`,
      `【收束】`,
      `记住：从材料出发，再开口。`,
    ].join("\n"),
  };
}

const WRITE_TEMPLATES: Record<WriteGenre, (topic: string, fileTitles: string[], highlightTexts: string[]) => { title: string; body: string }> = {
  长文: writeLongform,
  短文提纲: writeOutline,
  小红书图文: writeXhs,
  口播稿: writeScript,
};

export function generateWriteContent(
  genre: WriteGenre,
  files: MaterialFile[],
  highlights: Highlight[],
): { title: string; body: string } {
  const topic = topicFrom(files, highlights);
  return WRITE_TEMPLATES[genre](topic, files.map((f) => f.title), highlights.map((h) => h.text));
}
