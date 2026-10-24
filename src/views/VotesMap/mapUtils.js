import { quantile, normalizeZeroOne, normalizeZeroCenterToZeroOne } from "../../Utils.jsx";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";

// Color scale constants - high-contrast election cartography palette
// Carefully calibrated for Georgia's county distribution to eliminate washed-out pinks
// and maximize perceptual distinction between solid, moderate, lean, and competitive counties.
const COLOR_SCALE_DEM_V_REP = scaleLinear()
  .domain([0.0, 0.20, 0.30, 0.38, 0.45, 0.49, 0.50, 0.51, 0.55, 0.62, 0.70, 0.80, 1.0])
  .range([
    [115, 10, 16],   // 0.00: Deep Burgundy
    [150, 24, 28],   // 0.20 (>80% R): Rich Crimson
    [185, 48, 50],   // 0.30 (70-80% R): Classic Brick Red
    [212, 88, 88],   // 0.38 (62-70% R): Warm Medium Red
    [232, 158, 158], // 0.45 (55-62% R): Soft Dusty Rose
    [242, 206, 206], // 0.49 (51-55% R): Subtle Blush
    [246, 246, 248], // 0.50 (Tie): Clean Crisp Neutral Off-White
    [206, 222, 244], // 0.51 (51-55% D): Subtle Ice
    [158, 192, 232], // 0.55 (55-62% D): Soft Slate Blue
    [88, 148, 212],  // 0.62 (62-70% D): Vibrant Steel Blue
    [36, 100, 180],  // 0.70 (70-80% D): Classic Election Blue
    [16, 56, 136],   // 0.80 (>80% D): Deep Navy Blue
    [8, 28, 88],     // 1.00: Midnight Navy
  ]);

// Utility function to convert D3 color to array
export const convertD3ColorToArray = (color) =>
  color
    .replace("rgb(", "")
    .replace(")", "")
    .split(",")
    .map((val) => parseInt(val, 10));

// Elevation function factory
export const createElevationFunction = (elevationApproach, isCountyLevel, locationResults) => {
  const baseElevation = isCountyLevel ? 600 : 200;
  const heightScale = isCountyLevel ? 34000 : 8000;
  let elevationMin = 0;
  let elevationMax = 1;

  switch (elevationApproach) {
    case "none":
      return { elevationFunction: null, elevationMin: 0, elevationMax: 0 };
    case "votes": {
      const values = [...locationResults.values()]
        .map((datapoint) => datapoint?.absenteeCurrent?.totalAbsenteeVotes)
        .filter((v) => typeof v === "number" && Number.isFinite(v));
      elevationMin = values.length > 0 ? Math.min(...values) : 0;
      elevationMax = values.length > 0 ? Math.max(...values) : 1;
      const elevationFunction = (f) => {
        const votes = f.properties?.absenteeCurrent?.totalAbsenteeVotes;
        return votes ? baseElevation + votes * (isCountyLevel ? 0.25 : 1.5) : 0;
      };
      return { elevationFunction, elevationMin, elevationMax };
    }
    case "turnoutAbsSameDay": {
      const values = [...locationResults.values()]
        .map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay)
        .filter((v) => typeof v === "number" && Number.isFinite(v));

      if (values.length > 0) {
        [elevationMin, elevationMax] = quantile(
          values,
          isCountyLevel ? [0.0, 1.0] : [0.02, 0.98],
        );
      }

      const elevationFunction = (f) => {
        const rawVal = f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay;
        if (rawVal === undefined || rawVal === null) return 0;
        // When all counties have identical values (e.g. comparing year to itself)
        if (elevationMax <= elevationMin) {
          return baseElevation + heightScale * 0.4;
        }
        const normalized = normalizeZeroOne(rawVal, elevationMin, elevationMax);
        return normalized !== undefined ? baseElevation + normalized * heightScale : 0;
      };
      return { elevationFunction, elevationMin, elevationMax };
    }
    default: {
      const values = [...locationResults.values()]
        .map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallots)
        .filter((v) => typeof v === "number" && Number.isFinite(v));

      if (values.length > 0) {
        [elevationMin, elevationMax] = quantile(
          values,
          isCountyLevel ? [0.0, 1.0] : [0.02, 0.98],
        );
      }

      const elevationFunction = (f) => {
        const rawVal = f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallots;
        if (rawVal === undefined || rawVal === null) return 0;
        if (elevationMax <= elevationMin) {
          return baseElevation + heightScale * 0.4;
        }
        const normalized = normalizeZeroOne(rawVal, elevationMin, elevationMax);
        return normalized !== undefined ? baseElevation + normalized * heightScale : 0;
      };
      return { elevationFunction, elevationMin, elevationMax };
    }
  }
};

const MISSING_DATA_COLOR = [200, 204, 202, 180];

