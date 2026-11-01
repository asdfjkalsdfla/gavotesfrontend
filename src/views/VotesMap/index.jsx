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
import {
  createElevationFunction,
  createColorFunction,
  processGeoJSONData,
  extractSimpleData,
  getTurnoutSameDayStats,
} from "./mapUtils.js";
import { createMapLayers, shouldUseScatterPlot } from "./layerUtils.js";
import { createMapTooltip } from "./tooltipUtils.js";

setWorkerUrl(workerUrl);

// Calibrated cartographic lighting: overhead-angled key light keeps horizontal top caps
// bright and true to legend colors while vertical side walls are cleanly shaded for 3D depth
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 0.56,
});

const dirLight = new DirectionalLight({
  color: [255, 253, 250],
  intensity: 0.88,
  direction: [-0.25, -0.35, -1.0],
});

// Neutral soft fill light from the opposite side prevents deep shadows without tinting red counties purple
const fillLight = new DirectionalLight({
  color: [238, 242, 248],
  intensity: 0.28,
  direction: [0.6, 0.5, -0.3],
});

const lightingEffect = new LightingEffect({ ambientLight, dirLight, fillLight });

function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const PERSPECTIVE_3D = {
  pitch: 42,
  bearing: 352,
};

const PERSPECTIVE_2D = {
  pitch: 0,
  bearing: 0,
};

const HEIGHT_SCALE_OPTIONS = [
  { label: "0.5×", value: 0.5, title: "Compact height (reduces overlap)" },
  { label: "1×", value: 1, title: "Standard 3D height" },
  { label: "1.5×", value: 1.5, title: "Exaggerated 3D height" },
];

