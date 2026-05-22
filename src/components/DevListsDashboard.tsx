"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListEntry } from "@/lib/types";

const LISTS_KEY = "listkompis_lists";

function loadLists(): ListEntry[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    return raw ? (JSON.parse(raw) as ListEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLists(lists: ListEntry[]) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export default function DevListsDashboard() {
  const [lists, setLists] = useState<ListEntry[]>([]);
  const [newName, setNewName] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLists(loadLists());
  }, []);

  const updateLists = (next: ListEntry[]) => {
    setLists(next);
    saveLists(next);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const newList: ListEntry = {
      id: crypto.randomUUID(),
      name,
      created_at: new Date().toISOString(),
      is_favorite: false,
    };
    updateLists([...lists, newList]);
    setNewName("");
    router.push(`/lista/${newList.id}`);
  };

  const handleFavorite = (listId: string, currentlyFavorite: boolean) => {
    if (currentlyFavorite) {
      updateLists(
        lists.map((l) => (l.id === listId ? { ...l, is_favorite: false } : l)),
      );
    } else {
      updateLists(lists.map((l) => ({ ...l, is_favorite: l.id === listId })));
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
        <strong>Dev-läge</strong> – data sparas lokalt i localStorage, ingen
        inloggning krävs.
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mina listor</h1>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ny lista…"
          maxLength={100}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
        >
          Skapa
        </button>
      </form>

      <ul className="space-y-2">
        {lists.map((list) => (
          <li
            key={list.id}
            className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100"
          >
            <button
              onClick={() => handleFavorite(list.id, list.is_favorite)}
              title={
                list.is_favorite
                  ? "Ta bort favorit"
                  : "Markera som favorit – öppnas direkt vid inloggning"
              }
              className="text-xl leading-none flex-shrink-0 hover:scale-110 transition-transform"
              aria-label={
                list.is_favorite ? "Ta bort favorit" : "Markera som favorit"
              }
            >
              {list.is_favorite ? "⭐" : "☆"}
            </button>
            <a
              href={`/lista/${list.id}`}
              className="flex-1 text-gray-800 font-medium hover:text-blue-600 truncate"
            >
              {list.name}
            </a>
          </li>
        ))}
        {lists.length === 0 && (
          <li className="text-center text-gray-400 py-12 text-sm">
            Du har inga listor än. Skapa en ovan!
          </li>
        )}
      </ul>
    </div>
  );
}
