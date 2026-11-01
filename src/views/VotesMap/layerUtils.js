import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";

// Constants for layer styling
const LAYER_STYLES = {
  HIGHLIGHT_COLOR: [255, 248, 196, 85],
  BORDER_COLOR: [40, 40, 40],
  TRANSPARENT_FILL: [158, 158, 158, 0],
  DEMOCRATIC_COLOR: [17, 62, 103],
  REPUBLICAN_COLOR: [170, 57, 57],
  BLACK_BORDER: [0, 0, 0, 255],
  SELECTED_BORDER_COLOR: [250, 204, 21, 255],
};

// Election result color approaches that use scatter plot visualization
const SCATTER_PLOT_APPROACHES = ["electionResultVoteShift", "electionResultVoteMargin", "electionResultVoteShiftNormalized"];

// Attribute mapping for different color approaches
const ATTRIBUTE_MAPPING = {
  electionResultVoteShift: "voteShiftDemocratic",
  electionResultVoteShiftNormalized: "voteShiftDemocraticNormalized",
  electionResultVoteMargin: "marginDemocratic",
};

/**
 * Creates a scatter plot layer for election result visualizations
 */
export const createScatterPlotLayer = ({ colorApproach, dataPropsOnly, isCountyLevel, circleOpacity = 128 }) => {
  const attributeForComparison = ATTRIBUTE_MAPPING[colorApproach];
  const isVoteMargin = colorApproach === "electionResultVoteMargin";

  const getValue = (f) => {
    if (isVoteMargin) {
      return f?.electionResultsCurrent?.[attributeForComparison] || 0;
    }
    return f?.electionResultsComparison?.[attributeForComparison] || 0;
  };

  const getColor = (value) => {
    return value < 0 ? [...LAYER_STYLES.REPUBLICAN_COLOR, circleOpacity] : [...LAYER_STYLES.DEMOCRATIC_COLOR, circleOpacity];
  };

  const getLineColor = (value) => {
    return value < 0 ? [...LAYER_STYLES.REPUBLICAN_COLOR, circleOpacity + 120] : [...LAYER_STYLES.DEMOCRATIC_COLOR, circleOpacity + 120];
  };

  return new ScatterplotLayer({
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
    getRadius: (f) => {
      const value = getValue(f);
      const baseRadius = Math.sqrt(Math.abs(value));
      const levelMultiplier = isCountyLevel ? 4 : 1.5;
      const approachMultiplier = isVoteMargin ? 1 : 2;
      return baseRadius * levelMultiplier * approachMultiplier;
    },
    getFillColor: (f) => getColor(getValue(f)),
    getLineColor: (f) => getLineColor(getValue(f)),
    lineWidthPixels: isCountyLevel ? 5 : 1,
    updateTriggers: {
      getRadius: [colorApproach, dataPropsOnly, isCountyLevel],
      getFillColor: [colorApproach, dataPropsOnly],
      getLineColor: [colorApproach, dataPropsOnly],
    },
  });
};

/**
 * Creates a GeoJSON layer for election result visualizations
 */
export const createElectionResultGeoLayer = ({
  colorApproach,
  dataGeoJSON,
  updateActiveSelection,
  showSecondaryColor = false,
  colorFunction,
  isCountyLevel,
}) => {
  return new GeoJsonLayer({
    id: `geojson_${colorApproach}`,
    pickable: true,
    autoHighlight: true,
    highlightColor: LAYER_STYLES.HIGHLIGHT_COLOR,
    data: dataGeoJSON,
    opacity: showSecondaryColor ? 0.2 : 1,
    stroked: true,
    filled: true,
    onClick: (info) => {
      updateActiveSelection(info.object.properties.id);
    },
    getFillColor: showSecondaryColor ? colorFunction : LAYER_STYLES.TRANSPARENT_FILL,
    getLineColor: LAYER_STYLES.BORDER_COLOR,
    getLineWidth: 1,
    lineWidthMinPixels: isCountyLevel ? 1 : 1,
  });
};

/**
 * Creates a standard GeoJSON layer with elevation and color functions
 */
