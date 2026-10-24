import { describe, it, expect, vi } from "vitest";
import {
  createMapTooltip,
  shouldShowTooltip,
  formatTooltipValue,
} from "./tooltipUtils.js";

describe("tooltipUtils - createMapTooltip", () => {
  const updateActiveHover = vi.fn();

  it("returns null and clears active hover when object is null", () => {
    const tooltip = createMapTooltip({
      object: null,
      colorApproach: "electionResultPerRepublicanPer",
      elevationApproach: "turnoutAbsSameDay",
      updateActiveHover,
    });

    expect(tooltip).toBeNull();
    expect(updateActiveHover).toHaveBeenCalledWith(null);
  });

  it("updates active hover with feature id", () => {
    const feature = {
      properties: { id: "13121", CTYNAME: "Fulton", electionResultsCurrent: { perDemocratic: 0.728 } },
    };

    createMapTooltip({
      object: feature,
      colorApproach: "electionResultPerRepublicanPer",
      elevationApproach: "none",
      updateActiveHover,
    });

    expect(updateActiveHover).toHaveBeenCalledWith("13121");
  });

  it("formats Vote Share with party and percentage (R 75.0% for Dem 0.25)", () => {
    const featureRep = {
      properties: {
        id: "13001",
        CTYNAME: "Appling",
        electionResultsCurrent: { perDemocratic: 0.25 },
      },
    };

    const tooltip = createMapTooltip({
      object: featureRep,
      colorApproach: "electionResultPerRepublicanPer",
      elevationApproach: "none",
      updateActiveHover,
    });

    expect(tooltip.html).toContain("Appling");
    expect(tooltip.html).toContain("Color: R 75.0%");
  });

  it("formats Vote Share with Democratic party for Dem > 50%", () => {
    const featureDem = {
      properties: {
        id: "13121",
        CTYNAME: "Fulton",
        electionResultsCurrent: { perDemocratic: 0.728 },
      },
    };

    const tooltip = createMapTooltip({
      object: featureDem,
      colorApproach: "electionResultPerRepublicanPer",
      elevationApproach: "none",
      updateActiveHover,
    });

    expect(tooltip.html).toContain("Fulton");
    expect(tooltip.html).toContain("Color: D 72.8%");
  });

  it("formats Vote Margin with D+ and R+ indicators and integer count", () => {
    const featureDem = {
      properties: {
        id: "13121",
        CTYNAME: "Fulton",
        electionResultsCurrent: { marginDemocratic: 142500 },
      },
    };
    const tooltipDem = createMapTooltip({
      object: featureDem,
      colorApproach: "electionResultVoteMargin",
      elevationApproach: "none",
      updateActiveHover,
    });
    expect(tooltipDem.html).toContain("Color: D+142,500");

    const featureRep = {
      properties: {
        id: "13057",
        CTYNAME: "Cherokee",
        electionResultsCurrent: { marginDemocratic: -45200 },
      },
    };
    const tooltipRep = createMapTooltip({
      object: featureRep,
      colorApproach: "electionResultVoteMargin",
      elevationApproach: "none",
      updateActiveHover,
    });
    expect(tooltipRep.html).toContain("Color: R+45,200");
  });

  it("formats 3D elevation turnout ratio with multiplier symbol", () => {
    const feature = {
      properties: {
        id: "13121",
        CTYNAME: "Fulton",
        electionResultsCurrent: { perDemocratic: 0.728 },
        absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.15 },
      },
    };

    const tooltip = createMapTooltip({
      object: feature,
      colorApproach: "electionResultPerRepublicanPer",
      elevationApproach: "turnoutAbsSameDay",
      updateActiveHover,
    });

    expect(tooltip.html).toContain("Height: 1.15×");
  });

  it("returns null if feature has neither color nor elevation data", () => {
    const emptyFeature = {
      properties: { id: "13000" },
    };

    const tooltip = createMapTooltip({
      object: emptyFeature,
      colorApproach: "electionResultPerRepublicanPer",
      elevationApproach: "turnoutAbsSameDay",
      updateActiveHover,
    });

    expect(tooltip).toBeNull();
  });
});

describe("tooltipUtils - shouldShowTooltip", () => {
  it("returns false for null object or object without data", () => {
    expect(shouldShowTooltip(null, "electionResultPerRepublicanPer", "none")).toBe(false);
    expect(shouldShowTooltip({ properties: {} }, "electionResultPerRepublicanPer", "none")).toBe(false);
  });

  it("returns true when color or elevation data exists", () => {
    const featureWithColor = {
      properties: { electionResultsCurrent: { perDemocratic: 0.45 } },
    };
    expect(shouldShowTooltip(featureWithColor, "electionResultPerRepublicanPer", "none")).toBe(true);

    const featureWithElevation = {
      properties: { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.1 } },
    };
    expect(shouldShowTooltip(featureWithElevation, "none", "turnoutAbsSameDay")).toBe(true);
  });
});

describe("tooltipUtils - formatTooltipValue", () => {
  it("formats percentages and vote shifts correctly", () => {
    expect(formatTooltipValue(0.485, "electionResultPerRepublicanPer")).toBe("48.5%");
    expect(formatTooltipValue(12500, "electionResultVoteShift")).toBe("12,500");
  });
});
