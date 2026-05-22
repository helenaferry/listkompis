export type { Item } from "@/lib/types";
import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  onToggle: (id: string, checked: boolean) => void;
  hideMode: "strike" | "hide";
}

export default function ChecklistItem({ item, onToggle }: Props) {
  return (
    <li className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100">
      <input
        type="checkbox"
        checked={item.is_checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
        aria-label={`Bocka av: ${item.text}`}
      />
      <span
        className={`flex-1 text-gray-800 break-words ${
          item.is_checked ? "line-through text-gray-400" : ""
        }`}
      >
        {item.text}
      </span>
    </li>
  );
}
