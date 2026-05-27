"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDarkMode } from "@/lib/useDarkMode";

interface Props {
  userEmail?: string;
}

export default function HjalpHeader({ userEmail }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <a
          href="/listor"
          className="text-xs font-semibold tracking-widest text-blue-600 uppercase py-2 pr-4 dark:text-blue-400"
        >
          Listkompis
        </a>
        {userEmail && (
          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <span className="text-gray-400 text-xs truncate max-w-[160px] dark:text-zinc-500">
              {userEmail}
            </span>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
              aria-expanded={menuOpen}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-700"
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
        )}
      </div>

      {menuOpen && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:divide-zinc-700">
          <div className="px-4 py-3">
            <button
              onClick={toggleDark}
              className="text-sm text-gray-700 hover:text-gray-900 dark:text-[#d0ccc4] dark:hover:text-[#f0ead6]"
            >
              {isDark ? "Ljust läge" : "Mörkt läge"}
            </button>
          </div>
          <div className="px-4 py-3">
            <button
              onClick={handleSignOut}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Logga ut
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
