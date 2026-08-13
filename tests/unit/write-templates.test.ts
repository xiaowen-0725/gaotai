import { describe, expect, it } from "vitest";
import type { Highlight, MaterialFile } from "@/domain/types";
import { WRITE_GENRES, generateWriteContent, topicFrom } from "@/domain/write-templates";

const file = (title: string): MaterialFile =>
  ({
    id: "f",
    boardId: "b",
    kind: "document",
    title,
    body: "",
    folderId: null,
    selected: true,
    sourceFileIds: [],
    sourceHighlightIds: [],
    createdAt: "t",
  }) as MaterialFile;

const highlight = (text: string): Highlight => ({
  id: "h",
  fileId: "f",
  boardId: "b",
  text,
  selected: true,
});

describe("write templates", () => {
  it("exposes the four Chinese genre names in order", () => {
    expect(WRITE_GENRES).toEqual(["长文", "短文提纲", "小红书图文", "口播稿"]);
  });

  it("picks topic from the first file title, then highlight, then 主题", () => {
    expect(topicFrom([file("甲")], [highlight("摘")])).toBe("甲");
    expect(topicFrom([file("")], [highlight("摘")])).toBe("摘");
    expect(topicFrom([], [highlight("摘")])).toBe("摘");
    expect(topicFrom([], [])).toBe("主题");
  });

  it("renders 长文 with sections, analysis fallback, and sources", () => {
    expect(generateWriteContent("长文", [file("甲")], [highlight("摘")])).toEqual({
      title: "关于「甲」的长文",
      body: [
        "## 引言",
        "围绕「甲」展开讨论。",
        "## 分析",
        "摘录要点：摘",
        "## 结论",
        "以上基于所选材料整理而成。",
        "",
        "来源：",
        "- 甲",
        "- 高亮：摘",
      ].join("\n"),
    });
    expect(generateWriteContent("长文", [file("甲")], [])).toEqual({
      title: "关于「甲」的长文",
      body: [
        "## 引言",
        "围绕「甲」展开讨论。",
        "## 分析",
        "结合已选材料进行分析。",
        "## 结论",
        "以上基于所选材料整理而成。",
        "",
        "来源：",
        "- 甲",
      ].join("\n"),
    });
  });

  it("renders 短文提纲 as nested bullets with a highlight or default point", () => {
    expect(generateWriteContent("短文提纲", [file("甲")], [highlight("摘")])).toEqual({
      title: "甲 · 短文提纲",
      body: [
        "主题：甲",
        "- 背景",
        "  - 这段写什么：交代「甲」从何而来",
        "- 核心观点",
        "  - 这段写什么：摘",
        "- 收束",
        "  - 这段写什么：给出下一步",
      ].join("\n"),
    });
    expect(generateWriteContent("短文提纲", [file("甲")], []).body).toContain("说明主论点");
  });

  it("renders 小红书图文 with tags, optional quote, and no empty lines from missing highlights", () => {
    const withHl = generateWriteContent("小红书图文", [file("知识 管理")], [highlight("摘")]);
    expect(withHl).toEqual({
      title: "知识 管理怎么看",
      body: [
        "先记住这一点。",
        "步骤一：抓住「知识 管理」的核心。",
        "对比：有材料时更清楚，没有则容易散。",
        "摘一句：摘",
        "#知识管理 #知识管理 #稿台笔记",
        "建议配图：封面用一句短标题即可",
      ].join("\n"),
    });
    const without = generateWriteContent("小红书图文", [file("甲")], []);
    expect(without.body).not.toContain("摘一句");
    expect(without.body).toContain("#甲 #知识管理 #稿台笔记");
  });

  it("renders 口播稿 with three points and a highlight or example fallback", () => {
    expect(generateWriteContent("口播稿", [file("甲")], [highlight("摘")])).toEqual({
      title: "甲 · 口播稿",
      body: [
        "【开场钩子】",
        "今天只讲一件事：甲。",
        "【展开点 1】",
        "第一点，先把概念说清楚。",
        "【展开点 2】",
        "第二点，材料里提到：摘",
        "【展开点 3】",
        "第三点，告诉听众可以马上做什么。",
        "【收束】",
        "记住：从材料出发，再开口。",
      ].join("\n"),
    });
    expect(generateWriteContent("口播稿", [file("甲")], []).body).toContain("第二点，用一个例子落地。");
  });
});
