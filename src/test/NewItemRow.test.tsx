import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NewItemRow from "@/components/NewItemRow";

describe("NewItemRow", () => {
  it("renders the input field", () => {
    render(<NewItemRow onAdd={vi.fn()} />);
    expect(
      screen.getByRole("textbox", { name: "Skriv in ny sak" }),
    ).toBeInTheDocument();
  });

  it("calls onAdd with trimmed text when Enter is pressed", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<NewItemRow onAdd={onAdd} />);
    const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
    fireEvent.change(input, { target: { value: "  Köp ägg  " } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(onAdd).toHaveBeenCalledWith("Köp ägg");
  });

  it("clears the input after adding an item", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<NewItemRow onAdd={onAdd} />);
    const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
    fireEvent.change(input, { target: { value: "Köp bröd" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(input).toHaveValue("");
  });

  it("does not call onAdd when input is empty or whitespace", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<NewItemRow onAdd={onAdd} />);
    const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
    fireEvent.change(input, { target: { value: "   " } });
    await fireEvent.keyDown(input, { key: "Enter" });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("clears the input when Escape is pressed", () => {
    render(<NewItemRow onAdd={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
    fireEvent.change(input, { target: { value: "Halvfärdigt" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
  });

  it("does not submit on blur", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<NewItemRow onAdd={onAdd} />);
    const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
    fireEvent.change(input, { target: { value: "Ofärdig text" } });
    fireEvent.blur(input);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("adds a starred item when the star button is selected", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<NewItemRow onAdd={onAdd} />);

    const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
    fireEvent.change(input, { target: { value: "Köp ost" } });
    fireEvent.click(screen.getByRole("button", { name: /Stjärnmärk ny sak/ }));

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(onAdd).toHaveBeenCalledWith("Köp ost", true);
  });

  it("shows a visible add button when text is entered and submits a starred item on click", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<NewItemRow onAdd={onAdd} />);

    const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
    fireEvent.change(input, { target: { value: "Köp ost" } });
    fireEvent.click(screen.getByRole("button", { name: /Stjärnmärk ny sak/ }));

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Lägg till ny sak/i }),
      );
    });

    expect(onAdd).toHaveBeenCalledWith("Köp ost", true);
  });
});
