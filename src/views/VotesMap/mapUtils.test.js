import { describe, it, expect } from "vitest";
import {
  createColorFunction,
  createElevationFunction,
  processGeoJSONData,
  extractSimpleData,
  convertD3ColorToArray,
} from "./mapUtils.js";

describe("mapUtils - createColorFunction", () => {
  describe("Vote Share (electionResultPerRepublicanPer)", () => {
    const mockLocationResults = new Map();
    const { colorFunction, scaleToColorFunction, scaleMin, scaleMax } = createColorFunction(
      "electionResultPerRepublicanPer",
      true,
      mockLocationResults,
    );

    it("initializes scale bounds to 0 and 1 with valid color function", () => {
      expect(scaleMin).toBe(0);
      expect(scaleMax).toBe(1);
      expect(typeof scaleToColorFunction).toBe("function");
      expect(typeof colorFunction).toBe("function");
    });

    it("maps high Republican share (low perDemocratic) to deep crimson/burgundy without salmon hue", () => {
      const featureStrongR = {
        properties: { electionResultsCurrent: { perDemocratic: 0.2 } }, // 80% R
      };
      const color = colorFunction(featureStrongR);
      expect(Array.isArray(color)).toBe(true);
      const [r, g, b] = color;
      // Strong red dominance: Red must be significantly higher than Green and Blue
      expect(r).toBeGreaterThan(130);
      expect(g).toBeLessThan(40);
      expect(b).toBeLessThan(40);
    });

    it("maps 70% Republican county (perDemocratic 0.30) to classic brick red", () => {
      const featureSolidR = {
        properties: { electionResultsCurrent: { perDemocratic: 0.3 } },
      };
      const [r, g, b] = colorFunction(featureSolidR);
      expect(r).toBeGreaterThan(170);
      expect(g).toBeLessThan(65);
      expect(b).toBeLessThan(65);
    });

    it("maps 50% tie to neutral off-white", () => {
      const featureTie = {
        properties: { electionResultsCurrent: { perDemocratic: 0.5 } },
      };
      const [r, g, b] = colorFunction(featureTie);
      expect(r).toBeGreaterThan(240);
      expect(g).toBeGreaterThan(240);
      expect(b).toBeGreaterThan(240);
      // Clean neutral balance (no strong color cast)
      expect(Math.abs(r - g)).toBeLessThanOrEqual(5);
      expect(Math.abs(g - b)).toBeLessThanOrEqual(5);
    });

    it("maps Democratic share to distinct royal and navy blues", () => {
      const featureSolidD = {
        properties: { electionResultsCurrent: { perDemocratic: 0.7 } },
      };
      const [r, , b] = colorFunction(featureSolidD);
      // Blue dominance
      expect(b).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(160);
      expect(r).toBeLessThan(60);
    });

    it("provides distinct, distinguishable colors between 75% R, 62% R, and 52% R counties", () => {
      // Prevents the regression where all Republican counties look like identical salmon pink
      const color75R = colorFunction({ properties: { electionResultsCurrent: { perDemocratic: 0.25 } } });
      const color62R = colorFunction({ properties: { electionResultsCurrent: { perDemocratic: 0.38 } } });
      const color52R = colorFunction({ properties: { electionResultsCurrent: { perDemocratic: 0.48 } } });

      // Calculate Euclidean color distance between the stops
      const dist = (c1, c2) => Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);

      expect(dist(color75R, color62R)).toBeGreaterThan(25);
      expect(dist(color62R, color52R)).toBeGreaterThan(25);
    });

    it("returns MISSING_DATA_COLOR for missing or null electionResultsCurrent", () => {
      const missingFeature = { properties: {} };
      const nullFeature = { properties: { electionResultsCurrent: { perDemocratic: null } } };
      expect(colorFunction(missingFeature)).toEqual([200, 204, 202, 180]);
      expect(colorFunction(nullFeature)).toEqual([200, 204, 202, 180]);
    });
  });

  describe("Scatter plot approaches (vote margin & shift)", () => {
    it("returns null color functions for scatter plot modes so continuous choropleth is not rendered", () => {
      const mockLocationResults = new Map();
      const marginResult = createColorFunction("electionResultVoteMargin", true, mockLocationResults);
      expect(marginResult.colorFunction).toBeNull();
      expect(marginResult.scaleToColorFunction).toBeNull();

      const shiftResult = createColorFunction("electionResultVoteShift", true, mockLocationResults);
      expect(shiftResult.colorFunction).toBeNull();

      const shiftNormResult = createColorFunction("electionResultVoteShiftNormalized", true, mockLocationResults);
      expect(shiftNormResult.colorFunction).toBeNull();
    });
  });

  describe("Vote shift (electionResultPerRepublicanPerShift)", () => {
    it("creates symmetric scale centered at 0 with negative mapped to red and positive to blue", () => {
      const mockLocationResults = new Map([
        ["1", { electionResultsComparison: { perShiftDemocratic: -0.15 } }],
        ["2", { electionResultsComparison: { perShiftDemocratic: 0.1 } }],
      ]);
      const { colorFunction, scaleMin, scaleMax } = createColorFunction(
        "electionResultPerRepublicanPerShift",
        true,
        mockLocationResults,
      );

      expect(scaleMin).toBeLessThan(0);
      expect(scaleMax).toBe(-scaleMin);

      // Negative shift (shift to Republican)
      const colorRep = colorFunction({ properties: { electionResultsComparison: { perShiftDemocratic: -0.1 } } });
      expect(colorRep[0]).toBeGreaterThan(colorRep[2]); // R > B

      // Positive shift (shift to Democratic)
      const colorDem = colorFunction({ properties: { electionResultsComparison: { perShiftDemocratic: 0.1 } } });
      expect(colorDem[2]).toBeGreaterThan(colorDem[0]); // B > R
    });
  });
});

