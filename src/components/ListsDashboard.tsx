"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createList, setFavorite, removeFavorite } from "@/app/actions";
import type { ListEntry } from "@/lib/types";

interface Props {
  initialLists: ListEntry[];
  userEmail: string;
}

export default function ListsDashboard({ initialLists, userEmail }: Props) {
  const [lists, setLists] = useState<ListEntry[]>(initialLists);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const id = await createList(name);
    setNewName("");
    setCreating(false);
    router.push(`/lista/${id}`);
  };

  const handleFavorite = async (listId: string, currentlyFavorite: boolean) => {
    if (currentlyFavorite) {
      await removeFavorite(listId);
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, is_favorite: false } : l)),
      );
    } else {
      await setFavorite(listId);
      setLists((prev) =>
        prev.map((l) => ({ ...l, is_favorite: l.id === listId })),
      );
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mina listor</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400 text-xs truncate max-w-[160px]">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            Logga ut
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ny lista…"
          maxLength={100}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
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
