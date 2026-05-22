import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChecklistView from "@/components/ChecklistView";
import DevChecklistView from "@/components/DevChecklistView";
import type { Item } from "@/lib/types";

const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isDevMode) {
    return (
      <main className="min-h-screen bg-gray-50">
        <DevChecklistView listId={id} />
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify membership and get list info
  const { data: membership } = await supabase
    .from("list_members")
    .select("is_favorite, lists(id, name)")
    .eq("list_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const rawList = membership.lists as
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
  const list = Array.isArray(rawList)
    ? rawList[0]
    : (rawList as { id: string; name: string });

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("list_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      <ChecklistView
        listId={id}
        listName={list.name}
        initialItems={(items ?? []) as Item[]}
        userId={user.id}
        userEmail={user.email ?? ""}
        isFavorite={membership.is_favorite}
      />
    </main>
  );
}
