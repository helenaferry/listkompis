"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createList(name: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: list, error } = await supabase
    .from("lists")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();

  if (error || !list)
    throw new Error(error?.message ?? "Could not create list");

  await supabase
    .from("list_members")
    .insert({ list_id: list.id, user_id: user.id });

  revalidatePath("/listor");
  return list.id;
}

export async function setFavorite(listId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Clear all favorites for this user, then set the new one
  await supabase
    .from("list_members")
    .update({ is_favorite: false })
    .eq("user_id", user.id);

  await supabase
    .from("list_members")
    .update({ is_favorite: true })
    .eq("user_id", user.id)
    .eq("list_id", listId);

  revalidatePath("/listor");
}

export async function removeFavorite(listId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("list_members")
    .update({ is_favorite: false })
    .eq("user_id", user.id)
    .eq("list_id", listId);

  revalidatePath("/listor");
}

export async function getOrCreateInvite(listId: string): Promise<string> {
  const supabase = await createClient();

  // Reuse existing invite for this list if one exists
  const { data: existing } = await supabase
    .from("list_invites")
    .select("token")
    .eq("list_id", listId)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.token;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: invite, error } = await supabase
    .from("list_invites")
    .insert({ list_id: listId, created_by: user.id })
    .select("token")
    .single();

  if (error || !invite)
    throw new Error(error?.message ?? "Could not create invite");
  return invite.token;
}

export async function joinListWithToken(token: string): Promise<void> {
  const supabase = await createClient();
  const { data: listId, error } = await supabase.rpc("join_list_with_token", {
    p_token: token,
  });
  if (error) throw new Error(error.message);
  redirect(`/lista/${listId}`);
}
