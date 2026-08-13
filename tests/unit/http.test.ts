import { afterEach, describe, expect, it, vi } from "vitest";
import { getJson, postJson } from "@/adapters/http";

describe("http adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads JSON with a no-store GET and preserves ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(getJson("/api/state")).resolves.toEqual({ ok: true, data: { id: "1" } });
    expect(fetchMock).toHaveBeenCalledWith("/api/state", { cache: "no-store" });
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "no" }),
    });
    await expect(getJson("/api/state")).resolves.toEqual({ ok: false, data: { error: "no" } });
  });

  it("posts JSON with the application/json header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(postJson("/api/action", { type: "createBoard" })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "createBoard" }),
    });
  });
});
