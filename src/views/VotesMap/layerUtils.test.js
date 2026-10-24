import { describe, it, expect } from "vitest";
import {
  shouldUseScatterPlot,
  createScatterPlotLayer,
  createStandardGeoLayer,
  createMapLayers,
} from "./layerUtils.js";

describe("layerUtils - shouldUseScatterPlot", () => {
  it("identifies scatter plot approaches correctly", () => {
    expect(shouldUseScatterPlot("electionResultVoteMargin")).toBe(true);
    expect(shouldUseScatterPlot("electionResultVoteShift")).toBe(true);
    expect(shouldUseScatterPlot("electionResultVoteShiftNormalized")).toBe(true);
  });

  it("identifies standard choropleth approaches correctly", () => {
    expect(shouldUseScatterPlot("electionResultPerRepublicanPer")).toBe(false);
    expect(shouldUseScatterPlot("electionResultPerRepublicanPerShift")).toBe(false);
    expect(shouldUseScatterPlot("turnoutAbsSameDay")).toBe(false);
    expect(shouldUseScatterPlot("turnoutAbs")).toBe(false);
    expect(shouldUseScatterPlot("votes")).toBe(false);
    expect(shouldUseScatterPlot("blackPer")).toBe(false);
    expect(shouldUseScatterPlot("hispanicPer")).toBe(false);
  });
});

describe("layerUtils - createScatterPlotLayer (Vote Margin & Shift)", () => {
  const sampleData = [
    {
      id: "13121",
      county: "Fulton",
      centroid: [-84.4, 33.7],
      electionResultsCurrent: { marginDemocratic: 140000 },
    },
    {
      id: "13057",
      county: "Cherokee",
      centroid: [-84.5, 34.2],
      electionResultsCurrent: { marginDemocratic: -45000 },
    },
    {
      id: "13001",
      county: "Appling",
      centroid: [-82.3, 31.7],
      electionResultsCurrent: { marginDemocratic: 0 },
    },
  ];

  it("calculates radius proportional to sqrt of vote margin", () => {
    const layer = createScatterPlotLayer({
      colorApproach: "electionResultVoteMargin",
      dataPropsOnly: sampleData,
      isCountyLevel: true,
    });

    const fulton = sampleData[0];
    const cherokee = sampleData[1];
    const appling = sampleData[2];

    const radiusFulton = layer.props.getRadius(fulton);
    const radiusCherokee = layer.props.getRadius(cherokee);
    const radiusAppling = layer.props.getRadius(appling);

    expect(radiusFulton).toBeGreaterThan(radiusCherokee);
    expect(radiusCherokee).toBeGreaterThan(radiusAppling);
    expect(radiusAppling).toBe(0);

    // Sqrt proportionality check: sqrt(140000) * 4 vs sqrt(45000) * 4
    expect(radiusFulton).toBeCloseTo(Math.sqrt(140000) * 4, 1);
    expect(radiusCherokee).toBeCloseTo(Math.sqrt(45000) * 4, 1);
  });

  it("assigns blue for positive Democratic margins and red for negative Republican margins", () => {
    const layer = createScatterPlotLayer({
      colorApproach: "electionResultVoteMargin",
      dataPropsOnly: sampleData,
      isCountyLevel: true,
      circleOpacity: 128,
    });

    const fulton = sampleData[0]; // D+ 140000
    const cherokee = sampleData[1]; // R+ 45000 (marginDemocratic: -45000)

    const colorFulton = layer.props.getFillColor(fulton);
    const colorCherokee = layer.props.getFillColor(cherokee);

    // Democratic blue: [17, 62, 103, 128]
    expect(colorFulton).toEqual([17, 62, 103, 128]);

    // Republican red: [170, 57, 57, 128]
    expect(colorCherokee).toEqual([170, 57, 57, 128]);
  });

  it("handles electionResultVoteShift comparison attributes properly", () => {
    const shiftData = [
      {
        id: "13121",
        centroid: [-84.4, 33.7],
        electionResultsComparison: { voteShiftDemocratic: 12500 },
      },
      {
        id: "13057",
        centroid: [-84.5, 34.2],
        electionResultsComparison: { voteShiftDemocratic: -3200 },
      },
    ];

    const layer = createScatterPlotLayer({
      colorApproach: "electionResultVoteShift",
      dataPropsOnly: shiftData,
      isCountyLevel: true,
    });

    expect(layer.props.getRadius(shiftData[0])).toBeCloseTo(Math.sqrt(12500) * 4 * 2, 1);
    expect(layer.props.getFillColor(shiftData[0])[0]).toBe(17); // Blue
    expect(layer.props.getFillColor(shiftData[1])[0]).toBe(170); // Red
  });
});

