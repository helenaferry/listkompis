import { redirect } from "next/navigation";
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

  if (!user) {
    redirect(`/login?next=/bjud-in/${token}`);
  }

  // Look up invite + list name
  const { data: invite } = await supabase
    .from("list_invites")
    .select("list_id, lists(name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
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

  const listName = (invite.lists as { name: string }).name;

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
          Gå med i listan <strong>{listName}</strong>
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
