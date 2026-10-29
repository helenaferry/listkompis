"use client";

import { useRef, useState } from "react";

interface Props {
  onAdd: (text: string, isStarred?: boolean) => Promise<void>;
}

export default function NewItemRow({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clears the field before saving, so a second Enter cannot add the same item again
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const starred = isStarred;
    setText("");
    setIsStarred(false);
    inputRef.current?.focus();
    if (starred) {
      void onAdd(trimmed, true);
    } else {
      void onAdd(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") {
      setText("");
      setIsStarred(false);
    }
  };

  return (
    <li className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:shadow-none sm:gap-3 sm:px-4 sm:py-2.5">
      <input
        type="checkbox"
        disabled
        className="h-5 w-5 flex-shrink-0 rounded border-gray-200 opacity-25 dark:border-zinc-600"
        aria-hidden
      />
      <input
        id="new-item-input"
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Lägg till…"
        maxLength={500}
        className="min-w-0 flex-1 bg-transparent text-gray-800 focus:outline-none placeholder-gray-300 dark:text-[#e8e2d6] dark:placeholder-zinc-600"
        aria-label="Skriv in ny sak"
      />
      <button
        type="button"
        onClick={() => setIsStarred((prev) => !prev)}
        aria-label={
          isStarred ? "Ta bort stjärnmärkning från ny sak" : "Stjärnmärk ny sak"
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
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!text.trim()}
        aria-label="Lägg till ny sak"
        className="flex-shrink-0 rounded-lg bg-blue-600 px-2 py-1.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 sm:px-3 sm:py-2 sm:text-sm"
      >
        <span className="block text-lg font-bold leading-none sm:hidden">
          +
        </span>
        <span className="hidden sm:inline">Lägg till</span>
      </button>
    </li>
  );
}
