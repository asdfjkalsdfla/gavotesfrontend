// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MapScale, { toCssColor } from "./MapScale.jsx";

describe("MapScale - toCssColor utility", () => {
  it("converts RGB array to rgb() css string", () => {
    expect(toCssColor([185, 48, 50])).toBe("rgb(185, 48, 50)");
    expect(toCssColor([246, 246, 248])).toBe("rgb(246, 246, 248)");
  });

  it("converts RGBA array with 0-255 or 0-1 alpha to rgba() css string", () => {
    expect(toCssColor([17, 62, 103, 128])).toBe("rgba(17, 62, 103, 0.5019607843137255)");
    expect(toCssColor([17, 62, 103, 0.5])).toBe("rgba(17, 62, 103, 0.5)");
  });

  it("passes string colors through and handles null/undefined", () => {
    expect(toCssColor("#ff0000")).toBe("#ff0000");
    expect(toCssColor("rgb(1, 2, 3)")).toBe("rgb(1, 2, 3)");
    expect(toCssColor(null)).toBe("transparent");
    expect(toCssColor(undefined)).toBe("transparent");
  });
});

describe("MapScale - Render logic", () => {
  it("renders continuous color gradient and labels for Vote Share", () => {
    const mockScale = (t) => [Math.round(255 * (1 - t)), 0, Math.round(255 * t)];
    render(
      <MapScale
        scaleToColorFunction={mockScale}
        scaleMin={0}
        scaleMax={1}
        colorApproach="electionResultPerRepublicanPer"
        elevationApproach="none"
      />,
    );

    expect(screen.getByText("Vote Share (Rep / Dem)")).toBeDefined();
    expect(screen.getByText("R 100%")).toBeDefined();
    expect(screen.getByText("Tie")).toBeDefined();
    expect(screen.getByText("D 100%")).toBeDefined();
  });

  it("renders bubble legend for scatter plot modes (Vote Margin) and hides continuous color bar", () => {
    render(
      <MapScale
        scaleToColorFunction={null}
        scaleMin={0}
        scaleMax={0}
        colorApproach="electionResultVoteMargin"
        elevationApproach="none"
      />,
    );

    expect(screen.getByText("Vote Margin")).toBeDefined();
    expect(screen.getByText("Republican")).toBeDefined();
    expect(screen.getByText("Democratic")).toBeDefined();
    expect(screen.getByText("Circle size indicates margin volume")).toBeDefined();
    // Continuous scale markers must NOT be shown
    expect(screen.queryByText("R 100%")).toBeNull();
    expect(screen.queryByText("Tie")).toBeNull();
  });

  it("displays 3D height scale when elevation is active and formatted properly", () => {
    const mockScale = () => [200, 200, 200];
    render(
      <MapScale
        scaleToColorFunction={mockScale}
        scaleMin={0}
        scaleMax={1}
        colorApproach="electionResultPerRepublicanPer"
        elevationMin={0.73}
        elevationMax={1.57}
        elevationApproach="turnoutAbsSameDay"
      />,
    );

    expect(screen.getByText("Height: Turnout Ratio")).toBeDefined();
    expect(screen.getByText(/0\.73×/)).toBeDefined();
    expect(screen.getByText(/1\.57×/)).toBeDefined();
  });

  it("suppresses elevation scale when elevationApproach is 'none'", () => {
    const mockScale = () => [200, 200, 200];
    render(
      <MapScale
        scaleToColorFunction={mockScale}
        scaleMin={0}
        scaleMax={1}
        colorApproach="electionResultPerRepublicanPer"
        elevationMin={0.73}
        elevationMax={1.57}
        elevationApproach="none"
      />,
    );

    expect(screen.queryByText(/Height:/)).toBeNull();
  });

  it("returns null when no scale, no scatter, and no elevation applies", () => {
    const { container } = render(
      <MapScale
        scaleToColorFunction={null}
        scaleMin={0}
        scaleMax={0}
        colorApproach="none"
        elevationApproach="none"
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
