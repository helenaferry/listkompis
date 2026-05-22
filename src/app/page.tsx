import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChecklistView from "@/components/ChecklistView";

export default async function Home() {
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
