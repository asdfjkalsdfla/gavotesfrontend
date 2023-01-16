import React from "react";
import { it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";

it("renders without crashing", async () => {
  render(<App />);
  await screen.findAllByText("Georgia Votes Visual", undefined, { timeout: 5000 });
  await screen.getByText("Georgia Votes Visual");
});
