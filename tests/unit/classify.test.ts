import { describe, expect, it } from "vitest";
import {
  classifyLink,
  classifyLocalName,
  cleanWebBody,
  linkPreview,
  isTextMime,
  localFileBody,
  parsePastedLinks,
  titleFromUrl,
} from "@/domain/classify";

describe("classify", () => {
  it("classifies youtube and generic web links", () => {
    expect(classifyLink("https://www.youtube.com/watch?v=1")).toBe("youtube");
    expect(classifyLink("https://youtu.be/1")).toBe("youtube");
    expect(classifyLink("https://example.com/a")).toBe("web");
  });

  it("classifies local names by mime or extension", () => {
    expect(classifyLocalName("a.png", "image/png")).toBe("image");
    expect(classifyLocalName("shot.JPG")).toBe("image");
    expect(classifyLocalName("voice.mp3")).toBe("audio");
    expect(classifyLocalName("clip.wav", "audio/wav")).toBe("audio");
    expect(classifyLocalName("movie.mp4")).toBe("video");
    expect(classifyLocalName("notes.txt")).toBe("document");
    expect(classifyLocalName("notes.txt", "text/plain")).toBe("document");
    expect(localFileBody("notes.txt", "document")).toBe("本地文档：notes.txt");
    expect(localFileBody("shot.png", "image")).toBe("");
    expect(localFileBody("notes.txt", "document", "hello")).toBe("hello");
    expect(isTextMime("text/plain")).toBe(true);
    expect(isTextMime("image/png")).toBe(false);
  });

  it("parses pasted links with a 50 cap", () => {
    const parsed = parsePastedLinks("https://a.com\nhttps://b.com  https://c.com");
    expect(parsed.count).toBe(3);
    expect(parsed.urls).toEqual(["https://a.com", "https://b.com", "https://c.com"]);
    const many = parsePastedLinks(Array.from({ length: 52 }, (_, i) => `https://x.com/${i}`).join(" "));
    expect(many.count).toBe(52);
    expect(many.urls).toHaveLength(50);
  });

  it("derives a host title and clean web body", () => {
    expect(titleFromUrl("https://www.example.com/path")).toBe("example.com");
    expect(titleFromUrl("not-a-url")).toBe("not-a-url");
    expect(cleanWebBody("https://example.com", "example.com")).toContain("干净阅读正文");
    expect(linkPreview("https://youtu.be/1")).toEqual({
      kind: "youtube",
      title: "YouTube 视频",
      body: "YouTube 来源：https://youtu.be/1",
    });
    expect(linkPreview("https://www.example.com/a").title).toBe("example.com");
  });
});
