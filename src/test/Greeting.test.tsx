import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Greeting from "@/components/Greeting";

describe("Greeting", () => {
  it("shows the greeting text", () => {
    render(<Greeting />);

    expect(screen.getByText(/världens bästa/)).toBeInTheDocument();
  });

  it("shows the logged-in email on a new line for other users", () => {
    render(<Greeting email="anna@example.com" />);

    expect(screen.getByText("Du är inloggad som:")).toBeInTheDocument();
    expect(screen.getByText("anna@example.com")).toBeInTheDocument();
    expect(screen.queryByText(/världens bästa/)).not.toBeInTheDocument();
  });
});