export const createStandardGeoLayer = ({
  elevationApproach,
  colorApproach,
  dataGeoJSON,
  updateActiveSelection,
  elevationFunction,
  colorFunction,
  is3DMode = true,
  isCountyLevel = false,
}) => {
  const isExtruded = Boolean(is3DMode && elevationApproach !== "none");

  return new GeoJsonLayer({
    id: `geojson_${elevationApproach}_${colorApproach}_${isExtruded ? "3d" : "2d"}`,
    pickable: true,
    autoHighlight: true,
    highlightColor: LAYER_STYLES.HIGHLIGHT_COLOR,
    data: dataGeoJSON,
    opacity: isExtruded ? 1 : isCountyLevel ? 0.88 : 0.65,
    stroked: true,
    filled: true,
    onClick: (info) => {
      if (info?.object?.properties?.id) {
        updateActiveSelection(info.object.properties.id);
      }
    },
    extruded: isExtruded,
    wireframe: isExtruded,
    material: isExtruded
      ? {
          ambient: 0.56,
          diffuse: 0.62,
          shininess: 24,
          specularColor: [38, 38, 38],
        }
      : null,
    getElevation: isExtruded ? elevationFunction : 0,
    getFillColor: colorFunction,
    getLineColor: isExtruded
      ? [20, 25, 35, 220]
      : isCountyLevel
        ? [255, 255, 255, 210]
        : [60, 60, 60, 160],
    lineWidthUnits: "pixels",
    getLineWidth: isExtruded ? 2 : 1,
    lineWidthMinPixels: isExtruded ? 1.5 : 1,
    transitions: {
      getElevation: { duration: 600, easing: (t) => 1 - Math.pow(1 - t, 3) },
      getFillColor: { duration: 400 },
    },
    updateTriggers: {
      getElevation: [isExtruded, elevationFunction, elevationApproach, dataGeoJSON],
      getFillColor: [colorFunction, colorApproach, dataGeoJSON],
    },
  });
};

/**
 * Creates a highlight outline layer for the currently selected county/precinct
 */
export const createSelectionHighlightLayer = ({
  dataGeoJSON,
  activeSelection,
  elevationFunction,
  elevationApproach,
  is3DMode = true,
}) => {
  if (!activeSelection || !dataGeoJSON?.features) return null;
  const selectedFeatures = dataGeoJSON.features.filter(
    (f) => String(f.properties?.id) === String(activeSelection),
  );
  if (selectedFeatures.length === 0) return null;

  const isExtruded = Boolean(is3DMode && elevationApproach !== "none");

  return new GeoJsonLayer({
    id: `selection_highlight_${activeSelection}_${isExtruded ? "3d" : "2d"}`,
    pickable: false,
    data: { type: "FeatureCollection", features: selectedFeatures },
    stroked: true,
    filled: isExtruded,
    extruded: isExtruded,
    wireframe: isExtruded,
    getElevation: isExtruded && elevationFunction ? (f) => elevationFunction(f) + 80 : 0,
    getFillColor: [250, 204, 21, 35],
    getLineColor: LAYER_STYLES.SELECTED_BORDER_COLOR,
    lineWidthUnits: "pixels",
    getLineWidth: 3,
    lineWidthMinPixels: 2.5,
    updateTriggers: {
      getElevation: [isExtruded, elevationFunction, activeSelection],
    },
  });
};

/**
 * Determines if the current color approach should use scatter plot visualization
 */
export const shouldUseScatterPlot = (colorApproach) => {
  return SCATTER_PLOT_APPROACHES.includes(colorApproach);
};

/**
 * Creates all layers for the map based on current configuration
 */
export const createMapLayers = ({
  colorApproach,
  elevationApproach,
  dataGeoJSON,
  dataPropsOnly,
  updateActiveSelection,
  elevationFunction,
  colorFunction,
  isCountyLevel,
  is3DMode = true,
  activeSelection = null,
}) => {
  const layers = [];

  if (shouldUseScatterPlot(colorApproach)) {
    // Create scatter plot visualization for election results
    const scatterLayer = createScatterPlotLayer({
      colorApproach,
      dataPropsOnly,
      isCountyLevel,
    });

    const geoLayer = createElectionResultGeoLayer({
      colorApproach,
      dataGeoJSON,
      updateActiveSelection,
      colorFunction,
      isCountyLevel,
    });

    layers.push(geoLayer, scatterLayer);
  } else {
    // Create standard elevation-based visualization
    const standardLayer = createStandardGeoLayer({
      elevationApproach,
      colorApproach,
      dataGeoJSON,
      updateActiveSelection,
      elevationFunction,
      colorFunction,
      isCountyLevel,
      is3DMode,
    });

    layers.push(standardLayer);

    const selectionLayer = createSelectionHighlightLayer({
      dataGeoJSON,
      activeSelection,
      elevationFunction,
      elevationApproach,
      is3DMode,
    });
    if (selectionLayer) {
      layers.push(selectionLayer);
    }
  }

  return layers;
};
