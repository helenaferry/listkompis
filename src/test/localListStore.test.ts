import { beforeEach, describe, expect, it } from "vitest";
import { loadLocalItems, localListStore } from "@/lib/localListStore";
import type { Item } from "@/lib/types";

const makeItem = (id: string): Item => ({
  id,
  list_id: "list-1",
  text: id,
  is_checked: false,
  is_starred: false,
  position: 0,
  created_at: "2024-01-01T00:00:00Z",
  created_by: null,
});

describe("localListStore.reorderItems", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "listkompis_items",
      JSON.stringify([makeItem("a"), makeItem("b"), makeItem("c")]),
    );
  });

  it("sets each item's position to its index in the new order", async () => {
    await localListStore.reorderItems("list-1", ["c", "a", "b"]);

    const positions = Object.fromEntries(
      loadLocalItems("list-1").map((i) => [i.id, i.position]),
    );
    expect(positions).toEqual({ c: 0, a: 1, b: 2 });
  });
});