describe("mapUtils - createElevationFunction", () => {
  it("returns null elevation for 'none'", () => {
    const { elevationFunction, elevationMin, elevationMax } = createElevationFunction("none", true, new Map());
    expect(elevationFunction).toBeNull();
    expect(elevationMin).toBe(0);
    expect(elevationMax).toBe(0);
  });

  describe("Dynamic scaling across election years (turnoutAbsSameDay)", () => {
    it("dynamically calculates elevationMin and elevationMax from actual locationResults", () => {
      const mockLocationResults = new Map([
        ["13001", { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 0.75 } }],
        ["13003", { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.1 } }],
        ["13005", { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.55 } }],
      ]);

      const { elevationFunction, elevationMin, elevationMax } = createElevationFunction(
        "turnoutAbsSameDay",
        true,
        mockLocationResults,
      );

      expect(elevationMin).toBeCloseTo(0.75, 2);
      expect(elevationMax).toBeCloseTo(1.55, 2);

      // Minimum value gets base elevation (600)
      const minElevation = elevationFunction({
        properties: { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 0.75 } },
      });
      expect(minElevation).toBeCloseTo(600, 0);

      // Maximum value gets base elevation + heightScale (600 + 34000 = 34600)
      const maxElevation = elevationFunction({
        properties: { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.55 } },
      });
      expect(maxElevation).toBeCloseTo(34600, 0);

      // Intermediate value scales proportionally
      const midElevation = elevationFunction({
        properties: { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.15 } },
      });
      expect(midElevation).toBeGreaterThan(minElevation);
      expect(midElevation).toBeLessThan(maxElevation);
    });

    it("handles edge case when comparing year to itself (all counties have identical values) without NaN", () => {
      const identicalResults = new Map([
        ["13001", { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.0 } }],
        ["13003", { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.0 } }],
      ]);

      const { elevationFunction, elevationMin, elevationMax } = createElevationFunction(
        "turnoutAbsSameDay",
        true,
        identicalResults,
      );

      expect(elevationMin).toBe(1.0);
      expect(elevationMax).toBe(1.0);

      const elevation = elevationFunction({
        properties: { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.0 } },
      });
      expect(Number.isFinite(elevation)).toBe(true);
      expect(elevation).toBeGreaterThan(0);
      expect(Number.isNaN(elevation)).toBe(false);
    });

    it("returns 0 for features missing the elevation property", () => {
      const mockLocationResults = new Map([
        ["13001", { absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.0 } }],
      ]);
      const { elevationFunction } = createElevationFunction("turnoutAbsSameDay", true, mockLocationResults);

      expect(elevationFunction({ properties: {} })).toBe(0);
      expect(elevationFunction({ properties: { absenteeBallotComparison: null } })).toBe(0);
    });
  });

  describe("Absolute votes elevation approach", () => {
    it("scales elevation based on totalAbsenteeVotes", () => {
      const mockLocationResults = new Map([
        ["13001", { absenteeCurrent: { totalAbsenteeVotes: 1000 } }],
        ["13121", { absenteeCurrent: { totalAbsenteeVotes: 80000 } }], // Fulton
      ]);

      const { elevationFunction, elevationMin, elevationMax } = createElevationFunction(
        "votes",
        true,
        mockLocationResults,
      );

      expect(elevationMin).toBe(1000);
      expect(elevationMax).toBe(80000);

      const elevSmall = elevationFunction({ properties: { absenteeCurrent: { totalAbsenteeVotes: 1000 } } });
      const elevLarge = elevationFunction({ properties: { absenteeCurrent: { totalAbsenteeVotes: 80000 } } });

      expect(elevLarge).toBeGreaterThan(elevSmall);
      // In county level: baseElevation (600) + votes * 0.25
      expect(elevSmall).toBe(600 + 1000 * 0.25);
      expect(elevLarge).toBe(600 + 80000 * 0.25);
    });
  });
});

