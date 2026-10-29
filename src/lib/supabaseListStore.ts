import { createClient } from "@/lib/supabase/client";
import {
  getOrCreateInvite,
  renameList,
  getListMembers,
  deleteCheckedItems,
  setItemOrder,
  removeListMember,
  deleteList,
  leaveList,
} from "@/app/actions";
import type { Item } from "@/lib/types";
import type { ItemChange, ItemChangeHandlers, ListStore } from "./listStore";

export const supabaseListStore: ListStore = {
  async addItem(listId, item) {
    const { error } = await createClient().from("items").insert({
      id: item.id,
      list_id: listId,
      text: item.text,
      is_checked: item.is_checked,
      is_starred: item.is_starred,
      created_by: item.created_by,
    });
    // 23505 = duplicate key: an earlier attempt already saved this item
    if (error && error.code !== "23505") throw new Error(error.message);
  },

  async loadItems(listId) {
    const { data, error } = await createClient()
      .from("items")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Item[];
  },

  async updateItem(id, patch) {
    const { error } = await createClient()
      .from("items")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  clearChecked: (listId) => deleteCheckedItems(listId),

  reorderItems: (listId, orderedIds) => setItemOrder(listId, orderedIds),

  renameList: (listId, name) => renameList(listId, name),

  async getInviteUrl(listId) {
    const token = await getOrCreateInvite(listId);
    return `${window.location.origin}/bjud-in/${token}`;
  },

  getMembers: (listId) => getListMembers(listId),

  removeMember: (listId, memberId) => removeListMember(listId, memberId),

  leaveOrDelete: (listId, isOwner) =>
    isOwner ? deleteList(listId) : leaveList(listId),

  async signOut() {
    await createClient().auth.signOut();
  },

  subscribe(listId, { onChange, onStatus }: ItemChangeHandlers) {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Set when the component unmounts, so a late setup does not subscribe after cleanup
    let cancelled = false;

    const setup = async () => {
      // Ensure the authenticated JWT is set on the Realtime client before
      // subscribing, so RLS policies can resolve auth.uid() correctly.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

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

            const change: ItemChange =
              payload.eventType === "DELETE"
                ? { type: "delete", id: (payload.old as Item).id }
                : { type: "upsert", item: payload.new as Item };
            onChange(change);
          },
        )
        .subscribe((status, err) => {
          onStatus?.(status);
          if (err) console.error("[Realtime] channel error:", err);
        });
    };

    setup();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  },
};
