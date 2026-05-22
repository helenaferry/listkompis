"use client";

import { useEffect, useState } from "react";
import ChecklistItem from "./ChecklistItem";
import NewItemRow from "./NewItemRow";
import type { Item } from "@/lib/types";

const ITEMS_KEY = "listkompis_items";
const LISTS_KEY = "listkompis_lists";
type HideMode = "strike" | "hide";

function loadAllItems(): Item[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    return raw ? (JSON.parse(raw) as Item[]) : [];
  } catch {
    return [];
  }
}

function saveAllItems(items: Item[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

function getListName(listId: string): string {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    const lists = raw ? JSON.parse(raw) : [];
    return (
      lists.find((l: { id: string; name: string }) => l.id === listId)?.name ??
      "Lista"
    );
  } catch {
    return "Lista";
  }
}

interface Props {
  listId: string;
}

export default function DevChecklistView({ listId }: Props) {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [listName, setListName] = useState("Lista");
  const [hideMode, setHideMode] = useState<HideMode>("strike");

  useEffect(() => {
    setAllItems(loadAllItems());
    setListName(getListName(listId));
  }, [listId]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === ITEMS_KEY) setAllItems(loadAllItems());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const items = allItems.filter((i) => i.list_id === listId);

  const updateItems = (nextForList: Item[]) => {
    const rest = allItems.filter((i) => i.list_id !== listId);
    const next = [...rest, ...nextForList];
    setAllItems(next);
    saveAllItems(next);
  };

  const handleAdd = async (text: string) => {
    const item: Item = {
      id: crypto.randomUUID(),
      list_id: listId,
      text,
      is_checked: false,
      created_at: new Date().toISOString(),
      created_by: null,
    };
    updateItems([item, ...items]);
  };

  const handleToggle = async (id: string, checked: boolean) => {
    updateItems(
      items.map((i) => (i.id === id ? { ...i, is_checked: checked } : i)),
    );
  };

  const handleEdit = async (id: string, text: string) => {
    updateItems(items.map((i) => (i.id === id ? { ...i, text } : i)));
  };

  const visibleItems =
    hideMode === "hide" ? items.filter((i) => !i.is_checked) : items;
  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
        <strong>Dev-läge</strong> – data sparas lokalt i localStorage, ingen
        inloggning krävs.
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/listor"
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg"
            aria-label="Mina listor"
          >
            ←
          </a>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {listName}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between my-4">
        <button
          onClick={() =>
            setHideMode((m) => (m === "strike" ? "hide" : "strike"))
          }
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {hideMode === "hide" ? "Visa avbockade" : "Dölj avbockade"}
        </button>
      </div>

      <ul className="space-y-2">
        <NewItemRow onAdd={handleAdd} />
        {visibleItems.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={handleToggle}
            onEdit={handleEdit}
            hideMode={hideMode}
          />
        ))}
        {visibleItems.length === 0 && (
          <li className="text-center text-gray-400 py-12 text-sm">
            {items.length === 0
              ? "Listan är tom – lägg till något ovan!"
              : "Alla saker är avbockade!"}
          </li>
        )}
      </ul>
    </div>
  );
}
