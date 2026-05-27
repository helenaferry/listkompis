"use client";

export type { Item } from "@/lib/types";
import type { Item } from "@/lib/types";
import { useState } from "react";

interface Props {
  item: Item;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (id: string, text: string) => void;
  hideMode: "strike" | "hide";
}

export default function ChecklistItem({ item, onToggle, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

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

  return (
    <li className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700 dark:shadow-none">
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
          className={`flex-1 text-gray-800 break-words cursor-text dark:text-[#e8e2d6] ${
            item.is_checked
              ? "line-through text-gray-400 dark:text-zinc-600"
              : ""
          }`}
        >
          {item.text}
        </span>
      )}
    </li>
  );
}
