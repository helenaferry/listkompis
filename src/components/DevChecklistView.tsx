"use client";

import { useEffect, useState } from "react";
import {
  DEV_USER,
  loadLocalItems,
  loadLocalListName,
  localListStore,
} from "@/lib/localListStore";
import type { Item } from "@/lib/types";
import ChecklistScreen from "./ChecklistScreen";

interface Props {
  listId: string;
}

// Same screen as production, with data kept in localStorage instead of Supabase
export default function DevChecklistView({ listId }: Props) {
  const [ready, setReady] = useState(false);
  const [listName, setListName] = useState("Lista");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    setItems(loadLocalItems(listId));
    setListName(loadLocalListName(listId));
    setReady(true);
  }, [listId]);

  if (!ready) {
    return (
      <div
        className="max-w-lg mx-auto px-4 pt-4 pb-8 animate-pulse"
        aria-busy="true"
      >
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-zinc-700" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
          <strong>Dev-läge</strong> – data sparas lokalt i localStorage, ingen
          inloggning krävs.
        </div>
      </div>
      <ChecklistScreen
        store={localListStore}
        listId={listId}
        listName={listName}
        initialItems={items}
        userId={DEV_USER.id}
        userEmail={DEV_USER.email}
        createdBy={DEV_USER.id}
      />
    </>
  );
}
