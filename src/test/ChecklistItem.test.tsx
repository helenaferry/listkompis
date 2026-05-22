import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChecklistItem from "@/components/ChecklistItem";

const mockItem = {
  id: "1",
  list_id: "list-1",
  text: "Köp mjölk",
  is_checked: false,
  created_at: "2024-01-01T00:00:00Z",
  created_by: null,
};

describe("ChecklistItem", () => {
  it("renders the item text", () => {
    render(
      <ChecklistItem item={mockItem} onToggle={vi.fn()} hideMode="strike" />,
    );
    expect(screen.getByText("Köp mjölk")).toBeInTheDocument();
  });

  it("checkbox is unchecked for an unchecked item", () => {
    render(
      <ChecklistItem item={mockItem} onToggle={vi.fn()} hideMode="strike" />,
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onToggle with correct args when checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(
      <ChecklistItem item={mockItem} onToggle={onToggle} hideMode="strike" />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("1", true);
  });

  it("shows strikethrough text when item is checked", () => {
    const checkedItem = { ...mockItem, is_checked: true };
    render(
      <ChecklistItem item={checkedItem} onToggle={vi.fn()} hideMode="strike" />,
    );
    expect(screen.getByText("Köp mjölk")).toHaveClass("line-through");
  });

  it("does not apply strikethrough when item is not checked", () => {
    render(
      <ChecklistItem item={mockItem} onToggle={vi.fn()} hideMode="strike" />,
    );
    expect(screen.getByText("Köp mjölk")).not.toHaveClass("line-through");
  });
});
