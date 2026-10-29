"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type DebugState = {
  browser: string;
  displayMode: "standalone" | "browser";
  swController: "yes" | "no";
  swRegistrations: number | "n/a";
  manifestDisplay: string;
  manifestStartUrl: string;
};

const subscribe = () => () => {};

// The bar is only shown with ?debugPwa=1. Nothing is rendered on the server or during hydration.
export default function PwaDebugBar() {
  const enabled = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get("debugPwa") === "1",
    () => false,
  );

  if (!enabled) return null;
  return <PwaDebugDetails />;
}

function readBrowserInfo(): DebugState {
  const ua = navigator.userAgent;
  return {
    browser: /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : "Other",
    displayMode: window.matchMedia("(display-mode: standalone)").matches
      ? "standalone"
      : "browser",
    swController: navigator.serviceWorker?.controller ? "yes" : "no",
    swRegistrations: "n/a",
    manifestDisplay: "unknown",
    manifestStartUrl: "unknown",
  };
}

function PwaDebugDetails() {
  const [state, setState] = useState<DebugState>(() => readBrowserInfo());

  useEffect(() => {
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
