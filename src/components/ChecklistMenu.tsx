import type { Dispatch, ReactNode, SetStateAction } from "react";
import Link from "next/link";
import type { HideMode } from "./ChecklistListContent";

interface ChecklistMenuProps {
  menuOpen: boolean;
  hideMode: HideMode;
  setHideMode: Dispatch<SetStateAction<HideMode>>;
  isDark: boolean;
  toggleDark: () => void;
  onSignOut?: () => void | Promise<void>;
  children?: ReactNode;
}

export default function ChecklistMenu({
  menuOpen,
  hideMode,
  setHideMode,
  isDark,
  toggleDark,
  onSignOut,
  children,
}: ChecklistMenuProps) {
  if (!menuOpen) return null;

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:divide-zinc-700">
      <div className="px-4 py-3">
        <button
          onClick={() =>
            setHideMode((m) => {
              const next = m === "strike" ? "hide" : "strike";
              localStorage.setItem("listkompis_hideMode", next);
              return next;
            })
          }
          className="text-sm text-gray-700 hover:text-gray-900 dark:text-[#d0ccc4] dark:hover:text-[#f0ead6]"
        >
          {hideMode === "hide" ? "Visa avbockade" : "Dölj avbockade"}
        </button>
      </div>
      <div className="px-4 py-3">
        <button
          onClick={toggleDark}
          className="text-sm text-gray-700 hover:text-gray-900 dark:text-[#d0ccc4] dark:hover:text-[#f0ead6]"
        >
          {isDark ? "Ljust läge" : "Mörkt läge"}
        </button>
      </div>
      <div className="px-4 py-3">
        <Link
          href="/hjalp"
          className="text-sm text-gray-700 hover:text-gray-900 dark:text-[#d0ccc4] dark:hover:text-[#f0ead6]"
        >
          Hjälp
        </Link>
      </div>
      {onSignOut && (
        <div className="px-4 py-3">
          <button
            onClick={onSignOut}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Logga ut
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
