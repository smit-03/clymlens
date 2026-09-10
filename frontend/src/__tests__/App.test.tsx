import { render, screen } from "@testing-library/react";

import App from "../App";

describe("App", () => {
  it("renders the shell with the product name and workspace heading", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "ClymLens" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /weather workspace/i })).toBeInTheDocument();
  });
});
