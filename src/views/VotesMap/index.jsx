import "maplibre-gl/dist/maplibre-gl.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Map, useControl } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import {
  LightingEffect,
  AmbientLight,
  DirectionalLight,
} from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useElectionData } from "../../context/ElectionDataProvider.tsx";
import { useGeoJSON } from "../../hooks/useGeoJSON.js";
import MapScale from "./MapScale.jsx";
import { useMapPreference } from "./PreferenceContext.tsx";
import boundingBoxesForCounties from "../../VotesMapCountiesBB.json";
import { createElevationFunction, createColorFunction, processGeoJSONData, extractSimpleData } from "./mapUtils.js";
import { createMapLayers, shouldUseScatterPlot } from "./layerUtils.js";
import { createMapTooltip } from "./tooltipUtils.js";

setWorkerUrl(workerUrl);

// Calibrated cartographic lighting: soft ambient and directional key light from upper-left
// Shaded side walls provide essential 3D depth and contrast while preserving rich color saturation
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 0.45,
});

const dirLight = new DirectionalLight({
  color: [255, 255, 255],
  intensity: 0.95,
  direction: [-0.7, -0.8, -1.5],
});

const lightingEffect = new LightingEffect({ ambientLight, dirLight });

function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const PERSPECTIVE_3D = {
  pitch: 46,
  bearing: 350,
};

