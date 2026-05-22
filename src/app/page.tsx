import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChecklistView from "@/components/ChecklistView";
import DevChecklistView from "@/components/DevChecklistView";

const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export default async function Home() {
  if (isDevMode) {
    return (
      <main className="min-h-screen bg-gray-50">
        <DevChecklistView />
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50">
      <ChecklistView
        initialItems={items ?? []}
        userId={user.id}
        userEmail={user.email ?? ""}
      />
    </main>
  );
}
