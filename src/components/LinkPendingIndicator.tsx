"use client";

import { useLinkStatus } from "next/link";

// Shows a small spinner inside a Link while the page behind it is loading
export default function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span
      aria-hidden="true"
      className="ml-2 inline-block h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
    />
  );
}
