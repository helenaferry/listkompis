import { useRef, useState } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import ChecklistItem from "./ChecklistItem";
import NewItemRow from "./NewItemRow";
import { sortItems } from "@/lib/sortItems";
import type { Item } from "@/lib/types";

export type HideMode = "strike" | "hide";

// Puts the visible items back into the full group order. Hidden items keep their slots.
function mergeVisibleOrder(
  allIds: string[],
  visibleBefore: string[],
  visibleAfter: string[],
): string[] {
  const visible = new Set(visibleBefore);
  let next = 0;
  return allIds.map((id) => (visible.has(id) ? visibleAfter[next++] : id));
}

interface ChecklistListContentProps {
  items: Item[];
  hideMode: HideMode;
  onAdd: (text: string, isStarred?: boolean) => Promise<void>;
  onToggle: (id: string, checked: boolean) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onToggleStar: (id: string, starred: boolean) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
  emptyMessage: string;
  prefLoaded?: boolean;
}

export default function ChecklistListContent({
  items,
  hideMode,
  onAdd,
  onToggle,
  onEdit,
  onToggleStar,
  onReorder,
  emptyMessage,
  prefLoaded = true,
}: ChecklistListContentProps) {
  const [lastMove, setLastMove] = useState<{ id: string; seq: number } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");
  // Which group is being dragged right now, so the other group can show it is not a drop target
  const [dragGroup, setDragGroup] = useState<"starred" | "regular" | null>(
    null,
  );
  // True while the dragged row is past the separator, into the other group
  const [blockedDrop, setBlockedDrop] = useState(false);
  const dividerRef = useRef<HTMLLIElement>(null);

  const sortedItems = sortItems(items);
  const visibleItems = sortItems(
    hideMode === "hide" ? items.filter((i) => !i.is_checked) : items,
  );
  const starredItems = visibleItems.filter((item) => item.is_starred);
  const regularItems = visibleItems.filter((item) => !item.is_starred);

  // Visible ids per group, and all ids per group (including hidden checked items)
  const starredIds = starredItems.map((item) => item.id);
  const regularIds = regularItems.map((item) => item.id);
  const allStarredIds = sortedItems
    .filter((item) => item.is_starred)
    .map((item) => item.id);
  const allRegularIds = sortedItems
    .filter((item) => !item.is_starred)
    .map((item) => item.id);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const textOf = (id: string | number) =>
    items.find((item) => item.id === String(id))?.text ?? "";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Plockade upp ${textOf(active.id)}`,
    onDragOver: ({ active }) => `Flyttar ${textOf(active.id)}`,
    onDragEnd: ({ active }) => `Släppte ${textOf(active.id)}`,
    onDragCancel: ({ active }) => `Flytten av ${textOf(active.id)} avbröts`,
  };

  const handleDragMove =
    (group: "starred" | "regular") => (event: DragMoveEvent) => {
      const rect = event.active.rect.current.translated;
      const divider = dividerRef.current?.getBoundingClientRect();
      if (!rect || !divider) return;
      const centerY = rect.top + rect.height / 2;
      setBlockedDrop(
        group === "starred" ? centerY > divider.top : centerY < divider.bottom,
      );
    };

  const endDrag = () => {
    setDragGroup(null);
    setBlockedDrop(false);
  };

  const handleDragEnd =
    (allIds: string[], visibleIds: string[]) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const from = visibleIds.indexOf(String(active.id));
      const to = visibleIds.indexOf(String(over.id));
      void onReorder(
        mergeVisibleOrder(allIds, visibleIds, arrayMove(visibleIds, from, to)),
      );
    };

  const moveItem = (id: string, delta: number) => {
    const inStarred = starredIds.includes(id);
    const visibleIds = inStarred ? starredIds : regularIds;
    const allIds = inStarred ? allStarredIds : allRegularIds;
    const from = visibleIds.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= visibleIds.length) return;

    void onReorder(
      mergeVisibleOrder(allIds, visibleIds, arrayMove(visibleIds, from, to)),
    );
    setLastMove((prev) => ({ id, seq: (prev?.seq ?? 0) + 1 }));
    setAnnouncement(`Flyttad till plats ${to + 1} av ${visibleIds.length}`);
  };

  return (
    <ul
      className={`space-y-1.5 transition-opacity duration-100 ${prefLoaded ? "opacity-100" : "opacity-0"}`}
    >
      <NewItemRow onAdd={onAdd} />
      <DndContext
        id="starred"
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragStart={() => setDragGroup("starred")}
        onDragMove={handleDragMove("starred")}
        onDragCancel={endDrag}
        onDragEnd={(event) => {
          endDrag();
          handleDragEnd(allStarredIds, starredIds)(event);
        }}
      >
        <SortableContext
          items={starredIds}
          strategy={verticalListSortingStrategy}
        >
          {starredItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onToggleStar={onToggleStar}
              dimmed={dragGroup === "regular"}
              onMove={moveItem}
              focusRequest={lastMove?.id === item.id ? lastMove.seq : undefined}
              hideMode={hideMode}
            />
          ))}
        </SortableContext>
      </DndContext>
      {starredItems.length > 0 && regularItems.length > 0 && (
        <li
          ref={dividerRef}
          className="relative my-3 border-b-3 border-yellow-500/80 dark:border-yellow-400/80"
        >
          {blockedDrop && (
            <span
              role="status"
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 shadow dark:bg-red-950 dark:text-red-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Stjärnmärkta saker sorteras för sig
            </span>
          )}
        </li>
      )}
      <DndContext
        id="regular"
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragStart={() => setDragGroup("regular")}
        onDragMove={handleDragMove("regular")}
        onDragCancel={endDrag}
        onDragEnd={(event) => {
          endDrag();
          handleDragEnd(allRegularIds, regularIds)(event);
        }}
      >
        <SortableContext
          items={regularIds}
          strategy={verticalListSortingStrategy}
        >
          {regularItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onToggleStar={onToggleStar}
              dimmed={dragGroup === "starred"}
              onMove={moveItem}
              focusRequest={lastMove?.id === item.id ? lastMove.seq : undefined}
              hideMode={hideMode}
            />
          ))}
        </SortableContext>
      </DndContext>
      <li role="status" aria-live="polite" className="sr-only">
        {announcement}
      </li>
      {visibleItems.length === 0 && (
        <li className="text-center text-gray-400 py-8 text-sm dark:text-zinc-500">
          {emptyMessage}
        </li>
      )}
    </ul>
  );
}
