export type Item = {
  id: string;
  list_id: string;
  text: string;
  is_checked: boolean;
  created_at: string;
  created_by: string | null;
};

export type ListEntry = {
  id: string;
  name: string;
  created_at: string;
  is_favorite: boolean;
};
