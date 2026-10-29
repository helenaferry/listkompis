"use client";

import { supabaseListStore } from "@/lib/supabaseListStore";
import type { Item } from "@/lib/types";
import ChecklistScreen from "./ChecklistScreen";

interface Props {
  listId: string;
  listName: string;
  initialItems: Item[];
  userId: string;
  userEmail: string;
  createdBy: string | null;
}

export default function ChecklistView(props: Props) {
  return <ChecklistScreen store={supabaseListStore} {...props} />;
}
