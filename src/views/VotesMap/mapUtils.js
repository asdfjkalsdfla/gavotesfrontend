import { quantile, normalizeZeroOne, normalizeZeroCenterToZeroOne } from "../../Utils.jsx";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";

// Color scale constants
const COLOR_SCALE_DEM_V_REP = scaleLinear()
  .domain([0, 0.3, 0.48, 0.5, 0.52, 0.75, 1])
  .range([
    [125, 7, 7],
    [170, 57, 57],
    [200, 161, 161],
    [255, 255, 255],
    [184, 215, 255],
    [17, 62, 103],
    [0, 20, 56],
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
  switch (elevationApproach) {
    case "none":
      return null;
    case "votes":
      return (f) => f.properties.absenteeCurrent.totalAbsenteeVotes * (isCountyLevel ? 0.2 : 2) || 0;
    case "turnoutAbsSameDay": {
      const [elevationMin, elevationMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay),
        isCountyLevel ? [0.0, 1] : [0.05, 0.95],
      );
      return (f) => {
        const value =
          normalizeZeroOne(f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay, elevationMin, elevationMax) * (isCountyLevel ? 20000 : 5000) +
            0 || 0;
        return value;
      };
    }
    default: {
      const [defaultMin, defaultMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallots),
        isCountyLevel ? [0.0, 1] : [0.05, 0.95],
      );
      return (f) => {
        const value =
          normalizeZeroOne(f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallots, defaultMin, defaultMax) * (isCountyLevel ? 20000 : 5000) + 0 || 0;
        return value;
      };
    }
  }
};

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
        const value = normalizeZeroOne(f.properties?.electionResultsComparison?.totalVotesPercent, scaleMin, scaleMax);
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : convertD3ColorToArray(color);
      };
      break;
    case "turnoutAbs":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallots),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallots, scaleMin, scaleMax);
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : convertD3ColorToArray(color);
      };
      break;
    case "turnoutAbsSameDay":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay, scaleMin, scaleMax);
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : convertD3ColorToArray(color);
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
        const value = normalizeZeroOne(f.properties?.demographics?.hispanicPer, scaleMin, scaleMax);
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : convertD3ColorToArray(color);
      };
      break;
    case "blackPer":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.demographics?.blackPer),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(f.properties?.demographics?.blackPer, scaleMin, scaleMax);
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : convertD3ColorToArray(color);
      };
      break;
    default:
      scaleToColorFunction = COLOR_SCALE_DEM_V_REP;
      colorFunction = (f) => {
        const value = f.properties?.electionResultsCurrent?.perDemocratic;
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : color;
      };
  }

  return { colorFunction, scaleToColorFunction, scaleMin, scaleMax };
};

// Data processing utilities
export const processGeoJSONData = (dataGeoJSONBase, locationResults) => {
  if (!dataGeoJSONBase || !locationResults) return null;

  // Merge the values together into a single file
  dataGeoJSONBase.features.forEach((feature) => {
    const votingResultRaw = feature.properties;
    const properties = locationResults.has(votingResultRaw.id) ? locationResults.get(votingResultRaw.id) : {};
    feature.properties = { ...feature.properties, ...properties };
  });

  return { ...dataGeoJSONBase };
};

export const extractSimpleData = (dataGeoJSONBase) => {
  return dataGeoJSONBase?.features?.map((feature) => feature.properties) || [];
};