export default function VotesMap({
  mapStyle = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
  activeSelection,
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
  const {
    elevationApproach,
    colorApproach,
    updateColorApproach,
    turnoutFilter: contextTurnoutFilter,
    updateTurnoutFilter: contextUpdateTurnoutFilter,
  } = useMapPreference();
  const [localTurnoutFilter, setLocalTurnoutFilter] = useState({
    enabled: false,
    operator: "gte",
    threshold: 1.0,
  });
  const turnoutFilter = contextTurnoutFilter ?? localTurnoutFilter;
  const updateTurnoutFilter = contextUpdateTurnoutFilter ?? setLocalTurnoutFilter;
  const [userPrefersFlat, setUserPrefersFlat] = useState(false);
  const [heightScaleMultiplier, setHeightScaleMultiplier] = useState(1);
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
        padding: { left: 28, right: 28, bottom: 64, top: is3D ? 56 : 24 },
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

  const rotateCamera = (deltaBearing) => {
    const map = mapRef.current;
    if (!map) return;
    const currentBearing = map.getBearing ? map.getBearing() : PERSPECTIVE_3D.bearing;
    const currentPitch = map.getPitch ? map.getPitch() : PERSPECTIVE_3D.pitch;
    map.easeTo({
      bearing: (currentBearing + deltaBearing + 360) % 360,
      pitch: Math.max(currentPitch, PERSPECTIVE_3D.pitch),
      duration: 350,
    });
  };

  const resetCameraView = () => {
    const map = mapRef.current;
    if (!map) return;
    const target = is3DMode ? PERSPECTIVE_3D : PERSPECTIVE_2D;
    const bounds = boundingBoxesForCounties[countyFilter || "STATE"];
    if (bounds && map.fitBounds) {
      map.fitBounds(bounds, {
        bearing: target.bearing,
        pitch: target.pitch,
        padding: { left: 28, right: 28, bottom: 64, top: is3DMode ? 56 : 24 },
        duration: 600,
      });
    } else {
      map.flyTo({ ...target, duration: 600 });
    }
  };

  const onMapLoad = (event) => {
    const map = event?.target || mapRef.current;
    if (!map) return;
    const target = is3DMode ? PERSPECTIVE_3D : PERSPECTIVE_2D;
    map.setPitch(target.pitch);
    map.setBearing(target.bearing);
  };

  const prevCountyFilterRef = useRef(countyFilter);
  useEffect(() => {
    if (mapRef && mapRef.current && (countyFilter || prevCountyFilterRef.current !== countyFilter)) {
      prevCountyFilterRef.current = countyFilter;
      const map = mapRef.current;
      const target = is3DMode ? PERSPECTIVE_3D : PERSPECTIVE_2D;
      map.fitBounds(boundingBoxesForCounties[countyFilter || "STATE"], {
        bearing: target.bearing,
        pitch: target.pitch,
        padding: { left: 28, right: 28, bottom: 64, top: is3DMode ? 56 : 24 },
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
    () => createElevationFunction(elevationApproach, isCountyLevel, locationResults, heightScaleMultiplier),
    [elevationApproach, isCountyLevel, locationResults, heightScaleMultiplier],
  );

  // ************************************************
  // Define How The Color Will Be Calculated
  // ************************************************
  const { colorFunction, scaleToColorFunction, scaleMin, scaleMax } = useMemo(
    () => createColorFunction(colorApproach, isCountyLevel, locationResults),
    [colorApproach, isCountyLevel, locationResults],
  );

  // ************************************************
  // Calculate Same-Day Turnout Filter Stats
  // ************************************************
  const turnoutStats = useMemo(
    () => getTurnoutSameDayStats(locationResults, turnoutFilter, isCountyLevel),
    [locationResults, turnoutFilter, isCountyLevel],
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
      activeSelection,
      turnoutFilter,
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
    activeSelection,
    turnoutFilter,
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
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "#475569",
          fontSize: 14,
        }}
      >
        <style>{`@keyframes votesMapSpin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "3px solid #cbd5e1",
            borderTopColor: "#3b6fb6",
            animation: "votesMapSpin 0.8s linear infinite",
          }}
        />
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
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={togglePerspective}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.16)";
            }}
            style={{
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(10px) saturate(160%)",
              WebkitBackdropFilter: "blur(10px) saturate(160%)",
              color: "#1e293b",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.16)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              userSelect: "none",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            title={
              is3DMode
                ? "Click for 2D flat view (colors will display turnout)"
                : "Click for 3D perspective view (height displays turnout)"
            }
          >
            <span>{is3DMode ? "3D Perspective" : "2D Flat"}</span>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>
              ({is3DMode ? `${PERSPECTIVE_3D.pitch}°` : "0°"})
            </span>
          </button>

          {is3DMode && (
            <>
              {/* Height Scale Selector */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "3px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(10px) saturate(160%)",
                  WebkitBackdropFilter: "blur(10px) saturate(160%)",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.14)",
                  fontSize: "11px",
                  userSelect: "none",
                }}
                title="Adjust 3D column height scale"
              >
                <span style={{ padding: "0 7px 0 8px", color: "#64748b", fontWeight: 500 }}>Height</span>
                {HEIGHT_SCALE_OPTIONS.map((opt) => {
                  const isActive = heightScaleMultiplier === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHeightScaleMultiplier(opt.value)}
                      title={opt.title}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: isActive ? 600 : 500,
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: isActive ? "#1e293b" : "transparent",
                        color: isActive ? "#ffffff" : "#475569",
                        transition: "background-color 0.15s ease, color 0.15s ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Camera Orbit & Reset Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "3px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(10px) saturate(160%)",
                  WebkitBackdropFilter: "blur(10px) saturate(160%)",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.14)",
                  userSelect: "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => rotateCamera(-30)}
                  title="Rotate map counter-clockwise (or right-click + drag)"
                  style={{
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: "none",
                    background: "transparent",
                    color: "#334155",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={() => rotateCamera(30)}
                  title="Rotate map clockwise (or right-click + drag)"
                  style={{
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: "none",
                    background: "transparent",
                    color: "#334155",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ↻
                </button>
                <button
                  type="button"
                  onClick={resetCameraView}
                  title="Reset camera angle and zoom"
                  style={{
                    padding: "4px 9px",
                    borderRadius: "999px",
                    border: "none",
                    background: "transparent",
                    color: "#475569",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
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
      {(scaleToColorFunction || isScatterPlot || (is3DMode && !isScatterPlot && elevationApproach !== "none") || turnoutFilter?.enabled) && (
        <MapScale
          scaleToColorFunction={scaleToColorFunction}
          scaleMin={scaleMin}
          scaleMax={scaleMax}
          colorApproach={colorApproach}
          elevationMin={elevationMin}
          elevationMax={elevationMax}
          elevationApproach={is3DMode && !isScatterPlot ? elevationApproach : "none"}
          turnoutFilter={turnoutFilter}
          onTurnoutFilterChange={updateTurnoutFilter}
          turnoutStats={turnoutStats}
          isCountyLevel={isCountyLevel}
        />
      )}
    </div>
  );
}
