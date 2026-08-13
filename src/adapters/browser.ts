import { isTextMime } from "@/domain/classify";
import { sharePath } from "@/domain/share";

export function selectedText(): string {
  if (typeof window === "undefined") return "";
  return window.getSelection()?.toString().trim() ?? "";
}

export async function writeClipboard(text: string) {
  await navigator.clipboard?.writeText(text).catch(() => undefined);
}

export function rememberCopiedText(text: string) {
  (window as unknown as { __lastCopy?: string }).__lastCopy = text;
  document.body.setAttribute("data-last-copy", text);
}

export function absoluteShareUrl(token: string) {
  return `${window.location.origin}${sharePath(token)}`;
}

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export async function readLocalTextBody(file: { type: string; text: () => Promise<string> }) {
  if (!isTextMime(file.type)) return undefined;
  return file.text();
}
