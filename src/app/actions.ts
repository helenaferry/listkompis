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

  const { data: listId, error } = await supabase.rpc("create_list", {
    p_name: name,
  });

  if (error || !listId)
    throw new Error(error?.message ?? "Could not create list");

  revalidatePath("/listor");
  return listId as string;
}

export async function setFavorite(listId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_favorite", { p_list_id: listId });
  if (error) throw new Error(error.message);
  revalidatePath("/listor");
}

export async function removeFavorite(listId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_favorite", {
    p_list_id: listId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/listor");
}

export async function getOrCreateInvite(listId: string): Promise<string> {
  const supabase = await createClient();

  const { data: token, error } = await supabase.rpc("get_or_create_invite", {
    p_list_id: listId,
  });

  if (error || !token)
    throw new Error(error?.message ?? "Could not create invite");
  return token as string;
}

export async function joinListWithToken(token: string): Promise<void> {
  const supabase = await createClient();
  const { data: listId, error } = await supabase.rpc("join_list_with_token", {
    p_token: token,
  });
  if (error) throw new Error(error.message);
  redirect(`/lista/${listId}`);
}
