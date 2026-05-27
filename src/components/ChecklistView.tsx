"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setFavorite, removeFavorite, getOrCreateInvite } from "@/app/actions";
import ChecklistItem from "./ChecklistItem";
import NewItemRow from "./NewItemRow";
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
  const [hideMode, setHideMode] = useState<HideMode>(() => {
    if (typeof window === "undefined") return "strike";
    return (
      (localStorage.getItem("listkompis_hideMode") as HideMode) ?? "strike"
    );
  });
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
            setItems((prev) =>
              prev.some((i) => i.id === (payload.new as Item).id)
                ? prev
                : [payload.new as Item, ...prev],
            );
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
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_checked: checked } : item,
      ),
    );
    const supabase = createClient();
    await supabase.from("items").update({ is_checked: checked }).eq("id", id);
  };

  const handleEdit = async (id: string, text: string) => {
    const supabase = createClient();
    await supabase.from("items").update({ text }).eq("id", id);
  };

  const handleAdd = async (text: string) => {
    const tempId = crypto.randomUUID();
    const optimistic: Item = {
      id: tempId,
      list_id: listId,
      text,
      is_checked: false,
      created_at: new Date().toISOString(),
      created_by: userId,
    };
    setItems((prev) => [optimistic, ...prev]);

    const supabase = createClient();
    const { data: newItem, error } = await supabase
      .from("items")
      .insert({ text, list_id: listId, created_by: userId, is_checked: false })
      .select()
      .single();

    if (error) {
      setItems((prev) => prev.filter((i) => i.id !== tempId));
    } else if (newItem) {
      setItems((prev) =>
        prev.map((i) => (i.id === tempId ? (newItem as Item) : i)),
      );
    }
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
        Listkompis
      </p>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/listor"
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg"
            aria-label="Mina listor"
          >
            ←
          </a>
          <div className="flex items-center gap-2 min-w-0">
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
        </div>
        <div className="flex items-center gap-3 text-sm flex-shrink-0">
          <span className="text-gray-400 text-xs truncate max-w-[160px]">
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            Logga ut
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() =>
            setHideMode((m) => {
              const next = m === "strike" ? "hide" : "strike";
              localStorage.setItem("listkompis_hideMode", next);
              return next;
            })
          }
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {hideMode === "hide" ? "Visa avbockade" : "Dölj avbockade"}
        </button>
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
          <li className="text-center text-gray-400 py-8 text-sm">
            Inga saker i listan ännu.
          </li>
        )}
      </ul>
    </div>
  );
}
