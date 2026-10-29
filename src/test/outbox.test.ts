import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyPending,
  enqueue,
  flushOutbox,
  pendingCount,
} from "@/lib/outbox";
import type { ListStore } from "@/lib/listStore";
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

function fakeStore(overrides: Partial<ListStore> = {}) {
  return {
    addItem: vi.fn().mockResolvedValue(undefined),
    updateItem: vi.fn().mockResolvedValue(undefined),
    reorderItems: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ListStore & {
    addItem: ReturnType<typeof vi.fn>;
    updateItem: ReturnType<typeof vi.fn>;
    reorderItems: ReturnType<typeof vi.fn>;
  };
}

describe("outbox", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("applies waiting changes on top of a list from the server", () => {
    enqueue({ kind: "add", listId: "list-1", item: makeItem("new") });
    enqueue({
      kind: "update",
      listId: "list-1",
      itemId: "old",
      patch: { is_checked: true },
    });

    const result = applyPending([makeItem("old")], "list-1");

    expect(result.map((i) => i.id)).toEqual(["new", "old"]);
    expect(result[1].is_checked).toBe(true);
  });

  it("sends waiting changes in order and empties the queue", async () => {
    const store = fakeStore();
    enqueue({ kind: "add", listId: "list-1", item: makeItem("a") });
    enqueue({
      kind: "update",
      listId: "list-1",
      itemId: "a",
      patch: { is_checked: true },
    });

    await flushOutbox(store, vi.fn());

    expect(pendingCount()).toBe(0);
    expect(store.addItem).toHaveBeenCalledWith("list-1", expect.objectContaining({ id: "a" }));
    expect(store.updateItem).toHaveBeenCalledWith("a", { is_checked: true });
    expect(store.addItem.mock.invocationCallOrder[0]).toBeLessThan(
      store.updateItem.mock.invocationCallOrder[0],
    );
  });

  it("keeps the change when the connection is down, no matter how often it fails", async () => {
    const store = fakeStore({
      addItem: vi.fn().mockRejectedValue(new Error("Failed to fetch")),
    });
    const onDropped = vi.fn();
    enqueue({ kind: "add", listId: "list-1", item: makeItem("a") });

    for (let i = 0; i < 10; i++) {
      await flushOutbox(store, onDropped);
    }

    expect(onDropped).not.toHaveBeenCalled();
    expect(pendingCount()).toBe(1);
    expect(window.localStorage.getItem("listkompis_outbox")).toContain('"a"');
  });

  it("drops a change the server keeps rejecting and reports it", async () => {
    const store = fakeStore({
      addItem: vi
        .fn()
        .mockRejectedValue(new Error("new row violates row-level security")),
    });
    const onDropped = vi.fn();
    enqueue({ kind: "add", listId: "list-1", item: makeItem("a") });

    for (let i = 0; i < 10 && pendingCount() > 0; i++) {
      await flushOutbox(store, onDropped);
    }

    expect(pendingCount()).toBe(0);
    expect(onDropped).toHaveBeenCalledTimes(1);
  });
});
