import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChecklistListContent from "@/components/ChecklistListContent";
import type { Item } from "@/lib/types";

const makeItem = (id: string, text: string, extra: Partial<Item> = {}): Item => ({
  id,
  list_id: "list-1",
  text,
  is_checked: false,
  is_starred: false,
  position: 0,
  created_at: "2024-01-01T00:00:00Z",
  created_by: null,
  ...extra,
});

// Newest first, so the display order is A, B, C
const items = [
  makeItem("a", "Äpple", { created_at: "2024-01-03T00:00:00Z" }),
  makeItem("b", "Banan", { created_at: "2024-01-02T00:00:00Z" }),
  makeItem("c", "Citron", { created_at: "2024-01-01T00:00:00Z" }),
];

function renderList(
  listItems: Item[],
  hideMode: "strike" | "hide" = "strike",
) {
  const onReorder = vi.fn().mockResolvedValue(undefined);
  render(
    <ChecklistListContent
      items={listItems}
      hideMode={hideMode}
      onAdd={vi.fn().mockResolvedValue(undefined)}
      onToggle={vi.fn().mockResolvedValue(undefined)}
      onEdit={vi.fn().mockResolvedValue(undefined)}
      onToggleStar={vi.fn().mockResolvedValue(undefined)}
      onReorder={onReorder}
      emptyMessage="Tom"
    />,
  );
  return { onReorder };
}

describe("ChecklistListContent keyboard reordering", () => {
  it("moves a row down with Alt+ArrowDown and reports the new order", () => {
    const { onReorder } = renderList(items);

    fireEvent.keyDown(screen.getByRole("button", { name: "Redigera: Banan" }), {
      key: "ArrowDown",
      altKey: true,
    });

    expect(onReorder).toHaveBeenCalledWith(["a", "c", "b"]);
  });

  it("does nothing when moving the first row further up", () => {
    const { onReorder } = renderList(items);

    fireEvent.keyDown(screen.getByRole("button", { name: "Redigera: Äpple" }), {
      key: "ArrowUp",
      altKey: true,
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("keeps hidden checked items in their place when moving visible rows", () => {
    const hiddenMiddle = [
      items[0],
      makeItem("b", "Banan", {
        is_checked: true,
        created_at: "2024-01-02T00:00:00Z",
      }),
      items[2],
    ];
    const { onReorder } = renderList(hiddenMiddle, "hide");

    fireEvent.keyDown(screen.getByRole("button", { name: "Redigera: Äpple" }), {
      key: "ArrowDown",
      altKey: true,
    });

    expect(onReorder).toHaveBeenCalledWith(["c", "b", "a"]);
  });
});
