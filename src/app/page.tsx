import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const isDevMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

export default async function Home() {
  if (isDevMode) {
    redirect("/listor");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Redirect to favorite list if one is set
  const { data: favorite } = await supabase
    .from("list_members")
    .select("list_id")
    .eq("user_id", user.id)
    .eq("is_favorite", true)
    .maybeSingle();

  if (favorite) redirect(`/lista/${favorite.list_id}`);

  redirect("/listor");
}
