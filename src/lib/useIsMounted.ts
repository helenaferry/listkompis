import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False during server rendering and hydration, true once the browser has taken over.
// Use it before reading localStorage, so the server and first client render match.
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
