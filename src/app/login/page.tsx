"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const linkExpired = searchParams.get("error") === "link-expired";

  // If the user navigates back to this page via bfcache while already logged in,
  // the server-side proxy never runs – catch it here instead.
  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) router.replace(searchParams.get("next") ?? "/");
      });
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const next = searchParams.get("next") ?? "/";
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
          });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (mode === "signup") {
      setSignupSent(true);
      setLoading(false);
    } else {
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Listkompis</h1>
        <p className="text-sm text-gray-500 mb-6">Din delade checklista</p>

        {signupSent ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Vi har skickat en bekräftelselänk till <strong>{email}</strong>.
              Klicka på länken i mejlet för att aktivera ditt konto.
            </p>
            <p className="text-xs text-gray-500">
              Länken fungerar bara i samma webbläsare du använde när du skapade
              kontot. Kolla skräpposten om mejlet inte dyker upp.
            </p>
            <button
              onClick={() => {
                setSignupSent(false);
                setMode("login");
                setPassword("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Tillbaka till inloggning
            </button>
          </div>
        ) : (
          <>
            {linkExpired && (
              <p
                className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4"
                role="alert"
              >
                Bekräftelselänken gick inte att använda — antingen har den gått
                ut eller öppnades den i fel webbläsare. Prova att logga in
                direkt, eller skapa kontot igen.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  E-post
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Lösenord
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p
                  className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {loading
                  ? "Laddar…"
                  : mode === "login"
                    ? "Logga in"
                    : "Skapa konto"}
              </button>
            </form>

            <button
              onClick={() => {
                setMode((m) => (m === "login" ? "signup" : "login"));
                setError(null);
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 w-full text-center"
            >
              {mode === "login"
                ? "Inget konto? Skapa ett"
                : "Har redan konto? Logga in"}
            </button>

            {mode === "login" && (
              <Link
                href="/glomt-losenord"
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 block text-center"
              >
                Glömt lösenordet?
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
