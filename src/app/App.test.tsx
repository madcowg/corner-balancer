import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App foundation shell", () => {
  it("renders the app title and the route reference", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { level: 1, name: /welcome and resume/i })
    ).toBeInTheDocument();
    expect(await screen.findByText(/figma reference/i)).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /garage/i })).toBeInTheDocument();
  });
});
