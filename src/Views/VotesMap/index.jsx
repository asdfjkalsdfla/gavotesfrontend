import "maplibre-gl/dist/maplibre-gl.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Map as MapGL, useControl } from "react-map-gl/maplibre";
// import {
//   LightingEffect,
//   AmbientLight,
//   DirectionalLight,
//   _SunLight as SunLight,
// } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useElectionData } from "../../context/ElectionDataProvider.jsx";
import { useGeoJSON } from "../../hooks/useGeoJSON.js";
import MapScale from "./MapScale.jsx";
import { useMapPreference } from "./PreferenceContext.tsx";
import boundingBoxesForCounties from "../../VotesMapCountiesBB.json";
import { createElevationFunction, createColorFunction, processGeoJSONData, extractSimpleData } from "./mapUtils.js";
import { createMapLayers } from "./layerUtils.js";
import { createMapTooltip } from "./tooltipUtils.js";

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

export default function VotesMap({
  mapStyle = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  updateActiveSelection,
  updateActiveHover,
  isCountyLevel = false,
  countyFilter,
  updateIsCountyLevel,
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

  // Use React Query to fetch and cache GeoJSON data
  const { data: dataGeoJSONBase, isLoading: isLoadingGeoJSON, error: geoJSONError } = useGeoJSON(geoJSONFile);

  const [dataGeoJSON, updateDataGeoJSON] = useState();
  const [dataPropsOnly, updateDataPropsOnly] = useState();

  useEffect(() => {
    if (!dataGeoJSONBase || !locationResults) return;

    const processedData = processGeoJSONData(dataGeoJSONBase, locationResults);
    if (processedData) {
      updateDataGeoJSON(processedData);
      const simpleData = extractSimpleData(dataGeoJSONBase);
      updateDataPropsOnly(simpleData);
    }
  }, [dataGeoJSONBase, locationResults]);

  // ************************************************
  // Calc the initial map state
  // ************************************************
  const INITIAL_VIEW_STATE = useMemo(() => {
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
  }, [countyFilter, elevationApproach]);

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
  const elevationFunction = useMemo(
    () => createElevationFunction(elevationApproach, isCountyLevel, locationResults),
    [elevationApproach, isCountyLevel, locationResults],
  );

  // ************************************************
  // Define How The Color Will Be Calculated
  // ************************************************
  const { colorFunction, scaleToColorFunction, scaleMin, scaleMax } = useMemo(
    () => createColorFunction(colorApproach, isCountyLevel, locationResults),
    [colorApproach, isCountyLevel, locationResults],
  );

  // ************************************************
  // Layers on the Map
  // ************************************************
  const layers = useMemo(() => {
    return createMapLayers({
      colorApproach,
      elevationApproach,
      currentZoomLevel,
      dataGeoJSON,
      dataPropsOnly,
      updateActiveSelection,
      elevationFunction,
      colorFunction,
      isCountyLevel,
    });
  }, [colorApproach, elevationApproach, currentZoomLevel, dataGeoJSON, dataPropsOnly, updateActiveSelection, elevationFunction, colorFunction, isCountyLevel]);

  const getTooltip = ({ object }) => {
    return createMapTooltip({
      object,
      colorApproach,
      elevationApproach,
      updateActiveHover,
    });
  };

  // Show loading state
  if (isLoadingGeoJSON) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Loading map data...</div>
      </div>
    );
  }

  // Show error state
  if (geoJSONError) {
    const errorMessage = geoJSONError?.message || geoJSONError?.toString() || "Unknown error occurred";
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Error loading map data: {errorMessage}</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapGL
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
      </MapGL>
    </div>
  );
}
