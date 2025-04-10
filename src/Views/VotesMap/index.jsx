import "maplibre-gl/dist/maplibre-gl.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Map, useControl } from "react-map-gl/maplibre";
// import {
//   LightingEffect,
//   AmbientLight,
//   DirectionalLight,
//   _SunLight as SunLight,
// } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";
import { quantile } from "../../Utils.jsx";
import { useElectionData } from "../../context/ElectionDataProvider.jsx";
import MapScale from "./MapScale.jsx";
import { useMapPreference } from "./PreferenceContext.tsx";
import { numberFormat, numberFormatPercent, normalizeZeroOne, normalizeZeroCenterToZeroOne } from "../../Utils";
import boundingBoxesForCounties from "../../VotesMapCountiesBB.json";

function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const NAVIGATION_CONTROL_STYLES = {
  marginTop: 50,
  marginLeft: 10,
  position: "absolute",
};

const COLOR_SCALE = scaleLinear()
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

const convertD3ColorToArray = (color) =>
  color
    .replace("rgb(", "")
    .replace(")", "")
    .split(",")
    .map((val) => parseInt(val, 10));

export default function VotesMap({
  mapStyle = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  updateActiveSelection,
  updateActiveHover,
  isCountyLevel = false,
  updateIsCountyLevel,
  countyFilter,
  initialZoom,
  userHasSetLevel,
}) {
  const mapRef = useRef();
  const { locationResults } = useElectionData();
  const { elevationApproach, colorApproach } = useMapPreference();

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

  // ************************************************
  // Calc the initial map state
  // ************************************************
  const INITIAL_VIEW_STATE = useMemo(() => {
    // chance the bearing and pitch based upon the elevation approach (i.e. make it straight up vs. 3D)
    const initialPitch = elevationApproach === "none" ? 0 : 45;
    const initialBearing = elevationApproach === "none" ? 0 : 350;

    // Change the zoom level based upon the size of the viewport
    const sizeParam = "none";
    const boundingBox = boundingBoxesForCounties[countyFilter || "STATE"];

    const backupZoom = countyFilter ? 10 : sizeParam === "small" || sizeParam === "small…" ? 5 : 6.7;
    const backupLatLong = { latitude: 32.7, longitude: -82.5641 };
    const viewState = {
      bounds: boundingBox,
      fitBoundsOptions: { maxZoom: 12, padding: { left: 10, right: 10, bottom: 100, top: 10 } },
      ...backupLatLong,
      zoom: backupZoom,
      minZoom: 5,
      maxZoom: 20,
      pitch: initialPitch,
      bearing: initialBearing,
    };
    return viewState;
  }, []);

  // ************************************************
  // Adjust map on setting changes
  // ************************************************
  // Adjust pitch and bearing when changing the elevation approach to none
  // TODO - think through how to best adjust back on change
  useEffect(() => {
    if (mapRef && mapRef.current && elevationApproach === "none") {
      mapRef.current.flyTo({ pitch: 0, bearing: 0 });
    }
  }, [elevationApproach]);

  useEffect(() => {
    if (mapRef && mapRef.current && countyFilter) {
      const map = mapRef.current;
      map.fitBounds(boundingBoxesForCounties[countyFilter || "STATE"], { bearing: map.getBearing() });
    }
  }, [countyFilter]);

  // ************************************************
  // Manage the zoom level
  // ************************************************

  const [currentZoomLevel, updateCurrentZoomLevel] = useState(initialZoom);
  const transitionZoom = 8;
  const updateZoomLevel = (viewState) => {
    updateCurrentZoomLevel(viewState.zoom);

    // If the user zooms in and hasn't set that they're at precinct or county level, automatically change it
    if (!userHasSetLevel) updateIsCountyLevel(viewState.zoom <= transitionZoom);
  };

  // TODO - think through scale strategy; don't want to be deceptive when you switch between county and precinct level but you also do have more variation between those

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
        scaleToColorFunction = COLOR_SCALE;
        const value = f.properties?.electionResultsCurrent?.perDemocratic;
        const color = scaleToColorFunction(value);
        return !value && value !== 0 ? [0, 0, 0, 255] : color;
      };
  }

  // ************************************************
  // Lighting Effects for 3d World
  // ************************************************
  // const [effects] = useState(() => {
  //   const ambientLight = new AmbientLight({
  //     color: [255, 255, 255],
  //     intensity: 1.0,
  //   });

  //   const dirLight = new SunLight({
  //     timestamp: Date.UTC(2022, 11, 8, 18),
  //     color: [255, 255, 255],
  //     intensity: 1.75,
  //     _shadow: true,
  //   });

  //   const directionalLight = new DirectionalLight({
  //     color: [255, 255, 255],
  //     intensity: 1.0,
  //     direction: [-3, -9, -1]
  //   });
  //   const lightingEffect = new LightingEffect({ ambientLight, directionalLight });
  //   lightingEffect.shadowColor = [0, 0, 0, 0.1];
  //   return [lightingEffect];
  // });

  // ************************************************
  // Layers on the Map
  // ************************************************
  const layers = [];
  if (colorApproach === "electionResultVoteShift" || colorApproach === "electionResultVoteMargin" || colorApproach === "electionResultVoteShiftNormalized") {
    let attributeForComparison = null;
    switch (colorApproach) {
      case "electionResultVoteShift":
        attributeForComparison = "voteShiftDemocratic";
        break;
      case "electionResultVoteShiftNormalized":
        attributeForComparison = "voteShiftDemocraticNormalized";
        break;
      default:
        attributeForComparison = "marginDemocratic";
        break;
    }

    const showSecondaryColor = false;
    const circleOpacity = showSecondaryColor ? 255 : 128;

    const layerDot = new ScatterplotLayer({
      id: `scatter_${colorApproach}`,
      data: dataPropsOnly,
      pickable: false,
      opacity: 1,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 1,
      radiusMaxPixels: 10000,
      lineWidthMinPixels: isCountyLevel ? 2 : 1,
      getPosition: (f) => f.centroid,
      getRadius: (f) =>
        Math.sqrt(
          Math.abs(
            colorApproach === "electionResultVoteMargin"
              ? f?.electionResultsCurrent
                ? f?.electionResultsCurrent[attributeForComparison]
                : 0
              : f?.electionResultsComparison
                ? f?.electionResultsComparison[attributeForComparison]
                : 0,
          ),
        ) *
        (isCountyLevel ? 4 : 1.5) *
        (colorApproach === "electionResultVoteMargin" ? 1 : 2),
      getFillColor: (f) =>
        (colorApproach === "electionResultVoteMargin"
          ? f?.electionResultsCurrent
            ? f?.electionResultsCurrent[attributeForComparison]
            : 0
          : f?.electionResultsComparison
            ? f?.electionResultsComparison[attributeForComparison]
            : 0) < 0
          ? [170, 57, 57, circleOpacity]
          : [17, 62, 103, circleOpacity],
      getLineColor: (f) =>
        (colorApproach === "electionResultVoteMargin"
          ? f?.electionResultsCurrent
            ? f?.electionResultsCurrent[attributeForComparison]
            : 0
          : f?.electionResultsComparison
            ? f?.electionResultsComparison[attributeForComparison]
            : 0) < 0
          ? [170, 57, 57, circleOpacity + 120]
          : [17, 62, 103, circleOpacity + 120],
      lineWidthPixels: isCountyLevel ? 5 : 1,
    });

    if (dataGeoJSON && showSecondaryColor) {
      [scaleMin, scaleMax] = quantile(
        [...locationResults.values()].map((datapoint) => datapoint?.demographics?.blackPer),
        isCountyLevel ? [0.01, 0.99] : [0.02, 0.98],
      );
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(f.properties?.demographics?.blackPer, scaleMin, scaleMax);
        const color = scaleToColorFunction(value);
        return convertD3ColorToArray(color);
      };
    }

    const layerGEO = new GeoJsonLayer({
      id: `geojson_${colorApproach}`,
      pickable: true,
      autoHighlight: true,
      highlightColor: [227, 197, 102],
      data: dataGeoJSON,
      opacity: showSecondaryColor ? 0.2 : 1,
      stroked: true,
      filled: true,
      onClick: (info) => {
        updateActiveSelection(info.object.properties.id);
      },
      getFillColor: showSecondaryColor ? colorFunction : [158, 158, 158, 0],
      getLineColor: [40, 40, 40],
      getLineWidth: 1,
      lineWidthMinPixels: isCountyLevel ? 1 : 1,
    });
    layers.push(layerGEO);
    layers.push(layerDot);
  } else {
    // only needed when using shadows - a plane for shadows to drop on
    const layer = new GeoJsonLayer({
      id: `geojson_${elevationApproach}_${colorApproach}_${currentZoomLevel}`,
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
    layers.push(layer);
  }

  // console.log( `geojson_${colorApproach}_${absenteeElectionBaseID}_${absenteeElectionCurrentID}_${resultsElectionRaceCurrentID}_${resultsElectionRacePerviousID}`);
  const getTooltip = ({ object }) => {
    if (!object) {
      updateActiveHover(object);
      return;
    }
    if (object.properties) updateActiveHover(object.properties.id);
    const lookup = object.properties ? object.properties : object;
    if (lookup[colorApproach] || lookup[elevationApproach])
      return {
        html: `\
      <div>Color: ${
        colorApproach === "electionResultVoteShift" ? numberFormat.format(lookup[colorApproach]) : numberFormatPercent.format(lookup[colorApproach])
      }</div>
      ${
        elevationApproach !== "none" && lookup[elevationApproach]
          ? `<div>Height: 
        ${numberFormat.format(lookup[elevationApproach])}
      </div>`
          : "<span></span>"
      }
  `,
      };
  };

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        reuseMap
        mapStyle={mapStyle}
        ref={mapRef}
        onViewStateChange={(viewport) => updateZoomLevel(viewport.viewState)}
      >
        <DeckGLOverlay
          layers={layers}
          // effects={effects}
          controller={true}
          getTooltip={getTooltip}
        >
          <div style={NAVIGATION_CONTROL_STYLES}>{/* <NavigationControl /> */}</div>
          {scaleToColorFunction && <MapScale scaleToColorFunction={scaleToColorFunction} scaleMin={scaleMin} scaleMax={scaleMax} />}
        </DeckGLOverlay>
      </Map>
    </div>
  );
}
