import { afterEach, describe, expect, it, vi } from "vitest";
import {
  absoluteShareUrl,
  readAsDataUrl,
  readLocalTextBody,
  rememberCopiedText,
  selectedText,
  writeClipboard,
} from "@/adapters/browser";

describe("browser adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty selection when window is missing or blank", () => {
    expect(selectedText()).toBe("");
    vi.stubGlobal("window", { getSelection: () => ({ toString: () => "  hi  " }) });
    expect(selectedText()).toBe("hi");
    vi.stubGlobal("window", { getSelection: () => ({ toString: () => "   " }) });
    expect(selectedText()).toBe("");
    vi.stubGlobal("window", { getSelection: () => null });
    expect(selectedText()).toBe("");
  });

  it("writes the clipboard and remembers the last copied text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await writeClipboard("copied");
    expect(writeText).toHaveBeenCalledWith("copied");
    const setAttribute = vi.fn();
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { body: { setAttribute } });
    rememberCopiedText("copied");
    expect((window as unknown as { __lastCopy?: string }).__lastCopy).toBe("copied");
    expect(setAttribute).toHaveBeenCalledWith("data-last-copy", "copied");
  });

  it("builds an absolute share URL from the current origin", () => {
    vi.stubGlobal("window", { location: { origin: "http://127.0.0.1:3000" } });
    expect(absoluteShareUrl("tok-1")).toBe("http://127.0.0.1:3000/share/tok-1");
  });

  it("reads a blob as a data URL and only loads local text/* bodies", async () => {
    class FakeReader {
      result: string | null = "data:text/plain;base64,xx";
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.onload?.();
      }
    }
    vi.stubGlobal("FileReader", FakeReader);
    await expect(readAsDataUrl({} as Blob)).resolves.toBe("data:text/plain;base64,xx");
    class EmptyReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.onload?.();
      }
    }
    vi.stubGlobal("FileReader", EmptyReader);
    await expect(readAsDataUrl({} as Blob)).resolves.toBe("");
    await expect(readLocalTextBody({ type: "text/plain", text: async () => "hi" })).resolves.toBe("hi");
    await expect(readLocalTextBody({ type: "image/png", text: async () => "no" })).resolves.toBeUndefined();
  });
});
