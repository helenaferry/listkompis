"use client";

export type { Item } from "@/lib/types";
import type { Item } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  item: Item;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (id: string, text: string) => void;
  onToggleStar?: (id: string, starred: boolean) => void;
  onMove?: (id: string, delta: number) => void;
  // Changes each time the row is moved with the keyboard, so the row can keep focus
  focusRequest?: number;
  // Set while a row from the other group (starred / regular) is being dragged
  dimmed?: boolean;
  hideMode: "strike" | "hide";
}

export default function ChecklistItem({
  item,
  onToggle,
  onEdit,
  onToggleStar,
  onMove,
  focusRequest,
  dimmed = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const textRef = useRef<HTMLSpanElement>(null);
  const isStarred = Boolean(item.is_starred);
  const { setNodeRef, transform, transition, isDragging, listeners } =
    useSortable({ id: item.id });

  useEffect(() => {
    if (focusRequest !== undefined) textRef.current?.focus();
  }, [focusRequest]);

  const startEdit = () => {
    setDraft(item.text);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.text) {
      onEdit(item.id, trimmed);
    } else {
      setDraft(item.text);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") {
      setDraft(item.text);
      setEditing(false);
    }
  };

  const handleMoveKey = (e: React.KeyboardEvent) => {
    if (!e.altKey || editing) return;
    const delta =
      e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    onMove?.(item.id, delta);
  };

  // Only vertical movement: a row can only be moved within its own group
  const dragTransform = transform && { ...transform, x: 0 };

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(dragTransform),
        transition,
      }}
      {...listeners}
      onKeyDown={handleMoveKey}
      className={`flex items-center gap-3 rounded-lg border px-4 py-2 transition-colors ${
        isStarred
          ? "mb-2 border-yellow-200 bg-yellow-50 shadow-none dark:border-yellow-800 dark:bg-yellow-950/30"
          : "border-gray-100 bg-white shadow-none dark:border-zinc-700 dark:bg-zinc-800"
      } ${isDragging ? "relative z-10 opacity-80 shadow-lg" : ""} ${
        dimmed ? "cursor-not-allowed opacity-50 [&_*]:cursor-not-allowed" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={item.is_checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0 dark:border-zinc-600"
        aria-label={`Bocka av: ${item.text}`}
      />
      {editing ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          maxLength={500}
          autoFocus
          className="flex-1 text-gray-800 bg-transparent border-b border-blue-400 focus:outline-none dark:text-[#f0ead6]"
          aria-label="Redigera"
        />
      ) : (
        <span
          ref={textRef}
          onClick={startEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              startEdit();
            }
          }}
          aria-label={`Redigera: ${item.text}`}
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
          className={`flex-1 text-gray-800 break-words cursor-text dark:text-[#e8e2d6] ${
            item.is_checked
              ? "line-through text-gray-400 dark:text-zinc-600"
              : ""
          }`}
        >
          {item.text}
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar?.(item.id, !isStarred);
        }}
        aria-label={
          isStarred
            ? `Ta bort stjärnmärkning från ${item.text}`
            : `Stjärnmärk ${item.text}`
        }
        aria-pressed={isStarred}
        className={`flex-shrink-0 rounded-full p-1.5 transition-colors ${
          isStarred
            ? "text-yellow-500 dark:text-yellow-400"
            : "text-gray-300 hover:text-yellow-500 dark:text-zinc-500 dark:hover:text-yellow-400"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isStarred ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 2.75l2.8 5.67 6.26.91-4.53 4.42 1.07 6.25L12 16.3l-5.6 2.94 1.07-6.25L2.94 9.33l6.26-.91L12 2.75z" />
        </svg>
      </button>
    </li>
  );
}
