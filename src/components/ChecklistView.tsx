"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getOrCreateInvite,
  renameList,
  getListMembers,
  deleteCheckedItems,
} from "@/app/actions";
import ChecklistItem from "./ChecklistItem";
import NewItemRow from "./NewItemRow";
import type { Item } from "@/lib/types";

type HideMode = "strike" | "hide";

type ListMember = {
  member_id: string;
  member_email: string;
  member_joined_at: string;
};

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
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [hideMode, setHideMode] = useState<HideMode>("strike");
  const [prefLoaded, setPrefLoaded] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Kopiera");
  const [currentName, setCurrentName] = useState(listName);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [members, setMembers] = useState<ListMember[] | null>(null);
  const [membersError, setMembersError] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(
      "listkompis_hideMode",
    ) as HideMode | null;
    if (saved) setHideMode(saved);
    setPrefLoaded(true);
  }, []);
  const [rtStatus, setRtStatus] = useState<string>("connecting");

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      // Ensure the authenticated JWT is set on the Realtime client before
      // subscribing, so RLS policies can resolve auth.uid() correctly.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`items-${listId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "items",
          },
          (payload) => {
            // Filter client-side – more reliable than server-side filter
            const row = (payload.new ?? payload.old) as Item | undefined;
            if (row && row.list_id !== listId) return;

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
        .subscribe((status, err) => {
          setRtStatus(status);
          if (err) console.error("[Realtime] channel error:", err);
        });
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
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

  const handleNameSave = async () => {
    const trimmed = editingName?.trim();
    if (!trimmed || trimmed === currentName) {
      setEditingName(null);
      return;
    }
    setCurrentName(trimmed);
    setEditingName(null);
    await renameList(listId, trimmed);
  };

  const handleClearChecked = async () => {
    setItems((prev) => prev.filter((i) => !i.is_checked));
    await deleteCheckedItems(listId);
  };

  const handleMenuToggle = async () => {
    const next = !menuOpen;
    setMenuOpen(next);
    if (next && members === null) {
      try {
        const data = await getListMembers(listId);
        setMembers(data);
      } catch {
        setMembersError(true);
        setMembers([]);
      }
    }
  };

  const visibleItems =
    hideMode === "hide" ? items.filter((i) => !i.is_checked) : items;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <a
          href="/listor"
          className="text-xs font-semibold tracking-widest text-blue-600 uppercase py-2 pr-4"
          aria-label="Mina listor"
        >
          Listkompis
        </a>
        <div className="flex items-center gap-3 text-sm flex-shrink-0">
          <span
            title={`Realtid: ${rtStatus}`}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${rtStatus === "SUBSCRIBED" ? "bg-green-400" : rtStatus.includes("ERROR") || rtStatus.includes("CLOSED") ? "bg-red-400" : "bg-yellow-400"}`}
          />
          <span className="text-gray-400 text-xs truncate max-w-[160px]">
            {userEmail}
          </span>
        </div>
      </div>
      {/* Title row */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {editingName !== null ? (
            <input
              autoFocus
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setEditingName(null);
                }
              }}
              maxLength={100}
              className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none min-w-0 w-full"
            />
          ) : (
            <h1
              className="text-2xl font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setEditingName(currentName)}
              title="Klicka för att byta namn"
            >
              {currentName}
            </h1>
          )}
        </div>
        <button
          onClick={handleMenuToggle}
          aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
          aria-expanded={menuOpen}
          className="flex-shrink-0 p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
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

      {/* Expandable menu */}
      {menuOpen && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200">
          <div className="px-4 py-3">
            <button
              onClick={handleSignOut}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Logga ut
            </button>
          </div>
          <div className="px-4 py-3">
            <button
              onClick={() =>
                setHideMode((m) => {
                  const next = m === "strike" ? "hide" : "strike";
                  localStorage.setItem("listkompis_hideMode", next);
                  return next;
                })
              }
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              {hideMode === "hide" ? "Visa avbockade" : "Dölj avbockade"}
            </button>
          </div>
          {items.some((i) => i.is_checked) && (
            <div className="px-4 py-3">
              {clearConfirm ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Är du säker?</span>
                  <button
                    onClick={() => {
                      setClearConfirm(false);
                      handleClearChecked();
                    }}
                    className="text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Ja, rensa
                  </button>
                  <button
                    onClick={() => setClearConfirm(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Avbryt
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setClearConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Rensa avbockade
                </button>
              )}
            </div>
          )}
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={handleInvite}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {inviteUrl ? "Dölj inbjudningslänk" : "Bjud in"}
            </button>
            {inviteUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
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
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Tillgång
            </p>
            {members === null ? (
              <p className="text-sm text-gray-400">Laddar…</p>
            ) : membersError ? (
              <p className="text-sm text-red-400">
                Kunde inte hämta medlemmar. Kör{" "}
                <code className="font-mono">get_list_members</code> i Supabase
                SQL-editorn.
              </p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400">Inga medlemmar hittades.</p>
            ) : (
              <ul className="space-y-1">
                {members.map((m) => (
                  <li
                    key={m.member_id}
                    className="text-sm text-gray-600 flex items-center gap-1.5"
                  >
                    <span>{m.member_email}</span>
                    {m.member_id === userId && (
                      <span className="text-xs text-gray-400">(du)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <ul
        className={`space-y-2 transition-opacity duration-100 ${prefLoaded ? "opacity-100" : "opacity-0"}`}
      >
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
