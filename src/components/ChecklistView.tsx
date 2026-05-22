"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChecklistItem, { type Item } from "./ChecklistItem";
import AddItemForm from "./AddItemForm";

type HideMode = "strike" | "hide";

interface Props {
  initialItems: Item[];
  userId: string;
  userEmail: string;
}

export default function ChecklistView({
  initialItems,
  userId,
  userEmail,
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [hideMode, setHideMode] = useState<HideMode>("strike");

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("items-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [...prev, payload.new as Item]);
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as Item) : item,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) =>
              prev.filter((item) => item.id !== (payload.old as Item).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggle = async (id: string, checked: boolean) => {
    const supabase = createClient();
    await supabase.from("items").update({ is_checked: checked }).eq("id", id);
  };

  const handleAdd = async (text: string) => {
    const supabase = createClient();
    await supabase
      .from("items")
      .insert({ text, created_by: userId, is_checked: false });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const visibleItems =
    hideMode === "hide" ? items.filter((i) => !i.is_checked) : items;
  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listkompis</h1>
          {checkedCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              {checkedCount} av {items.length} avbockat
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400 hidden sm:block">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            Logga ut
          </button>
        </div>
      </div>

      {/* Add item */}
      <AddItemForm onAdd={handleAdd} />

      {/* Hide/strike toggle */}
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

      {/* List */}
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
