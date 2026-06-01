"use client";

import { useEffect, useState } from "react";

type DebugState = {
  enabled: boolean;
  browser: string;
  displayMode: "standalone" | "browser";
  swController: "yes" | "no";
  swRegistrations: number | "n/a";
  manifestDisplay: string;
  manifestStartUrl: string;
};

export default function PwaDebugBar() {
  const [state, setState] = useState<DebugState>({
    enabled: false,
    browser: "unknown",
    displayMode: "browser",
    swController: "no",
    swRegistrations: "n/a",
    manifestDisplay: "unknown",
    manifestStartUrl: "unknown",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const enabled = params.get("debugPwa") === "1";
    if (!enabled) return;

    const ua = navigator.userAgent;
    const browser = /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : "Other";
    const displayMode = window.matchMedia("(display-mode: standalone)").matches
      ? "standalone"
      : "browser";
    const swController = navigator.serviceWorker?.controller ? "yes" : "no";

    setState((prev) => ({
      ...prev,
      enabled,
      browser,
      displayMode,
      swController,
    }));

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setState((prev) => ({ ...prev, swRegistrations: regs.length }));
      });
    }

    fetch("/manifest.webmanifest", { cache: "no-store" })
      .then((res) => res.json())
      .then((manifest) => {
        setState((prev) => ({
          ...prev,
          manifestDisplay:
            typeof manifest?.display === "string"
              ? manifest.display
              : "missing",
          manifestStartUrl:
            typeof manifest?.start_url === "string"
              ? manifest.start_url
              : "missing",
        }));
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          manifestDisplay: "fetch-error",
          manifestStartUrl: "fetch-error",
        }));
      });
  }, []);

  if (!state.enabled) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 border-t border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200"
      role="status"
      aria-live="polite"
    >
      <p>
        PWA debug | browser: {state.browser} | mode: {state.displayMode} | SW
        controller: {state.swController} | SW regs: {state.swRegistrations} |
        manifest.display: {state.manifestDisplay} | manifest.start_url:{" "}
        {state.manifestStartUrl}
      </p>
    </div>
  );
}
