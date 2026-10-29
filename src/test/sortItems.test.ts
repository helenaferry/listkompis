import { describe, expect, it } from "vitest";
import { sortItems } from "@/lib/sortItems";
import type { Item } from "@/lib/types";

const makeItem = (id: string, extra: Partial<Item> = {}): Item => ({
  id,
  list_id: "list-1",
  text: id,
  is_checked: false,
  is_starred: false,
  position: 0,
  created_at: "2024-01-01T00:00:00Z",
  created_by: null,
  ...extra,
});

describe("sortItems", () => {
  it("puts starred items first, then by position, then newest first", () => {
    const sorted = sortItems([
      makeItem("old", { created_at: "2024-01-01T00:00:00Z" }),
      makeItem("new", { created_at: "2024-01-05T00:00:00Z" }),
      makeItem("second", { position: 1 }),
      makeItem("first", { position: 0 }),
      makeItem("star", { is_starred: true, position: 9 }),
    ]);

    expect(sorted.map((i) => i.id)).toEqual([
      "star",
      "new",
      "old",
      "first",
      "second",
    ]);
  });
});
