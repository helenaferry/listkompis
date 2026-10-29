import type { Item } from "@/lib/types";

export type ListMember = {
  member_id: string;
  member_email: string;
  member_joined_at: string;
};

export type ItemChange =
  | { type: "upsert"; item: Item }
  | { type: "delete"; id: string }
  | { type: "replace"; items: Item[] };

export interface ItemChangeHandlers {
  onChange: (change: ItemChange) => void;
  onStatus?: (status: string) => void;
}

// Everything the checklist screen needs from its backend. Supabase in
// production, localStorage in dev mode. The UI never talks to either directly.
export interface ListStore {
  // The id is made on the client, so a retry after a dropped connection cannot add a duplicate
  addItem: (listId: string, item: Item) => Promise<void>;
  loadItems: (listId: string) => Promise<Item[]>;
  updateItem: (
    id: string,
    patch: Partial<Pick<Item, "text" | "is_checked" | "is_starred">>,
  ) => Promise<void>;
  clearChecked: (listId: string) => Promise<void>;
  reorderItems: (listId: string, orderedIds: string[]) => Promise<void>;
  renameList: (listId: string, name: string) => Promise<void>;
  getInviteUrl: (listId: string) => Promise<string>;
  getMembers: (listId: string) => Promise<ListMember[]>;
  removeMember: (listId: string, memberId: string) => Promise<void>;
  leaveOrDelete: (listId: string, isOwner: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  subscribe: (listId: string, handlers: ItemChangeHandlers) => () => void;
}
