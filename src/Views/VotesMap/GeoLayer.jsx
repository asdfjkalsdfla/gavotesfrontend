import { useState, useEffect, useMemo } from "react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { scaleLinear } from "d3-scale";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { useElectionData } from "../../context/ElectionDataProvider.jsx";
import { quantile, normalizeZeroOne, normalizeZeroCenterToZeroOne } from "../../Utils";

const convertD3ColorToArray = (color) =>
  color
    .replace("rgb(", "")
    .replace(")", "")
    .split(",")
    .map((val) => parseInt(val, 10));

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

export default function GeoLayer(countyFilter, isCountyLevel, elevationApproach, colorApproach, updateActiveSelection) {
  const { locationResults } = useElectionData();

  // ************************************************
  // Manage the map data
  // ************************************************
  // If the user sets a specific county, we show only that counties data @ precinct level
  // Otherwise, we determine if we show counties or precinct state wide data

  const geoJSONFile = countyFilter
    ? `static/shapeFiles/GA_precincts_2022_${countyFilter}_simple.json`
    : isCountyLevel
      ? "static/shapeFiles/GA_counties_simple.json"
      : "static/shapeFiles/GA_precincts_simple_2022.json";

  const [dataGeoJSONBase, updateDataGeoJSONBase] = useState();
  useEffect(() => {
    const load = async () => {
      const responseGeo = await fetch(`${import.meta.env.VITE_API_URL_BASE}${geoJSONFile}`);
      if (!responseGeo.ok) {
        console.log("ERROR loading GEO JSON file");
        return;
      }
      const geoJSONBase = await responseGeo.json();
      updateDataGeoJSONBase(geoJSONBase);
    };
    load();
  }, [geoJSONFile]);

  const [dataGeoJSON, updateDataGeoJSON] = useState();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dataPropsOnly, updateDataPropsOnly] = useState();

  useEffect(() => {
    if (!dataGeoJSONBase) return;
    if (!locationResults) return;

    // Merge the values together into a single file
    dataGeoJSONBase.features.forEach((feature) => {
      const votingResultRaw = feature.properties;
      const properties = locationResults.has(votingResultRaw.id) ? locationResults.get(votingResultRaw.id) : {};

      feature.properties = { ...feature.properties, ...properties };
    });
    if (locationResults.size > 0) updateDataGeoJSON({ ...dataGeoJSONBase });

    // For the scatter plot, we just need the center coordinates and not the full geoJSON
    // The simplest way to get that is to just pull it out of the geoJSON
    // It's worth considering splitting these from the geoJSON in the future (i.e. load the data and then merge w/ the geoJSON)
    // That would enable caching of the big geoJSON shape definition since the properties won't change
    const simpleData = dataGeoJSONBase.features.map((feature) => feature.properties);
    updateDataPropsOnly(simpleData);
  }, [dataGeoJSONBase, locationResults]);

  useEffect(() => {
    if (!dataGeoJSONBase) return;
    if (!locationResults) return;

    // Merge the values together into a single file
    dataGeoJSONBase.features.forEach((feature) => {
      const votingResultRaw = feature.properties;
      const properties = locationResults.has(votingResultRaw.id) ? locationResults.get(votingResultRaw.id) : {};

      feature.properties = { ...feature.properties, ...properties };
    });
    if (locationResults.size > 0) updateDataGeoJSON({ ...dataGeoJSONBase });

    // For the scatter plot, we just need the center coordinates and not the full geoJSON
    // The simplest way to get that is to just pull it out of the geoJSON
    // It's worth considering splitting these from the geoJSON in the future (i.e. load the data and then merge w/ the geoJSON)
    // That would enable caching of the big geoJSON shape definition since the properties won't change
    const simpleData = dataGeoJSONBase.features.map((feature) => feature.properties);
    updateDataPropsOnly(simpleData);
  }, [dataGeoJSONBase, locationResults]);

  // ************************************************
  // Define How The Elevation Will Be Calculated
  // ************************************************
  const elevationFunction = useMemo(() => {
    let [elevationMin, elevationMax] = [0, 0];
    switch (elevationApproach) {
      case "none":
        return null;
      case "votes":
        return (f) => f.properties.absenteeCurrent.totalAbsenteeVotes * (isCountyLevel ? 0.2 : 2) || 0;
      case "turnoutAbsSameDay":
        [elevationMin, elevationMax] = quantile(
          [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay),
          isCountyLevel ? [0.0, 1] : [0.05, 0.95],
        );
        return (f) => {
          const value =
            normalizeZeroOne(f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay, elevationMin, elevationMax) *
              (isCountyLevel ? 20000 : 5000) +
              0 || 0;
          return value;
        };
      default:
        [elevationMin, elevationMax] = quantile(
          [...locationResults.values()].map((datapoint) => datapoint?.absenteeBallotComparison?.turnoutAbsenteeBallots),
          isCountyLevel ? [0.0, 1] : [0.05, 0.95],
        );
        return (f) => {
          const value =
            normalizeZeroOne(f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallots, elevationMin, elevationMax) * (isCountyLevel ? 20000 : 5000) + 0 ||
            0;
          return value;
        };
    }
  }, [elevationApproach, isCountyLevel, locationResults]);

  // ************************************************
  // Define How The Color Will Be Calculated
  // ************************************************
  let scaleMin = 0; // thought that this will be used in the legend
  let scaleMax = 1;
  let scaleToColorFunction = null;
  let colorFunction = null;
  switch (colorApproach) {
    case "totalVotesPercent":
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.electionResultsComparison?.totalVotesPercent),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      // console.log(`Min: ${scaleMin}, Max: ${scaleMax}`);
      scaleToColorFunction = d3ScaleChromatic.interpolateGsreens;
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
    case "electionResultPerRepublicanPerShift":
      // scaleMin = isCountyLevel ? -0.15 : -0.15;
      // scaleMax = isCountyLevel ? -0.15 : -0.15;
      // eslint-disable-next-line no-case-declarations
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
      colorFunction = (f) => {
        scaleToColorFunction = COLOR_SCALE_DEM_V_REP;
        const value = f.properties?.electionResultsCurrent?.perDemocratic;
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : color;
      };
  }
  const layerGEO = new GeoJsonLayer({
    id: `geojson_${elevationApproach}_${colorApproach}`,
    pickable: true,
    autoHighlight: true,
    highlightColor: [227, 197, 102],
    data: dataGeoJSON,
    opacity: 0.6,
    stroked: true,
    filled: true,
    onClick: (info) => {
      updateActiveSelection(info.object.properties.id);
    },
    extruded: true,
    wireframe: true,
    getElevation: elevationFunction,
    getFillColor: colorFunction,
    getLineColor: [0, 0, 0, 255],
    lineWidthUnits: "pixels",
    getLineWidth: 5,
    lineWidthMinPixels: 5,
    // material : {
    //   ambient: 0.35,
    //   diffuse: 0.6,
    //   shininess: 32,
    //   specularColor: [30, 30, 30]
    // }
  });

  return layerGEO;
}