describe("layerUtils - createStandardGeoLayer (3D vs 2D modes)", () => {
  it("configures 3D extrusion, wireframe, lighting material, and dark rim borders when is3DMode is true", () => {
    const layer = createStandardGeoLayer({
      elevationApproach: "turnoutAbsSameDay",
      colorApproach: "electionResultPerRepublicanPer",
      currentZoomLevel: 7,
      dataGeoJSON: { type: "FeatureCollection", features: [] },
      updateActiveSelection: () => {},
      elevationFunction: () => 1000,
      colorFunction: () => [180, 40, 42],
      is3DMode: true,
    });

    expect(layer.props.extruded).toBe(true);
    expect(layer.props.wireframe).toBe(true);
    expect(layer.props.opacity).toBe(0.78);
    expect(layer.props.material).not.toBeNull();
    expect(layer.props.material.ambient).toBe(0.48);
    expect(layer.props.material.diffuse).toBe(0.65);
    expect(layer.props.getLineColor).toEqual([20, 20, 20, 220]);
    expect(layer.props.lineWidthMinPixels).toBe(1.5);
  });

  it("flattens layer, disables extrusion/material, and adjusts opacity when in 2D flat mode", () => {
    const layer = createStandardGeoLayer({
      elevationApproach: "turnoutAbsSameDay",
      colorApproach: "turnoutAbsSameDay",
      currentZoomLevel: 7,
      dataGeoJSON: { type: "FeatureCollection", features: [] },
      updateActiveSelection: () => {},
      elevationFunction: () => 1000,
      colorFunction: () => [100, 200, 100],
      is3DMode: false,
    });

    expect(layer.props.extruded).toBe(false);
    expect(layer.props.wireframe).toBe(false);
    expect(layer.props.opacity).toBe(0.65);
    expect(layer.props.material).toBeNull();
    expect(layer.props.getElevation).toBe(0);
  });
});

describe("layerUtils - createMapLayers", () => {
  it("creates two layers (base geo layer and scatter layer) when scatter plot approach is used", () => {
    const layers = createMapLayers({
      colorApproach: "electionResultVoteMargin",
      elevationApproach: "none",
      currentZoomLevel: 7,
      dataGeoJSON: { type: "FeatureCollection", features: [] },
      dataPropsOnly: [],
      updateActiveSelection: () => {},
      elevationFunction: null,
      colorFunction: null,
      isCountyLevel: true,
    });

    expect(layers.length).toBe(2);
    expect(layers[0].id).toContain("geojson_electionResultVoteMargin");
    expect(layers[1].id).toContain("scatter_electionResultVoteMargin");
  });

  it("creates one standard layer when continuous approach is used", () => {
    const layers = createMapLayers({
      colorApproach: "electionResultPerRepublicanPer",
      elevationApproach: "turnoutAbsSameDay",
      currentZoomLevel: 7,
      dataGeoJSON: { type: "FeatureCollection", features: [] },
      dataPropsOnly: [],
      updateActiveSelection: () => {},
      elevationFunction: () => 1000,
      colorFunction: () => [180, 40, 42],
      isCountyLevel: true,
      is3DMode: true,
    });

    expect(layers.length).toBe(1);
    expect(layers[0].id).toContain("geojson_turnoutAbsSameDay_electionResultPerRepublicanPer");
  });
});
