import type { FileKind } from "./types";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg)$/;
const VIDEO_EXT = /\.(mp4|webm|mov)$/;

export function classifyLink(url: string): FileKind {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  return "web";
}

export function linkPreview(url: string) {
  const kind = classifyLink(url);
  if (kind === "youtube") {
    return { kind, title: "YouTube 视频", body: `YouTube 来源：${url}` };
  }
  const title = titleFromUrl(url);
  return { kind, title, body: cleanWebBody(url, title) };
}

function isImage(name: string, mime: string) {
  return mime.startsWith("image/") || IMAGE_EXT.test(name);
}

function isAudio(name: string, mime: string) {
  return mime.startsWith("audio/") || AUDIO_EXT.test(name);
}

function isVideo(name: string, mime: string) {
  return mime.startsWith("video/") || VIDEO_EXT.test(name);
}

export function localFileBody(name: string, kind: FileKind, body?: string) {
  if (body !== undefined) return body;
  return kind === "document" ? `本地文档：${name}` : "";
}

export function classifyLocalName(name: string, mime?: string): FileKind {
  const lower = name.toLowerCase();
  const kindMime = (mime ?? "").toLowerCase();
  if (isImage(lower, kindMime)) return "image";
  if (isAudio(lower, kindMime)) return "audio";
  if (isVideo(lower, kindMime)) return "video";
  return "document";
}

export function parsePastedLinks(text: string, max = 50) {
  const all = text.split(/[\s\n]+/).map((item) => item.trim()).filter(Boolean);
  return { all, urls: all.slice(0, max), count: all.length };
}

export function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function cleanWebBody(url: string, title: string): string {
  return [
    `${title} 的干净阅读正文。`,
    `原文去掉导航、广告与侧栏后，只保留文章主体。`,
    `来源页面：${url}`,
  ].join("\n\n");
}
