import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChecklistScreen from "@/components/ChecklistScreen";
import type { ListStore } from "@/lib/listStore";

const NOTICE = /väntar på uppkoppling/;

function renderScreen(addItem: ListStore["addItem"]) {
  const store = {
    subscribe: () => () => {},
    loadItems: vi.fn().mockResolvedValue([]),
    addItem,
  } as unknown as ListStore;

  render(
    <ChecklistScreen
      store={store}
      listId="list-1"
      listName="Lista"
      initialItems={[]}
      userId="user-1"
      userEmail="anna@example.com"
      createdBy="user-1"
    />,
  );

  const input = screen.getByRole("textbox", { name: "Skriv in ny sak" });
  fireEvent.change(input, { target: { value: "Mjölk" } });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("ChecklistScreen pending notice", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show the notice when changes are saved quickly", async () => {
    renderScreen(vi.fn().mockResolvedValue(undefined));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("shows the notice when changes are still waiting after the delay", async () => {
    let finishSave: () => void = () => {};
    renderScreen(
      vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishSave = resolve;
          }),
      ),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.getByText(NOTICE)).toBeInTheDocument();

    await act(async () => {
      finishSave();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });
});
