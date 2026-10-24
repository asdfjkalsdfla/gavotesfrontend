import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";

// Constants for layer styling
const LAYER_STYLES = {
  HIGHLIGHT_COLOR: [227, 197, 102],
  BORDER_COLOR: [40, 40, 40],
  TRANSPARENT_FILL: [158, 158, 158, 0],
  DEMOCRATIC_COLOR: [17, 62, 103],
  REPUBLICAN_COLOR: [170, 57, 57],
  BLACK_BORDER: [0, 0, 0, 255],
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
  currentZoomLevel,
  dataGeoJSON,
  updateActiveSelection,
  elevationFunction,
  colorFunction,
  is3DMode = true,
}) => {
  const isExtruded = Boolean(is3DMode && elevationApproach !== "none");

  return new GeoJsonLayer({
    id: `geojson_${elevationApproach}_${colorApproach}_${currentZoomLevel}_${isExtruded ? "3d" : "2d"}`,
    pickable: true,
    autoHighlight: true,
    highlightColor: LAYER_STYLES.HIGHLIGHT_COLOR,
    data: dataGeoJSON,
    opacity: is3DMode ? 0.78 : 0.65,
    stroked: true,
    filled: true,
    onClick: (info) => {
      updateActiveSelection(info.object.properties.id);
    },
    extruded: isExtruded,
    wireframe: isExtruded,
    material: isExtruded
      ? {
          ambient: 0.48,
          diffuse: 0.65,
          shininess: 24,
          specularColor: [32, 32, 32],
        }
      : null,
    getElevation: isExtruded ? elevationFunction : 0,
    getFillColor: colorFunction,
    getLineColor: isExtruded ? [20, 20, 20, 220] : [60, 60, 60, 160],
    lineWidthUnits: "pixels",
    getLineWidth: isExtruded ? 1.5 : 1,
    lineWidthMinPixels: isExtruded ? 1.5 : 1,
    updateTriggers: {
      getElevation: [isExtruded, elevationFunction, elevationApproach, dataGeoJSON],
      getFillColor: [colorFunction, colorApproach, dataGeoJSON],
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
  currentZoomLevel,
  dataGeoJSON,
  dataPropsOnly,
  updateActiveSelection,
  elevationFunction,
  colorFunction,
  isCountyLevel,
  is3DMode = true,
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
      currentZoomLevel,
      dataGeoJSON,
      updateActiveSelection,
      elevationFunction,
      colorFunction,
      isCountyLevel,
      is3DMode,
    });

    layers.push(standardLayer);
  }

  return layers;
};
