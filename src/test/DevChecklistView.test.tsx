import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import DevChecklistView from "@/components/DevChecklistView";

describe("DevChecklistView", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the help link in the menu", () => {
    render(<DevChecklistView listId="list-1" />);

    fireEvent.click(screen.getByRole("button", { name: /Öppna meny/i }));

    expect(screen.getByRole("link", { name: /Hjälp/i })).toBeInTheDocument();
  });

  it("shows the same list actions as production in the menu", () => {
    render(<DevChecklistView listId="list-1" />);

    fireEvent.click(screen.getByRole("button", { name: /Öppna meny/i }));

    expect(screen.getByRole("button", { name: "Bjud in" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ta bort lista" }),
    ).toBeInTheDocument();
  });
});
