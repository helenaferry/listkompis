import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListsDashboard from "@/components/ListsDashboard";
import DevListsDashboard from "@/components/DevListsDashboard";
import type { ListEntry } from "@/lib/types";

const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export default async function ListsPage() {
  if (isDevMode) {
    return (
      <main className="min-h-screen bg-gray-50">
        <DevListsDashboard />
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("list_members")
    .select("list_id, is_favorite, lists(id, name, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  const lists: ListEntry[] = (memberships ?? []).map((m) => {
    const rawL = m.lists as
      | { id: string; name: string; created_at: string }
      | { id: string; name: string; created_at: string }[]
      | null;
    const l = (Array.isArray(rawL) ? rawL[0] : rawL) as {
      id: string;
      name: string;
      created_at: string;
    };
    return {
      id: l.id,
      name: l.name,
      created_at: l.created_at,
      is_favorite: m.is_favorite,
    };
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <ListsDashboard initialLists={lists} userEmail={user.email ?? ""} />
    </main>
  );
}