describe("mapUtils - processGeoJSONData & extractSimpleData", () => {
  it("merges location results into GeoJSON feature properties based on ID", () => {
    const rawGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "13121",
          properties: { id: "13121", CTYNAME: "Fulton" },
          geometry: { type: "Polygon", coordinates: [] },
        },
        {
          type: "Feature",
          id: "13089",
          properties: { id: "13089", CTYNAME: "DeKalb" },
          geometry: { type: "Polygon", coordinates: [] },
        },
      ],
    };

    const locationResults = new Map([
      ["13121", { electionResultsCurrent: { marginDemocratic: 120000 } }],
      ["13089", { electionResultsCurrent: { marginDemocratic: 85000 } }],
    ]);

    const merged = processGeoJSONData(rawGeoJSON, locationResults);
    expect(merged).not.toBeNull();
    expect(merged.features.length).toBe(2);

    const fulton = merged.features.find((f) => f.properties.id === "13121");
    expect(fulton.properties.CTYNAME).toBe("Fulton");
    expect(fulton.properties.electionResultsCurrent.marginDemocratic).toBe(120000);

    const simpleData = extractSimpleData(merged);
    expect(simpleData.length).toBe(2);
    expect(simpleData[0].electionResultsCurrent.marginDemocratic).toBe(120000);
  });

  it("handles missing inputs gracefully", () => {
    expect(processGeoJSONData(null, new Map())).toBeNull();
    expect(processGeoJSONData({}, null)).toBeNull();
    expect(extractSimpleData(null)).toEqual([]);
  });
});

describe("mapUtils - convertD3ColorToArray", () => {
  it("converts D3 rgb string to number array", () => {
    expect(convertD3ColorToArray("rgb(120, 45, 200)")).toEqual([120, 45, 200]);
    expect(convertD3ColorToArray("rgb(0, 0, 0)")).toEqual([0, 0, 0]);
  });
});
