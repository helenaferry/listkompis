"use client";

import { useState } from "react";

interface Props {
  onAdd: (text: string) => Promise<void>;
}

export default function AddItemForm({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    await onAdd(trimmed);
    setText("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Lägg till sak…"
        maxLength={500}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
        aria-label="Ny sak i listan"
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
      >
        Lägg till
      </button>
    </form>
  );
}
