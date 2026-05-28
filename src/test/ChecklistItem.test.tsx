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
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    expect(screen.getByText("Köp mjölk")).toBeInTheDocument();
  });

  it("checkbox is unchecked for an unchecked item", () => {
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onToggle with correct args when checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={onToggle}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("1", true);
  });

  it("activates edit mode when text is clicked", () => {
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    fireEvent.click(screen.getByText("Köp mjölk"));
    expect(
      screen.getByRole("textbox", { name: "Redigera" }),
    ).toBeInTheDocument();
  });

  it("calls onEdit with new text on blur", () => {
    const onEdit = vi.fn();
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={onEdit}
        hideMode="strike"
      />,
    );
    fireEvent.click(screen.getByText("Köp mjölk"));
    const input = screen.getByRole("textbox", { name: "Redigera" });
    fireEvent.change(input, { target: { value: "Köp smör" } });
    fireEvent.blur(input);
    expect(onEdit).toHaveBeenCalledWith("1", "Köp smör");
  });

  it("does not call onEdit when text is unchanged", () => {
    const onEdit = vi.fn();
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={onEdit}
        hideMode="strike"
      />,
    );
    fireEvent.click(screen.getByText("Köp mjölk"));
    fireEvent.blur(screen.getByRole("textbox", { name: "Redigera" }));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("shows strikethrough text when item is checked", () => {
    const checkedItem = { ...mockItem, is_checked: true };
    render(
      <ChecklistItem
        item={checkedItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    expect(screen.getByText("Köp mjölk")).toHaveClass("line-through");
  });

  it("does not apply strikethrough when item is not checked", () => {
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    expect(screen.getByText("Köp mjölk")).not.toHaveClass("line-through");
  });

  it("activates edit mode when Enter is pressed on the text", () => {
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Redigera/ }), {
      key: "Enter",
    });
    expect(
      screen.getByRole("textbox", { name: "Redigera" }),
    ).toBeInTheDocument();
  });

  it("activates edit mode when Space is pressed on the text", () => {
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Redigera/ }), {
      key: " ",
    });
    expect(
      screen.getByRole("textbox", { name: "Redigera" }),
    ).toBeInTheDocument();
  });

  it("cancels edit and restores text when Escape is pressed", () => {
    render(
      <ChecklistItem
        item={mockItem}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        hideMode="strike"
      />,
    );
    fireEvent.click(screen.getByText("Köp mjölk"));
    const input = screen.getByRole("textbox", { name: "Redigera" });
    fireEvent.change(input, { target: { value: "Något annat" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("Köp mjölk")).toBeInTheDocument();
  });
});
