"use client";

import { useRef, useState } from "react";

interface Props {
  onAdd: (text: string) => Promise<void>;
}

export default function NewItemRow({ onAdd }: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") await submit();
    if (e.key === "Escape") setText("");
  };

  return (
    <li className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-dashed border-gray-200">
      <input
        type="checkbox"
        disabled
        className="h-5 w-5 rounded border-gray-200 flex-shrink-0 opacity-25"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={submit}
        onKeyDown={handleKeyDown}
        placeholder="Lägg till…"
        maxLength={500}
        className="flex-1 text-gray-800 bg-transparent focus:outline-none placeholder-gray-300"
        aria-label="Ny sak i listan"
      />
    </li>
  );
}
