import React from "react";
import { it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";

it("renders without crashing", async () => {
  render(<App />);
  await waitFor(() => screen.getByText("Options"));
  await screen.getByText("Options", { exact: false });
});
