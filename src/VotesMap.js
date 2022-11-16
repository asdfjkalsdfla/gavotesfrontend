import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useState, useEffect, useMemo } from "react";
import Map, { NavigationControl, useControl } from 'react-map-gl';
// import {
//   LightingEffect,
//   AmbientLight,
//   DirectionalLight,
//   _SunLight as SunLight,
// } from "@deck.gl/core";
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer } from "@deck.gl/layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";

import Demographics from './Models/Demographics';

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
  return Math.max(0, Math.min(1, (value / absMax) * 0.5 + 0.5)) * scale;
};

const convertD3ColorToArray = (color) => {
  return color
    .replace("rgb(", "")
    .replace(")", "")
    .split(",")
    .map((val) => parseInt(val));
};

const quantile = (arr, q) => {
  const sorted = arr
    .filter((a) => typeof a === "number" && isFinite(a))
    .sort((a, b) => {
      return a - b;
    });
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

const MAPBOX_TOKEN =
  "pk.eyJ1IjoicmljaGFyZG93cmlnaHQiLCJhIjoiY2podXhvNGUxMHRlaTNycnNteTFyM3UyZCJ9.AvD-USUs_rTwesgEJCmECA";

function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export default function VotesMap({
  mapStyle = "mapbox://styles/mapbox/light-v10",
  elevationApproach,
  colorApproach,
  allElectionData,
  updateActiveSelection,
  updateActiveHover,
  isCountyLevel = false,
  updateIsCountyLevel,
  county,
  initialZoom,
  userHasSetLevel
}) {
  // ************************************************
  // Manage the map data
  // ************************************************
  // If the user sets a specific county, we show only that counties data @ precinct level
  // Otherwise, we determine if we show counties or precinct state wide data
  const geoJSONFile = county
    ? `/static/GA_precincts_2020_${county}_simple.json`
    : isCountyLevel
      ? "/static/GA_counties_simple.json"
      : "/static/GA_precincts_simple_2020.json";

  const [dataGeoJSONBase, updateDataGeoJSONBase] = useState();
  useEffect(() => {
    const load = async () => {
      const responseGeo = await fetch(geoJSONFile);
      if (!responseGeo.ok) {
        console.log("ERROR loading GEO JSON file");
        return;
      }
      const geoJSONBase = await responseGeo.json();
      geoJSONBase.features.forEach(location => {
        const propertiesPrior = location.properties;
        const demographics = new Demographics(propertiesPrior);
        const properties = {
          id: propertiesPrior.id,
          ID: propertiesPrior.ID,
          CNTY: propertiesPrior.CNTY,
          CTYNAME: propertiesPrior.CTYNAME,
          PRECINCT_I: propertiesPrior.PRECINCT_I,
          PRECINCT_N: propertiesPrior.PRECINCT_N,
          centroid: propertiesPrior.centroid,
          demographics
        };
        location.properties = properties;
      });
      updateDataGeoJSONBase(geoJSONBase);
    }
    load();
  }, [geoJSONFile]);

  const [dataGeoJSON, updateDataGeoJSON] = useState();
  const [dataPropsOnly, updateDataPropsOnly] = useState();

  useEffect(() => {
    if (!dataGeoJSONBase) return;
    if (!allElectionData) return;

    // Merge the values together into a single file
    dataGeoJSONBase.features.forEach((feature) => {
      const votingResultRaw = feature.properties;
      const properties = allElectionData.has(votingResultRaw.id)
        ? allElectionData.get(votingResultRaw.id)
        : {};

      feature.properties = { ...feature.properties, ...properties };
    });
    if (allElectionData.size > 0) updateDataGeoJSON({ ...dataGeoJSONBase });

    // For the scatter plot, we just need the center coordinates and not the full geoJSON
    // The simplest way to get that is to just pull it out of the geoJSON
    // It's worth considering splitting these from the geoJSON in the future (i.e. load the data and then merge w/ the geoJSON)
    // That would enable caching of the big geoJSON shape definition since the properties won't change
    const simpleData = dataGeoJSONBase.features.map((feature) => feature.properties);
    updateDataPropsOnly(simpleData);
  }, [dataGeoJSONBase, allElectionData]);

  // ************************************************
  // Calc the initial map state
  // ************************************************
  const INITIAL_VIEW_STATE = useMemo(() => {
    // chance the bearing and pitch based upon the elevation approach (i.e. make it straight up vs. 3D)
    const initialPitch = elevationApproach === "none" ? 0 : 45;
    const initialBearing = elevationApproach === "none" ? 0 : 350;

    // Change the zoom level based upon the size of the viewport
    const sizeParam = "none";
    const initialZoom = county
      ? 10
      : sizeParam === "small" || sizeParam === "small…"
        ? 5
        : 6.7;
    const initialLatLong = county
      ? {
        latitude: 33.9999,
        longitude: -84.5641,
      }
      : {
        latitude: 32.75,
        longitude: -83.388,
      }; // TODO - fix this to use the county's centroid when county is passed in

    const INITIAL_VIEW_STATE = {
      ...initialLatLong,
      zoom: initialZoom,
      minZoom: 5,
      maxZoom: 20,
      pitch: initialPitch,
      bearing: initialBearing,
      width: window.innerWidth - 200,
      height: window.innerHeight - 200,
    };
    return INITIAL_VIEW_STATE;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




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
  let elevationFunction = null;
  switch (elevationApproach) {
    case "none":
      elevationFunction = null;
      break;
    case "votes":
      elevationFunction = (f) => {
        return f.properties.absenteeCurrent.totalAbsenteeVotes * (isCountyLevel ? 0.2 : 2) || 0;
      };
      break;
    case "turnoutAbsSameDay":
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(
            f.properties?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay,
            0.4,
            1.0
          ) *
            (isCountyLevel ? 30000 : 10000)) +
          0 || 0;
        return value;
      };
      break;
    default:
      elevationFunction = (f) => {
        const value =
          (normalizeZeroOne(
            f.properties.turnoutVs2020,
            0,
            1
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
    case "totalVotesPercent":
      scaleMin = quantile([...allElectionData.values()].map(datapoint => datapoint?.electionResultsComparison?.totalVotesPercent), isCountyLevel ? 0.01 : 0.05);
      scaleMax = quantile([...allElectionData.values()].map(datapoint => datapoint?.electionResultsComparison?.totalVotesPercent), isCountyLevel ? 0.99 : 0.95);
      // console.log(`Min: ${scaleMin}, Max: ${scaleMax}`);
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties?.electionResultsComparison?.totalVotesPercent,
          scaleMin,
          scaleMax
        );
        // console.log(value);
        const color = scaleToColorFunction(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "turnoutAbs":
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
    case "turnoutAbsSameDay":
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties.turnoutAbsSameDayVs2018,
          0,
          1
        );
        const color = d3ScaleChromatic.interpolateGreens(value);
        return convertD3ColorToArray(color);
      };
      break;
    case "electionResultPerRepublicanPerShift":
      colorFunction = (f) => {
        const perAdjusted = normalizeZeroCenterToZeroOne(
          f.properties?.electionResultsComparison?.perShiftDemocratic,
          (isCountyLevel ? -0.15 : -0.15),
          (isCountyLevel ? 0.15 : 0.15)
        );
        // console.log(`County - ${f.properties?.CTYNAME};Shift - ${f.properties?.electionResultsComparison?.perShiftDemocratic}; Shift Adjusted - ${perAdjusted}`);
        const color = !(perAdjusted === undefined) ?
          perAdjusted < 0.5 ?
            d3ScaleChromatic.interpolateReds(1 - 2 * perAdjusted) :
            d3ScaleChromatic.interpolateBlues(2 * (perAdjusted - 0.5))
          : [255, 255, 255, 0];
        return convertD3ColorToArray(color);
        return !(perAdjusted === undefined) ? COLOR_SCALE(perAdjusted) : [255, 255, 255, 0];
      };
      break;
    case "hispanic":
      scaleMin = quantile(dataGeoJSON.map(f => (f.properties?.demographics?.hispanicPer)), 0.05);
      scaleMax = quantile(dataGeoJSON.map(f => (f.properties?.demographics?.hispanicPer)), 0.95);
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties?.demographics?.hispanicPer,
          scaleMin,
          scaleMax
        );
        const color = scaleToColorFunction(value);
        return convertD3ColorToArray(color);
      };
      break;
    default:
      colorFunction = (f) => {
        const value = f.properties?.electionResultsCurrent?.perDemocratic;
        return value ? COLOR_SCALE(value) : [255, 255, 255, 0];
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
        attributeForComparison = "voteShiftDemocratic"
        break;
      case "electionResultVoteShiftNormalized":
        attributeForComparison = "voteShiftDemocraticNormalized"
        break;
      default:
        attributeForComparison = "marginDemocratic"
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
      lineWidthMinPixels: (isCountyLevel ? 2 : 1),
      getPosition: (f) => f.centroid,
      getRadius: (f) =>
        Math.sqrt(
          Math.abs(
            (colorApproach === "electionResultVoteMargin" ?
              f?.electionResultsCurrent ? f?.electionResultsCurrent[attributeForComparison] : 0
              : f?.electionResultsComparison ? f?.electionResultsComparison[attributeForComparison] : 0
            )
          )
        ) * (isCountyLevel ? 4 : 1.5) * (colorApproach === "electionResultVoteMargin" ? 1 : 2),
      getFillColor: (f) => {
        return (colorApproach === "electionResultVoteMargin" ?
          f?.electionResultsCurrent ? f?.electionResultsCurrent[attributeForComparison] : 0
          : f?.electionResultsComparison ? f?.electionResultsComparison[attributeForComparison] : 0
        ) < 0
          ? [170, 57, 57, circleOpacity]
          : [17, 62, 103, circleOpacity];
      },
      getLineColor: (f) => (colorApproach === "electionResultVoteMargin" ?
        f?.electionResultsCurrent ? f?.electionResultsCurrent[attributeForComparison] : 0
        : f?.electionResultsComparison ? f?.electionResultsComparison[attributeForComparison] : 0
      ) < 0
        ? [170, 57, 57, circleOpacity + 120]
        : [17, 62, 103, circleOpacity + 120],
      lineWidthPixels: (isCountyLevel ? 5 : 1),
    });


    if (dataGeoJSON && showSecondaryColor) {
      scaleMin = quantile(dataGeoJSON.features.map(f => f.properties?.demographics?.hispanicPer + f.properties?.demographics?.blackPer), 0.05);
      scaleMax = quantile(dataGeoJSON.features.map(f => f.properties?.demographics?.hispanicPer + f.properties?.demographics?.blackPer), 0.95);
      scaleToColorFunction = d3ScaleChromatic.interpolateGreens;
      colorFunction = (f) => {
        const value = normalizeZeroOne(
          f.properties?.demographics?.hispanicPer + f.properties?.demographics?.hispanicPer,
          scaleMin,
          scaleMax
        );
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
        updateActiveSelection(info.object);
      },
      getFillColor: showSecondaryColor ? colorFunction : [158, 158, 158, 0],
      getLineColor: [40, 40, 40],
      getLineWidth: 1,
      lineWidthMinPixels: (isCountyLevel ? 1 : 1),
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
        updateActiveSelection(info.object);
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

  return (
    <Map
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={mapStyle}
      mapboxAccessToken={MAPBOX_TOKEN}
      onViewStateChange={(viewport) => updateZoomLevel(viewport.viewState)}
      style={{ width: "100%", height: "100%" }}
    >
      <DeckGLOverlay
        // ContextProvider={MapContext.Provider}
        layers={layers}
        // effects={effects}
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
            <div>Color: ${colorApproach === "electionResultVoteShift"
                  ? numberFormat.format(lookup[colorApproach])
                  : numberFormatPercent.format(lookup[colorApproach])
                }</div>
            ${elevationApproach !== "none" && lookup[elevationApproach]
                  ? `<div>Height: 
              ${numberFormat.format(lookup[elevationApproach])}
            </div>`
                  : `<span></span>`
                }
        `,
            };
        }}

      />
      <div style={NAVIGATION_CONTROL_STYLES}>
        <NavigationControl />
      </div>
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
    </Map >
  );
}
