import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const isDevMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

function isPublicAsset(pathname: string) {
  return (
    pathname.endsWith("manifest.webmanifest") ||
    pathname === "/sw.js" ||
    pathname.endsWith("sw.js") ||
    pathname.startsWith("/icon") ||
    pathname === "/favicon.ico"
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 🔓 Always allow PWA + static assets (NO AUTH, NO REDIRECTS)
  if (isPublicAsset(pathname) || isDevMode) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔐 AUTH PROTECTION
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/glomt-losenord") ||
    pathname.startsWith("/hjalp") ||
    pathname.startsWith("/bjud-in");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";

    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }

    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