const PERSPECTIVE_2D = {
  pitch: 0,
  bearing: 0,
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
  const { elevationApproach, colorApproach, updateColorApproach } = useMapPreference();
  const [userPrefersFlat, setUserPrefersFlat] = useState(false);
  const is3DMode = elevationApproach !== "none" && !userPrefersFlat;

  // Track the user's 3D color preference so it can be restored when returning to 3D
  const last3DColorRef = useRef(
    colorApproach !== elevationApproach ? colorApproach : "electionResultPerRepublicanPer",
  );

  // When user is in 3D mode and selects a color distinct from the elevation metric, remember it
  useEffect(() => {
    if (is3DMode && colorApproach !== elevationApproach && elevationApproach !== "none") {
      last3DColorRef.current = colorApproach;
    }
  }, [colorApproach, elevationApproach, is3DMode]);

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

  const dataGeoJSON = useMemo(() => {
    if (!dataGeoJSONBase || !locationResults) return undefined;
    return processGeoJSONData(dataGeoJSONBase, locationResults);
  }, [dataGeoJSONBase, locationResults]);

  const dataPropsOnly = useMemo(() => {
    if (!dataGeoJSON) return undefined;
    return extractSimpleData(dataGeoJSON);
  }, [dataGeoJSON]);

  // ************************************************
  // Calc the initial map state
  // ************************************************
  const INITIAL_VIEW_STATE = useMemo(() => {
    const is3D = elevationApproach !== "none";
    const initialPitch = is3D ? PERSPECTIVE_3D.pitch : PERSPECTIVE_2D.pitch;
    const initialBearing = is3D ? PERSPECTIVE_3D.bearing : PERSPECTIVE_2D.bearing;

    // Change the zoom level based upon the size of the viewport
    const sizeParam = "none";
    const boundingBox = boundingBoxesForCounties[countyFilter || "STATE"];

    const backupZoom = countyFilter ? 10 : sizeParam === "small" || sizeParam === "small…" ? 5 : 6.7;
    const backupLatLong = { latitude: 32.7, longitude: -82.5641 };
    const viewState = {
      bounds: boundingBox,
      fitBoundsOptions: {
        maxZoom: 12,
        padding: { left: 20, right: 20, bottom: 60, top: 20 },
        pitch: initialPitch,
        bearing: initialBearing,
      },
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
  // Adjust pitch and bearing when changing the elevation approach
  useEffect(() => {
    if (mapRef && mapRef.current) {
      if (elevationApproach === "none") {
        mapRef.current.flyTo({ ...PERSPECTIVE_2D, duration: 800 });
      } else if (!userPrefersFlat) {
        const pitch = mapRef.current.getPitch ? mapRef.current.getPitch() : 0;
        if (pitch < 15) {
          mapRef.current.flyTo({ ...PERSPECTIVE_3D, duration: 800 });
        }
      }
    }
  }, [elevationApproach, userPrefersFlat]);

  const togglePerspective = () => {
    if (!mapRef.current) return;
    if (is3DMode) {
      // Switching to 2D: remember 3D color and switch color to the height/turnout metric
      mapRef.current.flyTo({ ...PERSPECTIVE_2D, duration: 600 });
      setUserPrefersFlat(true);
      if (elevationApproach !== "none" && elevationApproach !== colorApproach) {
        last3DColorRef.current = colorApproach;
        if (updateColorApproach) {
          updateColorApproach(elevationApproach);
        }
      }
    } else {
      // Switching to 3D: restore previous 3D color (e.g. Vote Share)
      mapRef.current.flyTo({ ...PERSPECTIVE_3D, duration: 600 });
      setUserPrefersFlat(false);
      if (elevationApproach !== "none" && colorApproach === elevationApproach) {
        const restoreColor = last3DColorRef.current || "electionResultPerRepublicanPer";
        if (updateColorApproach) {
          updateColorApproach(restoreColor);
        }
      }
    }
  };

  const onMapLoad = (event) => {
    const map = event?.target || mapRef.current;
    if (!map) return;
    const target = is3DMode ? PERSPECTIVE_3D : PERSPECTIVE_2D;
    map.setPitch(target.pitch);
    map.setBearing(target.bearing);
  };

  useEffect(() => {
    if (mapRef && mapRef.current && countyFilter) {
      const map = mapRef.current;
      const target = is3DMode ? PERSPECTIVE_3D : PERSPECTIVE_2D;
      map.fitBounds(boundingBoxesForCounties[countyFilter || "STATE"], {
        bearing: target.bearing,
        pitch: target.pitch,
      });
    }
  }, [countyFilter, is3DMode]);

  // ************************************************
  // Manage the zoom level
  // ************************************************
  const [currentZoomLevel, updateCurrentZoomLevel] = useState(initialZoom);
  const transitionZoom = 8;
  const updateZoomLevel = (viewState) => {
    updateCurrentZoomLevel(viewState.zoom);
    if (typeof viewState.pitch === "number") {
      setUserPrefersFlat(viewState.pitch <= 15);
    }

    // If the user zooms in and hasn't set that they're at precinct or county level, automatically change it
    if (!userHasSetLevel) updateIsCountyLevel(viewState.zoom <= transitionZoom);
  };

  // TODO - think through scale strategy; don't want to be deceptive when you switch between county and precinct level but you also do have more variation between those

  // ************************************************
  // Define How The Elevation Will Be Calculated
  // ************************************************
  const { elevationFunction, elevationMin, elevationMax } = useMemo(
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
      is3DMode,
    });
  }, [
    colorApproach,
    elevationApproach,
    currentZoomLevel,
    dataGeoJSON,
    dataPropsOnly,
    updateActiveSelection,
    elevationFunction,
    colorFunction,
    isCountyLevel,
    is3DMode,
  ]);

  const effects = useMemo(() => {
    return is3DMode && elevationApproach !== "none" ? [lightingEffect] : [];
  }, [is3DMode, elevationApproach]);

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

  const isScatterPlot = shouldUseScatterPlot(colorApproach);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {elevationApproach !== "none" && !isScatterPlot && (
        <button
          type="button"
          onClick={togglePerspective}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 10,
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            color: "#1e293b",
            border: "1px solid #cbd5e1",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            userSelect: "none",
          }}
          title={is3DMode ? "Click for 2D flat view (colors will display turnout)" : "Click for 3D perspective view (height displays turnout)"}
        >
          <span>{is3DMode ? "3D Perspective" : "2D Flat"}</span>
          <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 400 }}>({is3DMode ? "46°" : "0°"})</span>
        </button>
      )}
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        reuseMap
        mapStyle={mapStyle}
        ref={mapRef}
        onLoad={onMapLoad}
        onViewStateChange={(viewport) => updateZoomLevel(viewport.viewState)}
      >
        <DeckGLOverlay
          layers={layers}
          effects={effects}
          controller={true}
          getTooltip={getTooltip}
        />
      </Map>
      {(scaleToColorFunction || isScatterPlot || (is3DMode && !isScatterPlot && elevationApproach !== "none")) && (
        <MapScale
          scaleToColorFunction={scaleToColorFunction}
          scaleMin={scaleMin}
          scaleMax={scaleMax}
          colorApproach={colorApproach}
          elevationMin={elevationMin}
          elevationMax={elevationMax}
          elevationApproach={is3DMode && !isScatterPlot ? elevationApproach : "none"}
        />
      )}
    </div>
  );
}
