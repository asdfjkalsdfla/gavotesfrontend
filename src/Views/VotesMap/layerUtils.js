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
const SCATTER_PLOT_APPROACHES = [
  "electionResultVoteShift",
  "electionResultVoteMargin", 
  "electionResultVoteShiftNormalized"
];

// Attribute mapping for different color approaches
const ATTRIBUTE_MAPPING = {
  electionResultVoteShift: "voteShiftDemocratic",
  electionResultVoteShiftNormalized: "voteShiftDemocraticNormalized",
  electionResultVoteMargin: "marginDemocratic",
};

/**
 * Creates a scatter plot layer for election result visualizations
 */
export const createScatterPlotLayer = ({
  colorApproach,
  dataPropsOnly,
  isCountyLevel,
  circleOpacity = 128
}) => {
  const attributeForComparison = ATTRIBUTE_MAPPING[colorApproach];
  const isVoteMargin = colorApproach === "electionResultVoteMargin";
  
  const getValue = (f) => {
    if (isVoteMargin) {
      return f?.electionResultsCurrent?.[attributeForComparison] || 0;
    }
    return f?.electionResultsComparison?.[attributeForComparison] || 0;
  };

  const getColor = (value) => {
    return value < 0 
      ? [...LAYER_STYLES.REPUBLICAN_COLOR, circleOpacity]
      : [...LAYER_STYLES.DEMOCRATIC_COLOR, circleOpacity];
  };

  const getLineColor = (value) => {
    return value < 0 
      ? [...LAYER_STYLES.REPUBLICAN_COLOR, circleOpacity + 120]
      : [...LAYER_STYLES.DEMOCRATIC_COLOR, circleOpacity + 120];
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
  isCountyLevel
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
  isCountyLevel
}) => {
  return new GeoJsonLayer({
    id: `geojson_${elevationApproach}_${colorApproach}_${currentZoomLevel}`,
    pickable: true,
    autoHighlight: true,
    highlightColor: LAYER_STYLES.HIGHLIGHT_COLOR,
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
    getLineColor: LAYER_STYLES.BLACK_BORDER,
    lineWidthUnits: "pixels",
    getLineWidth: 5,
    lineWidthMinPixels: 5,
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
  isCountyLevel
}) => {
  const layers = [];

  if (shouldUseScatterPlot(colorApproach)) {
    // Create scatter plot visualization for election results
    const scatterLayer = createScatterPlotLayer({
      colorApproach,
      dataPropsOnly,
      isCountyLevel
    });

    const geoLayer = createElectionResultGeoLayer({
      colorApproach,
      dataGeoJSON,
      updateActiveSelection,
      colorFunction,
      isCountyLevel
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
      isCountyLevel
    });

    layers.push(standardLayer);
  }

  return layers;
}; 