"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setFavorite, removeFavorite, getOrCreateInvite } from "@/app/actions";
import ChecklistItem from "./ChecklistItem";
import AddItemForm from "./AddItemForm";
import type { Item } from "@/lib/types";

type HideMode = "strike" | "hide";

interface Props {
  listId: string;
  listName: string;
  initialItems: Item[];
  userId: string;
  userEmail: string;
  isFavorite: boolean;
}

export default function ChecklistView({
  listId,
  listName,
  initialItems,
  userId,
  userEmail,
  isFavorite: initialIsFavorite,
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [hideMode, setHideMode] = useState<HideMode>("strike");
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Kopiera");

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`items-${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `list_id=eq.${listId}`,
        },
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
  }, [listId]);

  const handleToggle = async (id: string, checked: boolean) => {
    const supabase = createClient();
    await supabase.from("items").update({ is_checked: checked }).eq("id", id);
  };

  const handleAdd = async (text: string) => {
    const supabase = createClient();
    await supabase
      .from("items")
      .insert({ text, list_id: listId, created_by: userId, is_checked: false });
  };

  const handleFavoriteToggle = async () => {
    if (isFavorite) {
      await removeFavorite(listId);
      setIsFavorite(false);
    } else {
      await setFavorite(listId);
      setIsFavorite(true);
    }
  };

  const handleInvite = async () => {
    if (inviteUrl) {
      setInviteUrl(null);
      return;
    }
    const token = await getOrCreateInvite(listId);
    setInviteUrl(`${window.location.origin}/bjud-in/${token}`);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopyLabel("Kopierad!");
    setTimeout(() => setCopyLabel("Kopiera"), 2000);
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
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/listor"
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg"
            aria-label="Mina listor"
          >
            ←
          </a>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {listName}
              </h1>
              <button
                onClick={handleFavoriteToggle}
                title={
                  isFavorite
                    ? "Ta bort favorit"
                    : "Markera som favorit – öppnas direkt vid inloggning"
                }
                className="text-xl leading-none flex-shrink-0 hover:scale-110 transition-transform"
                aria-label={
                  isFavorite ? "Ta bort favorit" : "Markera som favorit"
                }
              >
                {isFavorite ? "⭐" : "☆"}
              </button>
            </div>
            {checkedCount > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">
                {checkedCount} av {items.length} avbockat
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm flex-shrink-0">
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

      {/* Controls */}
      <div className="flex items-center justify-between my-5">
        <div className="flex items-center gap-3">
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
        <button
          onClick={handleInvite}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {inviteUrl ? "Dölj länk" : "Bjud in"}
        </button>
      </div>

      {/* Invite URL */}
      {inviteUrl && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
          <span className="flex-1 text-xs text-blue-700 truncate font-mono">
            {inviteUrl}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap flex-shrink-0"
          >
            {copyLabel}
          </button>
        </div>
      )}

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
