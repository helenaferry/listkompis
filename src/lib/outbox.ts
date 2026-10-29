import type { Item } from "@/lib/types";
import type { ListStore } from "./listStore";

// Changes are saved here first and sent when the connection works, so a
// dropped connection (for example inside a shop) does not lose them.
const OUTBOX_KEY = "listkompis_outbox";
// Server rejections (not network errors) are dropped after this many tries
const MAX_ATTEMPTS = 5;

export type OpBody =
  | { kind: "add"; listId: string; item: Item }
  | {
      kind: "update";
      listId: string;
      itemId: string;
      patch: Partial<Pick<Item, "text" | "is_checked" | "is_starred">>;
    }
  | { kind: "reorder"; listId: string; orderedIds: string[] };

export type PendingOp = { id: string; attempts: number; body: OpBody };

function read(): PendingOp[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as PendingOp[]) : [];
  } catch {
    return [];
  }
}

function write(ops: PendingOp[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(ops));
}

function applyBody(items: Item[], body: OpBody): Item[] {
  switch (body.kind) {
    case "add":
      return items.some((i) => i.id === body.item.id)
        ? items
        : [body.item, ...items];
    case "update":
      return items.map((i) =>
        i.id === body.itemId ? { ...i, ...body.patch } : i,
      );
    case "reorder": {
      const rank = new Map(body.orderedIds.map((id, index) => [id, index]));
      return items.map((i) =>
        rank.has(i.id) ? { ...i, position: rank.get(i.id) ?? 0 } : i,
      );
    }
  }
}

// Puts the changes that are still waiting on top of a list fetched from the server
export function applyPending(items: Item[], listId: string): Item[] {
  return read().reduce(
    (result, op) =>
      op.body.listId === listId ? applyBody(result, op.body) : result,
    items,
  );
}

export function enqueue(body: OpBody) {
  const ops = read();
  ops.push({ id: crypto.randomUUID(), attempts: 0, body });
  write(ops);
}

// Read when needed, not when a flush started: a flush can finish after newer changes were queued
export function pendingCount(): number {
  return read().length;
}

function send(store: ListStore, body: OpBody): Promise<void> {
  switch (body.kind) {
    case "add":
      return store.addItem(body.listId, body.item);
    case "update":
      return store.updateItem(body.itemId, body.patch);
    case "reorder":
      return store.reorderItems(body.listId, body.orderedIds);
  }
}

// Anything that is not a server answer is treated as "no connection, try later"
function isNetworkError(error: unknown): boolean {
  return (
    !(error instanceof Error) ||
    /fetch|network|load failed/i.test(error.message)
  );
}

let flushing = false;

// Sends queued changes in order. Stops at the first network error and retries later.
export async function flushOutbox(
  store: ListStore,
  onDropped: () => void,
): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    for (;;) {
      const op = read()[0];
      if (!op) break;
      try {
        await send(store, op.body);
        write(read().filter((o) => o.id !== op.id));
      } catch (error) {
        if (isNetworkError(error)) break;
        const attempts = op.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          write(read().filter((o) => o.id !== op.id));
          onDropped();
        } else {
          write(
            read().map((o) => (o.id === op.id ? { ...o, attempts } : o)),
          );
          break;
        }
      }
    }
  } finally {
    flushing = false;
  }
}
