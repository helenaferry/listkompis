export type Item = {
  id: string;
  list_id: string;
  text: string;
  is_checked: boolean;
  is_starred: boolean;
  position: number;
  created_at: string;
  created_by: string | null;
};

export type ListEntry = {
  id: string;
  name: string;
  created_at: string;
  is_favorite: boolean;
  created_by: string | null;
};