// Color function factory
export const createColorFunction = (colorApproach, isCountyLevel, locationResults) => {
  let scaleMin = 0;
  let scaleMax = 1;
  let scaleToColorFunction = null;
  let colorFunction = null;

  switch (colorApproach) {
    case "totalVotesPercent":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.electionResultsComparison?.totalVotesPercent),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const rawVal = f.properties?.electionResultsComparison?.totalVotesPercent;
        if (rawVal === undefined || rawVal === null) return MISSING_DATA_COLOR;
        const value = normalizeZeroOne(rawVal, scaleMin, scaleMax);
        const color = scaleToColorFunction(value ?? 0);
        return convertD3ColorToArray(color);
      };
      break;
    case "turnoutAbs":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallots),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const rawVal = f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallots;
        if (rawVal === undefined || rawVal === null) return MISSING_DATA_COLOR;
        const value = normalizeZeroOne(rawVal, scaleMin, scaleMax);
        const color = scaleToColorFunction(value ?? 0);
        return convertD3ColorToArray(color);
      };
      break;
    case "turnoutAbsSameDay":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const rawVal = f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay;
        if (rawVal === undefined || rawVal === null) return MISSING_DATA_COLOR;
        const value = normalizeZeroOne(rawVal, scaleMin, scaleMax);
        const color = scaleToColorFunction(value ?? 0);
        return convertD3ColorToArray(color);
      };
      break;
    case "votes":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.absenteeCurrent?.totalAbsenteeVotes),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateBlues;
      colorFunction = (f) => {
        const rawVal = f.properties?.absenteeCurrent?.totalAbsenteeVotes;
        if (rawVal === undefined || rawVal === null) return MISSING_DATA_COLOR;
        const value = normalizeZeroOne(rawVal, scaleMin, scaleMax);
        const color = scaleToColorFunction(value ?? 0);
        return convertD3ColorToArray(color);
      };
      break;
    case "electionResultPerRepublicanPerShift": {
      const [firstMin, firstMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.electionResultsComparison?.perShiftDemocratic),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleMin = Math.abs(firstMin) > Math.abs(firstMax) ? -1 * Math.abs(firstMin) : -1 * Math.abs(firstMax);
      scaleMax = -1 * scaleMin;
      scaleToColorFunction = (value) => (value < 0.5 ? d3ScaleChromatic.interpolateReds(1 - 2 * value) : d3ScaleChromatic.interpolateBlues(2 * (value - 0.5)));

      colorFunction = (f) => {
        const perAdjusted = normalizeZeroCenterToZeroOne(f.properties?.electionResultsComparison?.perShiftDemocratic, scaleMin, scaleMax);
        const color = !(perAdjusted === undefined) ? scaleToColorFunction(perAdjusted) : [255, 255, 255, 0];
        return convertD3ColorToArray(color);
      };
      break;
    }
    case "hispanicPer":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.demographics?.hispanicPer),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const rawVal = f.properties?.demographics?.hispanicPer;
        if (rawVal === undefined || rawVal === null) return MISSING_DATA_COLOR;
        const value = normalizeZeroOne(rawVal, scaleMin, scaleMax);
        const color = scaleToColorFunction(value ?? 0);
        return convertD3ColorToArray(color);
      };
      break;
    case "blackPer":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.demographics?.blackPer),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const rawVal = f.properties?.demographics?.blackPer;
        if (rawVal === undefined || rawVal === null) return MISSING_DATA_COLOR;
        const value = normalizeZeroOne(rawVal, scaleMin, scaleMax);
        const color = scaleToColorFunction(value ?? 0);
        return convertD3ColorToArray(color);
      };
      break;
    case "electionResultVoteMargin":
    case "electionResultVoteShift":
    case "electionResultVoteShiftNormalized":
      // Scatter plot approaches use proportional circles instead of continuous color ramp
      scaleToColorFunction = null;
      colorFunction = null;
      scaleMin = 0;
      scaleMax = 0;
      break;
    case "electionResultPerRepublicanPer":
    default:
      scaleMin = 0;
      scaleMax = 1;
      scaleToColorFunction = COLOR_SCALE_DEM_V_REP;
      colorFunction = (f) => {
        const value = f.properties?.electionResultsCurrent?.perDemocratic;
        if (value === undefined || value === null) return MISSING_DATA_COLOR;
        const color = scaleToColorFunction(value);
        return color;
      };
      break;
  }

  return { colorFunction, scaleToColorFunction, scaleMin, scaleMax };
};

// Data processing utilities
export const processGeoJSONData = (dataGeoJSONBase, locationResults) => {
  if (!dataGeoJSONBase || !locationResults) return null;

  const features = dataGeoJSONBase.features.map((feature) => {
    const votingResultRaw = feature.properties;
    const properties = locationResults.has(votingResultRaw?.id) ? locationResults.get(votingResultRaw.id) : {};
    return {
      ...feature,
      properties: { ...feature.properties, ...properties },
    };
  });

  return { ...dataGeoJSONBase, features };
};

export const extractSimpleData = (dataGeoJSONBase) => {
  return dataGeoJSONBase?.features?.map((feature) => feature.properties) || [];
};
