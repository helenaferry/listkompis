"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDarkMode } from "@/lib/useDarkMode";
import type { Item } from "@/lib/types";
import type { ListMember, ListStore } from "@/lib/listStore";
import { sortItems } from "@/lib/sortItems";
import {
  applyPending,
  enqueue,
  pendingCount,
  flushOutbox,
  type OpBody,
} from "@/lib/outbox";
import ChecklistListContent, { type HideMode } from "./ChecklistListContent";
import ChecklistMenu from "./ChecklistMenu";

// Changes usually reach the server in well under this, so the notice is only shown when they are slow
const PENDING_NOTICE_DELAY_MS = 2000;

interface Props {
  store: ListStore;
  listId: string;
  listName: string;
  initialItems: Item[];
  userId: string;
  userEmail: string;
  createdBy: string | null;
}

export default function ChecklistScreen({
  store,
  listId,
  listName,
  initialItems,
  userId,
  userEmail,
  createdBy,
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [hideMode, setHideMode] = useState<HideMode>(() => {
    if (typeof window === "undefined") return "strike";
    const saved = localStorage.getItem(
      "listkompis_hideMode",
    ) as HideMode | null;
    return saved === "hide" || saved === "strike" ? saved : "strike";
  });
  const [prefLoaded, setPrefLoaded] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Kopiera");
  const [currentName, setCurrentName] = useState(listName);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [members, setMembers] = useState<ListMember[] | null>(null);
  const [membersError, setMembersError] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [pending, setPending] = useState(0);
  const [delayPassed, setDelayPassed] = useState(false);
  const showPending = pending > 0 && delayPassed;
  const { isDark, toggle: toggleDark } = useDarkMode();

  const showSaveError = () => {
    setSaveFailed(true);
  };

  // Fetches the list from the server again and keeps changes that are still waiting.
  // Without a connection, the waiting changes are shown on top of what is already there.
  const resync = useCallback(async () => {
    try {
      setItems(applyPending(await store.loadItems(listId), listId));
    } catch {
      setItems((prev) => applyPending(prev, listId));
    }
  }, [store, listId]);

  const flush = useCallback(async () => {
    await flushOutbox(store, () => {
      setSaveFailed(true);
      void resync();
    });
    setPending(pendingCount());
  }, [store, resync]);

  // Show the notice only if changes are still waiting after the delay
  useEffect(() => {
    if (pending === 0) return;
    const timer = window.setTimeout(
      () => setDelayPassed(true),
      PENDING_NOTICE_DELAY_MS,
    );
    return () => {
      window.clearTimeout(timer);
      setDelayPassed(false);
    };
  }, [pending]);

  const saveChange = (body: OpBody) => {
    enqueue(body);
    setPending(pendingCount());
    return flush();
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPrefLoaded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const [rtStatus, setRtStatus] = useState<string>("connecting");

  useEffect(() => {
    return store.subscribe(listId, {
      onStatus: (status) => {
        setRtStatus(status);
        // Realtime does not replay changes that were missed while the connection was down
        if (status === "SUBSCRIBED") void resync();
      },
      onChange: (change) => {
        if (change.type === "replace") {
          setItems(change.items);
        } else if (change.type === "delete") {
          setItems((prev) => prev.filter((item) => item.id !== change.id));
        } else {
          const { item } = change;
          setItems((prev) =>
            prev.some((i) => i.id === item.id)
              ? prev.map((i) => (i.id === item.id ? item : i))
              : [item, ...prev],
          );
        }
      },
    });
  }, [store, listId, resync]);

  useEffect(() => {
    const syncNow = () => {
      void resync();
      void flush();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") syncNow();
    };

    syncNow();
    window.addEventListener("online", syncNow);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 30_000);
    return () => {
      window.removeEventListener("online", syncNow);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [resync, flush]);

  const handleToggle = async (id: string, checked: boolean) => {
    setItems((prev) =>
      sortItems(
        prev.map((item) =>
          item.id === id ? { ...item, is_checked: checked } : item,
        ),
      ),
    );
    await saveChange({
      kind: "update",
      listId,
      itemId: id,
      patch: { is_checked: checked },
    });
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    setItems((prev) =>
      sortItems(
        prev.map((item) =>
          item.id === id ? { ...item, is_starred: starred } : item,
        ),
      ),
    );
    await saveChange({
      kind: "update",
      listId,
      itemId: id,
      patch: { is_starred: starred },
    });
  };

  const handleEdit = async (id: string, text: string) => {
    setItems((prev) =>
      sortItems(
        prev.map((item) => (item.id === id ? { ...item, text } : item)),
      ),
    );
    await saveChange({ kind: "update", listId, itemId: id, patch: { text } });
  };

  const handleAdd = async (text: string, isStarred = false) => {
    // The id is made here, so the server row and the local item are the same item
    const item: Item = {
      id: crypto.randomUUID(),
      list_id: listId,
      text,
      is_checked: false,
      is_starred: isStarred,
      position: 0,
      created_at: new Date().toISOString(),
      created_by: userId,
    };
    setItems((prev) => sortItems([item, ...prev]));
    await saveChange({ kind: "add", listId, item });
  };

  const handleReorder = async (orderedIds: string[]) => {
    const rank = new Map(orderedIds.map((id, index) => [id, index]));
    setItems((prev) =>
      sortItems(
        prev.map((item) =>
          rank.has(item.id) ? { ...item, position: rank.get(item.id) ?? 0 } : item,
        ),
      ),
    );
    await saveChange({ kind: "reorder", listId, orderedIds });
  };

  const handleInvite = async () => {
    if (inviteUrl) {
      setInviteUrl(null);
      return;
    }
    try {
      setInviteUrl(await store.getInviteUrl(listId));
    } catch {
      showSaveError();
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopyLabel("Kopierad!");
    setTimeout(() => setCopyLabel("Kopiera"), 2000);
  };

  const handleSignOut = async () => {
    await store.signOut();
    window.location.href = "/login";
  };

  const handleNameSave = async () => {
    const trimmed = editingName?.trim();
    if (!trimmed || trimmed === currentName) {
      setEditingName(null);
      return;
    }
    const previous = currentName;
    setCurrentName(trimmed);
    setEditingName(null);
    try {
      await store.renameList(listId, trimmed);
    } catch {
      setCurrentName(previous);
      showSaveError();
    }
  };

  const handleClearChecked = async () => {
    const removed = items.filter((i) => i.is_checked);
    setItems((prev) => prev.filter((i) => !i.is_checked));
    try {
      await store.clearChecked(listId);
    } catch {
      setItems((prev) => [...removed, ...prev]);
      showSaveError();
    }
  };

  const handleLeaveOrDelete = async () => {
    try {
      await store.leaveOrDelete(listId, userId === createdBy);
      window.location.href = "/listor";
    } catch {
      setLeaveConfirm(false);
      showSaveError();
    }
  };

  const handleMenuToggle = async () => {
    const next = !menuOpen;
    setMenuOpen(next);
    if (next && members === null) {
      try {
        setMembers(await store.getMembers(listId));
      } catch {
        setMembersError(true);
        setMembers([]);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/listor"
          className="text-xs font-semibold tracking-widest text-blue-600 uppercase py-2 pr-4 dark:text-blue-400"
          aria-label="Mina listor"
        >
          Listkompis
        </Link>
        <div className="flex items-center gap-3 text-sm flex-shrink-0">
          {(rtStatus.includes("ERROR") || rtStatus.includes("CLOSED")) && (
            <span
              title={`Realtidssynk: ${rtStatus}`}
              aria-label="Realtidsanslutning bruten"
              role="img"
              className="w-2 h-2 rounded-full flex-shrink-0 bg-red-400"
            />
          )}
          <span className="text-gray-400 text-xs truncate max-w-[160px] dark:text-zinc-500">
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
              className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none min-w-0 w-full dark:text-[#f0ead6]"
            />
          ) : (
            <h1
              className="text-2xl font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors dark:text-[#f0ead6] dark:hover:text-blue-400"
              onClick={() => setEditingName(currentName)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingName(currentName);
              }}
              tabIndex={0}
              role="button"
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
          className="flex-shrink-0 p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-700"
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

      {showPending && (
        <p
          role="status"
          className="mb-3 text-sm text-amber-700 dark:text-amber-300"
        >
          Ändringar väntar på uppkoppling – de sparas automatiskt.
        </p>
      )}

      <ChecklistMenu
        menuOpen={menuOpen}
        hideMode={hideMode}
        setHideMode={setHideMode}
        isDark={isDark}
        toggleDark={toggleDark}
        onSignOut={handleSignOut}
      >
        {items.some((i) => i.is_checked) && (
          <div className="px-4 py-3">
            {clearConfirm ? (
              <div className="flex items-center gap-3" role="alert">
                <span className="text-sm text-gray-600 dark:text-zinc-400">
                  Är du säker?
                </span>
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
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
            className="text-sm text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 dark:hover:text-blue-300"
          >
            {inviteUrl ? "Dölj inbjudningslänk" : "Bjud in"}
          </button>
          {inviteUrl && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 dark:bg-blue-950 dark:border-blue-800">
              <span className="flex-1 text-xs text-blue-700 truncate font-mono dark:text-blue-300">
                {inviteUrl}
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap flex-shrink-0 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {copyLabel}
              </button>
            </div>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 dark:text-zinc-500">
            Tillgång
          </p>
          {members === null ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">Laddar…</p>
          ) : membersError ? (
            <p className="text-sm text-red-400">
              Kunde inte hämta medlemmar. Kör{" "}
              <code className="font-mono">get_list_members</code> i Supabase
              SQL-editorn.
            </p>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              Inga medlemmar hittades.
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.member_id}
                  className="text-sm flex items-center gap-1.5"
                >
                  <span className="flex-1 text-gray-600 dark:text-zinc-400 truncate">
                    {m.member_email}
                  </span>
                  {m.member_id === createdBy && (
                    <span className="text-xs text-blue-500 dark:text-blue-400 flex-shrink-0">
                      ägare
                    </span>
                  )}
                  {m.member_id === userId && m.member_id !== createdBy && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 flex-shrink-0">
                      (du)
                    </span>
                  )}
                  {userId === createdBy &&
                    m.member_id !== createdBy &&
                    (removingMemberId === m.member_id ? (
                      <div
                        className="flex items-center gap-1.5 flex-shrink-0"
                        role="alert"
                      >
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          Ta bort?
                        </span>
                        <button
                          onClick={async () => {
                            const removed = members?.find(
                              (x) => x.member_id === m.member_id,
                            );
                            setMembers((prev) =>
                              prev
                                ? prev.filter(
                                    (x) => x.member_id !== m.member_id,
                                  )
                                : prev,
                            );
                            setRemovingMemberId(null);
                            try {
                              await store.removeMember(listId, m.member_id);
                            } catch {
                              if (removed) {
                                setMembers((prev) =>
                                  prev ? [...prev, removed] : [removed],
                                );
                              }
                              showSaveError();
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setRemovingMemberId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                        >
                          Nej
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRemovingMemberId(m.member_id)}
                        aria-label={`Ta bort ${m.member_email}`}
                        className="flex-shrink-0 text-gray-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-4 py-3">
          {leaveConfirm ? (
            <div className="flex items-center gap-3" role="alert">
              <span className="text-sm text-gray-600 dark:text-zinc-400">
                Är du säker?
              </span>
              <button
                onClick={() => {
                  setLeaveConfirm(false);
                  handleLeaveOrDelete();
                }}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Ja
              </button>
              <button
                onClick={() => setLeaveConfirm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Nej
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLeaveConfirm(true)}
              className="text-sm text-red-400 hover:text-red-600"
            >
              {userId === createdBy ? "Ta bort lista" : "Lämna lista"}
            </button>
          )}
        </div>
      </ChecklistMenu>

      {/* Save error banner */}
      {saveFailed && (
        <div
          role="alert"
          className="mb-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-3"
        >
          <span>Sparandet misslyckades – kontrollera uppkopplingen.</span>
          <button
            onClick={() => setSaveFailed(false)}
            aria-label="Stäng felmeddelande"
            className="flex-shrink-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      <ChecklistListContent
        items={items}
        hideMode={hideMode}
        onAdd={handleAdd}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onToggleStar={handleToggleStar}
        onReorder={handleReorder}
        emptyMessage="Inga saker i listan ännu."
        prefLoaded={prefLoaded}
      />
    </div>
  );
}
