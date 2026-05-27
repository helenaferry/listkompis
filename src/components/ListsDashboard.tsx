"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createList,
  setFavorite,
  removeFavorite,
  renameList,
  deleteList,
  leaveList,
} from "@/app/actions";
import type { ListEntry } from "@/lib/types";

interface Props {
  initialLists: ListEntry[];
  userEmail: string;
  userId: string;
}

export default function ListsDashboard({
  initialLists,
  userEmail,
  userId,
}: Props) {
  const [lists, setLists] = useState<ListEntry[]>(initialLists);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [listMenuId, setListMenuId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const id = await createList(name);
    setNewName("");
    setCreating(false);
    const newEntry: ListEntry = {
      id,
      name,
      created_at: new Date().toISOString(),
      is_favorite: false,
      created_by: userId,
    };
    setLists((prev) => [newEntry, ...prev]);
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

  const handleRenameSave = async () => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    const original = lists.find((l) => l.id === editingId)?.name ?? "";
    setEditingId(null);
    if (!trimmed || trimmed === original) return;
    setLists((prev) =>
      prev.map((l) => (l.id === editingId ? { ...l, name: trimmed } : l)),
    );
    await renameList(editingId, trimmed);
  };

  const handleDelete = async (listId: string) => {
    setListMenuId(null);
    setConfirmingId(null);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    await deleteList(listId);
  };

  const handleLeave = async (listId: string) => {
    setListMenuId(null);
    setConfirmingId(null);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    await leaveList(listId);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
          Listkompis
        </p>
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <span className="text-gray-400 text-xs truncate max-w-[160px]">
            {userEmail}
          </span>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
            aria-expanded={menuOpen}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable menu */}
      {menuOpen && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200">
          <div className="px-4 py-3">
            <a
              href="/hjalp"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Hjälp
            </a>
          </div>
          <div className="px-4 py-3">
            <button
              onClick={handleSignOut}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Logga ut
            </button>
          </div>
        </div>
      )}
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
            className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleFavorite(list.id, list.is_favorite)}
                title={
                  list.is_favorite
                    ? "Ta bort nål"
                    : "Nåla fast – öppnas direkt vid inloggning"
                }
                className={`flex-shrink-0 hover:scale-110 transition-transform ${
                  list.is_favorite
                    ? "text-blue-600"
                    : "text-gray-300 hover:text-gray-500"
                }`}
                aria-label={list.is_favorite ? "Ta bort nål" : "Nåla fast"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={list.is_favorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
                </svg>
              </button>
              {editingId === list.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleRenameSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  maxLength={100}
                  className="flex-1 bg-transparent border-b-2 border-blue-500 outline-none text-gray-800 font-medium min-w-0"
                />
              ) : (
                <a
                  href={`/lista/${list.id}`}
                  className="flex-1 text-gray-800 font-medium hover:text-blue-600 truncate"
                >
                  {list.name}
                </a>
              )}
              <button
                onClick={() => {
                  if (listMenuId === list.id) {
                    setListMenuId(null);
                    setConfirmingId(null);
                  } else {
                    setListMenuId(list.id);
                    setConfirmingId(null);
                  }
                }}
                aria-label={`Alternativ för ${list.name}`}
                aria-expanded={listMenuId === list.id}
                className="flex-shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>
            {listMenuId === list.id && editingId !== list.id && (
              <div className="mt-2 flex items-center gap-4 pl-9" role="group" aria-label={`Alternativ för ${list.name}`}>
                <button
                  onClick={() => {
                    setEditingId(list.id);
                    setEditingName(list.name);
                    setListMenuId(null);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Byt namn
                </button>
                {confirmingId === list.id ? (
                  <div className="flex items-center gap-2" role="alert">
                    <span className="text-sm text-gray-500">Är du säker?</span>
                    <button
                      onClick={() =>
                        list.created_by === userId
                          ? handleDelete(list.id)
                          : handleLeave(list.id)
                      }
                      className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Nej
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(list.id)}
                    className="text-sm text-red-400 hover:text-red-600"
                  >
                    {list.created_by === userId
                      ? "Ta bort lista"
                      : "Lämna lista"}
                  </button>
                )}
              </div>
            )}
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
