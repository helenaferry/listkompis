import { createClient } from "@/lib/supabase/server";
import { joinListWithToken } from "@/app/actions";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-500">
          Inbjudningar är inte tillgängliga i dev-läge.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch invite details — works without auth (SECURITY DEFINER, no uid check)
  const { data: details } = await supabase
    .rpc("get_invite_details", { p_token: token })
    .maybeSingle();

  const invalidInvite = !details;
  const listName = invalidInvite
    ? null
    : (details as { list_name: string; inviter_email: string | null })
        .list_name;
  const inviterEmail = invalidInvite
    ? null
    : (details as { list_name: string; inviter_email: string | null })
        .inviter_email;

  // Unauthenticated: show invite context with login/signup options
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-6">
            Listkompis
          </p>
          {invalidInvite ? (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Ogiltig inbjudan
              </h1>
              <p className="text-gray-500 text-sm">
                Den här inbjudningslänken är inte giltig.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Du är inbjuden!
              </h1>
              <p className="text-gray-600 text-sm mb-1">
                {inviterEmail ? (
                  <>
                    <span className="font-medium">{inviterEmail}</span> bjuder
                    in dig till
                  </>
                ) : (
                  "Du har blivit inbjuden till"
                )}
              </p>
              <p className="text-lg font-semibold text-gray-900 mb-6">
                {listName}
              </p>
              <p className="text-sm text-gray-500 mb-5">
                Logga in eller skapa ett konto för att gå med i listan.
              </p>
              <div className="space-y-3">
                <a
                  href={`/login?next=/bjud-in/${token}&signup=1`}
                  className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  Skapa konto
                </a>
                <a
                  href={`/login?next=/bjud-in/${token}`}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
                >
                  Logga in
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // Authenticated but invalid invite
  if (invalidInvite) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Ogiltig inbjudan
          </h1>
          <p className="text-gray-500">
            Den här inbjudningslänken är inte giltig.
          </p>
          <a
            href="/listor"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Gå till dina listor
          </a>
        </div>
      </main>
    );
  }

  async function handleJoin() {
    "use server";
    await joinListWithToken(token);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Du är inbjuden!
        </h1>
        <p className="text-gray-500 mb-6">
          {inviterEmail && (
            <span className="block text-sm mb-1">
              {inviterEmail} bjuder in dig till
            </span>
          )}
          listan <strong>{listName}</strong>
        </p>
        <form action={handleJoin}>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Gå med i listan
          </button>
        </form>
        <a
          href="/listor"
          className="mt-3 block text-sm text-gray-500 hover:text-gray-700"
        >
          Avbryt
        </a>
      </div>
    </main>
  );
}
