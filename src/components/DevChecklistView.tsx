"use client";

import { useEffect, useState } from "react";
import ChecklistItem, { type Item } from "./ChecklistItem";
import AddItemForm from "./AddItemForm";

const STORAGE_KEY = "listkompis_items";
type HideMode = "strike" | "hide";

function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Item[]) : [];
  } catch {
    return [];
  }
}

function saveItems(items: Item[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function DevChecklistView() {
  const [items, setItems] = useState<Item[]>([]);
  const [hideMode, setHideMode] = useState<HideMode>("strike");

  useEffect(() => {
    setItems(loadItems());
  }, []);

  // Cross-tab sync via native storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(loadItems());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const updateItems = (next: Item[]) => {
    setItems(next);
    saveItems(next);
  };

  const handleAdd = async (text: string) => {
    const item: Item = {
      id: crypto.randomUUID(),
      text,
      is_checked: false,
      created_at: new Date().toISOString(),
      created_by: null,
    };
    updateItems([...items, item]);
  };

  const handleToggle = async (id: string, checked: boolean) => {
    updateItems(
      items.map((i) => (i.id === id ? { ...i, is_checked: checked } : i)),
    );
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listkompis</h1>
          {checkedCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              {checkedCount} av {items.length} avbockat
            </p>
          )}
        </div>
      </div>

      <AddItemForm onAdd={handleAdd} />

      <div className="flex items-center gap-3 my-5">
        <span className="text-sm text-gray-600">Avbockade:</span>
        <button
          role="switch"
          aria-checked={hideMode === "strike"}
          onClick={() =>
            setHideMode((m) => (m === "strike" ? "hide" : "strike"))
          }
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            hideMode === "strike" ? "bg-blue-600" : "bg-gray-300"
          }`}
          aria-label="Växla visning av avbockade"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              hideMode === "strike" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-gray-600">
          {hideMode === "strike" ? "visas överstrukna" : "döljs"}
        </span>
      </div>

      <ul className="space-y-2">
        {visibleItems.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={handleToggle}
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
