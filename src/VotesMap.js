import React, { useState } from "react";
import { _MapContext as MapContext, NavigationControl } from "react-map-gl";
import { StaticMap } from "react-map-gl";
import DeckGL from "@deck.gl/react";
import {
  LightingEffect,
  AmbientLight,
  _SunLight as SunLight,
} from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";

import statsCounty from "./stats_county.json";
import statsPrecinct from "./stats_precinct.json";

const numberFormat = new Intl.NumberFormat("en-us");

const numberFormatPercent = new Intl.NumberFormat("en-us", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const NAVIGATION_CONTROL_STYLES = {
  marginTop: 50,
  marginLeft: 10,
  position: "absolute",
};

export const COLOR_SCALE = scaleLinear()
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

const normalizeZeroOne = (value, min, max) => {
  return Math.max(0, Math.min(1, (value - min) / (max - min) || 0));
};

const normalizeZeroCenterToZeroOne = (value, min, max, scale = 1.0) => {
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  return Math.max(0, Math.min(1, (value / absMax) * 0.5 * scale + 0.5));
};

const convertD3ColorToArray = (color) => {
  return color
    .replace("rgb(", "")
    .replace(")", "")
    .split(",")
    .map((val) => parseInt(val));
};

const MAPBOX_TOKEN =
  "pk.eyJ1IjoicmljaGFyZG93cmlnaHQiLCJhIjoiY2podXhvNGUxMHRlaTNycnNteTFyM3UyZCJ9.AvD-USUs_rTwesgEJCmECA";

export default function VotesMap({
  mapStyle = "mapbox://styles/mapbox/light-v10",
  elevationApproach,
  colorApproach,
  data,
  dataSimple,
  updateActiveSelection,
  updateActiveHover,
  INITIAL_VIEW_STATE,
  isCountyLevel = false,
  updateIsCountyLevel,
  initialZoom,
  userHasSetLevel,
}) {
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

  // ************************************************
  // Stats use to normalize the colors or height
  // ************************************************
  // choose between county or precinct variants
  const stats = isCountyLevel ? statsCounty : statsPrecinct;

  // Create cross party results max; this is used to have the same scale for all party turnout values
  stats.partyTurnoutMax = Math.max(
    stats.republicanTurnoutVs2018Max,
    stats.republicanTurnoutVs2016Max,
    stats.democratTurnoutVs2016Max,
    stats.democratTurnoutVs2018Max
  );

  // TODO - think through scale strategy; don't want to be deceptive when you switch between county and precinct level but you also do have more variation between those

  // ************************************************
  // Define How The Elevation Will Be Calculated
  // ************************************************
  let elevationFunction = null;
  switch (elevationApproach) {
    case "none":
      elevationFunction = null;
      break;
    case "votes":
      elevationFunction = (f) => {
        return f.properties["TotalVoters2020"] * (isCountyLevel ? 0.2 : 2) || 0;
      };
      break;
    case "votesYest":
      elevationFunction = (f) => {
        return f.properties["absVotesYesterday"] * (isCountyLevel ? 5 : 50);
      };
      break;
    case "votesYestPer2018":
      elevationFunction = (f) => {
        return (
          (f.properties["absVotesYesterday"] /
            f.properties["TotalVoters2018"]) *
          (isCountyLevel ? 50000 : 10000)
        );
      };
      break;
    case "turnoutAbsSameDayVs2020":
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(
            f.properties.turnoutAbsSameDayVs2020,
            stats.turnoutAbsSameDayVs2020Min,
            stats.turnoutAbsSameDayVs2020Max
          ) *
            30000) /
            1.66 ** (currentZoomLevel - 7) +
            0 || 0;
        return value;
      };
      break;
    case "turnoutAbsSameDayVs2018":
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(
            f.properties.turnoutAbsSameDayVs2018,
            stats.turnoutAbsSameDayVs2018Min,
            stats.turnoutAbsSameDayVs2018Max
          ) *
            30000) /
            1.66 ** (currentZoomLevel - 7) +
            0 || 0;
        return value;
      };
      break;
    case "absRemaining2020": // hidden for now
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(f.properties.absVotesRemaining, 0, 7000) * 30000) /
            1.66 ** (currentZoomLevel - 7) +
            0 || 0;
        return value;
      };
      break;
    case "turnoutVs2016":
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(
            f.properties.turnoutVs2016,
            stats.turnoutVs2016Min,
            stats.turnoutVs2016Max
          ) *
            30000) /
            1.66 ** (currentZoomLevel - 7) +
            0 || 0; // Magic parameters to make the perceived height constant regardless of zoom level
        return value;
      };
      break;
    case "turnoutVs2018":
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(
            f.properties.turnoutVs2018,
            stats.turnoutVs2018Min,
            stats.turnoutVs2018Max
          ) *
            30000) /
            1.66 ** (currentZoomLevel - 7) +
            0 || 0; // Magic parameters to make the perceived height constant regardless of zoom level
        return value;
      };
      break;
    default:
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(
            f.properties.turnoutVs2020,
            stats.turnoutVs2020Min,
            stats.turnoutVs2020Max
          ) *
            30000) /
            1.66 ** (currentZoomLevel - 7) +
            0 || 0;
        return value;
      };
  }

  // ************************************************
  // Define How The Color Will Be Calculated
  // ************************************************
  let scaleMin = 0; // thought that this will be used in the legend
  let scaleMax = 1;
  let scaleToColorFunction = null;
  let colorFunction = null;
  switch (colorApproach) {
    case "turnoutVs2016":
      scaleMin = stats.turnoutVs2016Min;
      scaleMax = stats.turnoutVs2016Max;
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.turnoutVs2016,
          scaleMin,
          scaleMax
        );
        const color = scaleToColorFunction(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "turnoutVs2018":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.turnoutVs2018,
          stats.turnoutVs2018Min,
          stats.turnoutVs2018Max
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "republicanTurnoutVs2018":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.republicanTurnoutVs2018,
          0,
          stats.partyTurnoutMax
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "republicanTurnoutVs2016":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.republicanTurnoutVs2016,
          0,
          stats.partyTurnoutMax
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "democratTurnoutVs2016":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.democratTurnoutVs2016,
          0,
          stats.partyTurnoutMax
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "democratTurnoutVs2018":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.democratTurnoutVs2018,
          0,
          stats.partyTurnoutMax
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "turnoutAbsSameDayVs2020":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.turnoutAbsSameDayVs2020,
          stats.turnoutAbsSameDayVs2020Min,
          stats.turnoutAbsSameDayVs2020Max
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;

    case "turnoutAbsSameDayVs2018":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.turnoutAbsSameDayVs2018,
          stats.turnoutAbsSameDayVs2018Min,
          stats.turnoutAbsSameDayVs2018Max
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "turnout2018Vs2016":
      colorFunction = (f) => {
        const value = normalizeZeroCenterToZeroOne(
          f.properties.turnout2018Vs2016 - 1,
          stats.turnout2018Vs2016Min - 1,
          stats.turnout2018Vs2016Max - 1
        );
        const color = d3ScaleChromatic.interpolateRdYlGn(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "shift2018To2016":
      colorFunction = (f) => {
        const perAdjusted = normalizeZeroCenterToZeroOne(
          f.properties["shift2018To2016"],
          stats.shift2018To2016Min,
          stats.shift2018To2016Max
        );
        return COLOR_SCALE(perAdjusted);
      };
      break;
    case "shift2020To2016":
      colorFunction = (f) => {
        const perAdjusted = normalizeZeroCenterToZeroOne(
          f.properties["shift2020To2016"],
          stats.shift2020To2016Min,
          stats.shift2020To2016Max
        );
        return COLOR_SCALE(perAdjusted);
      };
      break;
    case "shift2020To2018":
      colorFunction = (f) => {
        const perAdjusted = normalizeZeroCenterToZeroOne(
          f.properties["shift2020To2018"],
          stats.shift2020To2018Min,
          stats.shift2020To2018Max
        );
        return COLOR_SCALE(perAdjusted);
      };
      break;
    case "perRepublican2016":
      colorFunction = (f) => {
        const value = 1 - f.properties.perRepublican2016;
        return COLOR_SCALE(value);
      };
      break;
    case "perRepublican2018":
      colorFunction = (f) => {
        const value = 1 - f.properties.perRepublican2018;
        return COLOR_SCALE(value);
      };
      break;
    default:
      colorFunction = (f) => {
        const value = 1 - f.properties.perRepublican2020;
        return COLOR_SCALE(value);
      };
  }

  // ************************************************
  // Lighting Effects for 3d World
  // ************************************************
  const [effects] = useState(() => {
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 1.0,
    });

    const dirLight = new SunLight({
      timestamp: Date.UTC(2020, 11, 3, 18),
      color: [255, 255, 255],
      intensity: 1.75,
      _shadow: false,
    });
    const lightingEffect = new LightingEffect({ ambientLight, dirLight });
    lightingEffect.shadowColor = [0, 0, 0, 0.5];
    return [lightingEffect];
  });

  // ************************************************
  // Layers on the Map
  // ************************************************
  const layers = [];
  if (
    colorApproach === "marginShift2020To2016" ||
    colorApproach === "marginShift2020To2018"
  ) {
    const layerDot = new ScatterplotLayer({
      id: `scatter_${colorApproach}`,
      data: dataSimple,
      pickable: false,
      opacity: 0.6,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 1,
      radiusMaxPixels: 10000,
      lineWidthMinPixels: 1,
      getPosition: (f) => f.centroid,
      getRadius: (f) =>
        Math.sqrt(
          Math.abs(
            (colorApproach === "marginShift2020To2016"
              ? f.marginShift2020To2016
              : f.marginShift2020To2018) * (isCountyLevel ? 250 : 20)
          )
        ),
      getFillColor: (f) => {
        return (colorApproach === "marginShift2020To2016"
          ? f.marginShift2020To2016
          : f.marginShift2020To2018) > 0
          ? [170, 57, 57]
          : [17, 62, 103];
      },
      getLineColor: (d) => [255, 255, 255],
      lineWidthPixels: (d) => (isCountyLevel ? 2 : 1),
    });

    const layerGEO = new GeoJsonLayer({
      id: `geojson_${colorApproach}`,
      pickable: true,
      autoHighlight: true,
      highlightColor: [227, 197, 102],
      data,
      opacity: 0.01,
      stroked: true,
      filled: true,
      onClick: (info) => {
        updateActiveSelection(info.object);
      },
      getFillColor: [255, 255, 255],
      getLineColor: [40, 40, 40],
      getLineWidth: 2,
      lineWidthMinPixels: 3,
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
      data,
      opacity: 0.6,
      stroked: true,
      filled: true,
      onClick: (info) => {
        updateActiveSelection(info.object);
      },
      extruded: true,
      wireframe: true,
      getElevation: elevationFunction,
      getFillColor: colorFunction,
      getLineColor: [40, 40, 40],
      getLineWidth: 10,
      lineWidthMinPixels: 3,
    });
    layers.push(layer);
  }

  // BAD Practice but deck.gl doesn't seem to play nice with other components
  // i.e. you can't just wrap it in a div and have it take the space available for that div.
  const sidebarWidth = Math.max(window.innerWidth * 0.25, 300);
  const mapWidth = window.innerWidth - sidebarWidth - 20;

  return (
    <DeckGL
      ContextProvider={MapContext.Provider}
      layers={layers}
      effects={effects}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      getTooltip={({ object }) => {
        if (!object) {
          updateActiveHover(object);
          return;
        }
        if (object.properties) updateActiveHover(object);
        const lookup = object.properties ? object.properties : object;
        if (lookup[colorApproach] || lookup[elevationApproach])
          return {
            html: `\
            <div>Color: ${
              colorApproach === "marginShift2020To2016" ||
              colorApproach === "marginShift2020To2018"
                ? numberFormat.format(lookup[colorApproach])
                : numberFormatPercent.format(lookup[colorApproach])
            }</div>
            ${
              elevationApproach !== "none" && lookup[elevationApproach]
                ? `<div>Height: 
              ${numberFormat.format(lookup[elevationApproach])}
            </div>`
                : `<span></span>`
            }
        `,
          };
      }}
      onViewStateChange={(viewport) => updateZoomLevel(viewport.viewState)}
      width={mapWidth}
    >
      <div style={NAVIGATION_CONTROL_STYLES}>
        <NavigationControl />
      </div>
      <StaticMap
        y={50}
        reuseMaps
        mapStyle={mapStyle}
        mapboxApiAccessToken={MAPBOX_TOKEN}
      />
      {/* BEGINNINGS OF A LEGEND  
        <div style={{
          position: 'absolute',
          top: '90%',
          right: 0,
          width: 250,
          boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
          margin: 24,
          padding: "10px 24px",
          backgroundColor: "white",
          zIndex: 1,
        }}>{[...Array(50).keys()].map(point => {
          const color = d3ScaleChromatic.interpolateGreens(point * 2 / 100);
          return (<span style={{ backgroundColor: color, width: "1px" }}>&nbsp;</span>)
        })}</div> */}
    </DeckGL>
  );
}
