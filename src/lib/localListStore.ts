import type { Item } from "@/lib/types";
import type { ItemChange, ListStore } from "./listStore";

const ITEMS_KEY = "listkompis_items";
const LISTS_KEY = "listkompis_lists";

export const DEV_USER = { id: "dev-user", email: "dev@lokal" };

type StoredList = { id: string; name: string };

function readItems(): Item[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    const items = raw ? (JSON.parse(raw) as Item[]) : [];
    // Items saved before manual sorting existed have no position
    return items.map((i) => ({ ...i, position: i.position ?? 0 }));
  } catch {
    return [];
  }
}

function writeItems(items: Item[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

function readLists(): StoredList[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    return raw ? (JSON.parse(raw) as StoredList[]) : [];
  } catch {
    return [];
  }
}

function writeLists(lists: StoredList[]) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

// Read and write the whole store each time so that other tabs are never overwritten
function updateListItems(listId: string, mutate: (items: Item[]) => Item[]) {
  const all = readItems();
  const rest = all.filter((i) => i.list_id !== listId);
  const mine = all.filter((i) => i.list_id === listId);
  writeItems([...rest, ...mutate(mine)]);
}

export function loadLocalItems(listId: string): Item[] {
  return readItems().filter((i) => i.list_id === listId);
}

export function loadLocalListName(listId: string): string {
  return readLists().find((l) => l.id === listId)?.name ?? "Lista";
}

export const localListStore: ListStore = {
  async addItem(listId, item) {
    updateListItems(listId, (items) =>
      items.some((i) => i.id === item.id) ? items : [item, ...items],
    );
  },

  async loadItems(listId) {
    return loadLocalItems(listId);
  },

  async updateItem(id, patch) {
    const all = readItems();
    writeItems(all.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  },

  async clearChecked(listId) {
    updateListItems(listId, (items) => items.filter((i) => !i.is_checked));
  },

  async reorderItems(listId, orderedIds) {
    const rank = new Map(orderedIds.map((id, index) => [id, index]));
    updateListItems(listId, (items) =>
      items.map((i) =>
        rank.has(i.id) ? { ...i, position: rank.get(i.id) ?? 0 } : i,
      ),
    );
  },

  async renameList(listId, name) {
    writeLists(readLists().map((l) => (l.id === listId ? { ...l, name } : l)));
  },

  async getInviteUrl(listId) {
    return `${window.location.origin}/bjud-in/dev-${listId}`;
  },

  async getMembers() {
    return [
      {
        member_id: DEV_USER.id,
        member_email: DEV_USER.email,
        member_joined_at: new Date().toISOString(),
      },
    ];
  },

  async removeMember() {},

  async leaveOrDelete(listId) {
    writeLists(readLists().filter((l) => l.id !== listId));
    writeItems(readItems().filter((i) => i.list_id !== listId));
  },

  async signOut() {},

  subscribe(listId, { onChange }) {
    // Cross-tab sync: another tab wrote to localStorage
    const handler = (e: StorageEvent) => {
      if (e.key !== ITEMS_KEY) return;
      const change: ItemChange = {
        type: "replace",
        items: loadLocalItems(listId),
      };
      onChange(change);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
