import type { Item } from "@/lib/types";

// Starred items first, then by manual position, then newest first
export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    if (Boolean(a.is_starred) !== Boolean(b.is_starred)) {
      return Number(Boolean(b.is_starred)) - Number(Boolean(a.is_starred));
    }
    if (a.position !== b.position) return a.position - b.position;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
