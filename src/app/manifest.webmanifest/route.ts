import { NextResponse } from "next/server";

export function GET(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  const isFirefox = /Firefox\//.test(ua);

  const manifest = isFirefox
    ? {
        // Keep Firefox manifest intentionally minimal to reduce launcher crashes.
        name: "Listkompis",
        short_name: "Listkompis",
        start_url: "/",
        display: "browser",
        theme_color: "#2563eb",
        background_color: "#2563eb",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      }
    : {
        name: "Listkompis",
        short_name: "Listkompis",
        description: "Din delade checklista",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#2563eb",
        theme_color: "#2563eb",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store",
    },
  });
}
