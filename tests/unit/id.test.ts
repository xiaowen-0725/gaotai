import { describe, expect, it } from "vitest";
import { createId } from "@/domain/id";

describe("createId", () => {
  it("prefixes the id and keeps two random/time segments", () => {
    const id = createId("board");
    expect(id.startsWith("board-")).toBe(true);
    expect(id.split("-")).toHaveLength(3);
    expect(createId("file").startsWith("file-")).toBe(true);
    expect(createId("share").startsWith("share-")).toBe(true);
  });

  it("does not repeat the same id", () => {
    const seen = new Set(Array.from({ length: 20 }, () => createId("board")));
    expect(seen.size).toBe(20);
  });
});
