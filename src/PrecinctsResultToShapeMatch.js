import React, { useState, useEffect } from "react";
import { Select, Input, Descriptions } from "antd";
const { Option } = Select;
const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

export default function PrecinctsResultToShapeMatch() {
  const [counties, updateCounties] = useState();
  const [dataGeoJSON, updateDataGeoJSON] = useState();
  const [
    dataElectionResultsPrecincts,
    updateDataElectionResultsPrecincts,
  ] = useState();
  const [
    dataElectionResultsPrecinctsToShapeMap,
    updateDataElectionResultsPrecinctsToShapeMap,
  ] = useState();

  useEffect(() => {
    const loadData = async () => {
      const fetchPromises = [
        fetch("/static/GA_precincts18_simple.json"),
        fetch("/static/GA_Election_Results_2020_General_Precincts.json"),
        fetch("/static/GA_Election_Results_2020_General_Map_To_Shape.json"),
      ];
      const [
        responseShape,
        responsePrecinctsResults,
        responsePrecinctResultsToShape,
      ] = await Promise.all(fetchPromises);
      if (
        !responseShape.ok ||
        !responsePrecinctsResults.ok ||
        !responsePrecinctResultsToShape.ok
      ) {
        console.log("ERROR loading data file");
        return;
      }
      const [
        geoJSON,
        precinctResults,
        precinctResultsMapping,
      ] = await Promise.all([
        responseShape.json(),
        responsePrecinctsResults.json(),
        responsePrecinctResultsToShape.json(),
      ]);

      //////////////////////////////////////////////////////////
      // Filter to just the results where we don't match
      //////////////////////////////////////////////////////////

      // Use a hash map for the look ups
      const electionPrecinctMap = new Map();
      precinctResults.forEach((precinct) =>
        electionPrecinctMap.set(
          `${precinct.county}_${precinct.precinct}`.toUpperCase(),
          precinct
        )
      );

      const shapePrecinctMap = new Map();
      geoJSON.features.forEach((precinct) =>
        shapePrecinctMap.set(
          `${precinct.properties.CTYNAME}_${precinct.properties.PRECINCT_N}`.toUpperCase(),
          precinct
        )
      );

      // find where they don't exist
      const electionNoMatch = [];
      [...electionPrecinctMap.keys()].forEach((id) => {
        if (!shapePrecinctMap.has(id) && !id.includes("WRITE-INS"))
          electionNoMatch.push(electionPrecinctMap.get(id));
      });

      const shapeNoMatch = [];
      [...shapePrecinctMap.keys()].forEach((id) => {
        if (!electionPrecinctMap.has(id))
          shapeNoMatch.push(shapePrecinctMap.get(id));
      });

      updateDataGeoJSON(shapeNoMatch);

      const precinctResultsMappingMap = new Map();
      precinctResultsMapping.forEach((mapping) => {
        const id = `${mapping.County}_${mapping["County Precinct Name"]}`.toUpperCase();
        const value = mapping["County Precinct Name Corrected"].toUpperCase();
        const idValue = `${mapping.County}_${value}`.toUpperCase();
        if (
          !shapePrecinctMap.has(id) &&
          electionPrecinctMap.has(id) &&
          !electionPrecinctMap.has(idValue) &&
          shapePrecinctMap.has(idValue)
        )
          // check that the precinct name is not in the shape file, that it is in the current election results, that the value isn't a precinct name, and it is a shape name
          precinctResultsMappingMap.set(id, value);
      });
      updateDataElectionResultsPrecinctsToShapeMap(precinctResultsMappingMap);

      // pull the counties from the election results
      const countiesSet = new Set();
      electionNoMatch.forEach((precinct) => countiesSet.add(precinct.county));
      const counties = [...countiesSet.values()].sort();
      updateCounties(counties);
      updateDataElectionResultsPrecincts(electionNoMatch);

      // do a map and find what's not in each side
    };

    loadData();
  }, []);

  const [selectedCounty, updateSelectedCounty] = useState();
  const [
    precinctsInSelectedCounty,
    updatePrecinctsInSelectedCounty,
  ] = useState();
  const [
    precinctsMapInSelectedCounty,
    updatePrecinctsMapInSelectedCounty,
  ] = useState();

  useEffect(() => {
    if (!selectedCounty) return;
    const tmpPrecinctsInSelectedCounty = dataElectionResultsPrecincts
      .filter((precinct) => precinct.county === selectedCounty)
      .sort((a, b) => (a.precinct > b.precinct ? 1 : -1));
    updatePrecinctsInSelectedCounty(tmpPrecinctsInSelectedCounty);
    const tmpPrecinctsMapInSelectedCounty = dataGeoJSON
      .filter(
        (precinct) =>
          precinct.properties.CTYNAME === selectedCounty.toUpperCase()
      )
      .map((precinct) => precinct.properties)
      .sort((a, b) => (a.PRECINCT_N > b.PRECINCT_N ? 1 : -1));
    updatePrecinctsMapInSelectedCounty(tmpPrecinctsMapInSelectedCounty);
  }, [selectedCounty]);

  const [showCSVOutputs, updateShowCSVOutputs] = useState(true);

  if (
    !dataGeoJSON ||
    !dataElectionResultsPrecincts ||
    !dataElectionResultsPrecinctsToShapeMap
  )
    return <div>Loading</div>;

  const convertToCSV = (dataElectionResultsPrecinctsToShapeMap) => {
    let csv = `County,County Precinct Name,County Precinct Name Corrected\n`;
    dataElectionResultsPrecinctsToShapeMap.forEach((value, key) => {
      csv = `${csv}${key.split("_")[0]},${key.split("_")[1]},${value}\n`;
    });
    return csv;
  };

  return (
    <div>
      <b>County:</b>{" "}
      <Select
        showSearch
        onChange={(value) => {
          updateSelectedCounty(value);
        }}
        style={{ width: "200px" }}
      >
        {counties.map((county) => (
          <Option id={county} value={county}>
            {county}
          </Option>
        ))}
      </Select>
      <br />
      <br />
      <br />
      <Descriptions
        title={selectedCounty}
        column={1}
        bordered
        size="small"
        style={{ width: "800px" }}
      >
        {precinctsInSelectedCounty &&
          precinctsInSelectedCounty.map((precinct) => (
            <Descriptions.Item
              name={precinct.precinct}
              label={precinct.precinct}
            >
              <Select
                id={`${precinct.county}_${precinct.precinct}`}
                style={{ width: "400px" }}
                showSearch
                filterOption={(input, option) => {
                  if(!input) return false
                  return (
                    option.children
                      .join(" ")
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  );
                }}
                value={
                  dataElectionResultsPrecinctsToShapeMap.has(
                    `${precinct.county}_${precinct.precinct}`.toUpperCase()
                  )
                    ? dataElectionResultsPrecinctsToShapeMap.get(
                        `${precinct.county}_${precinct.precinct}`.toUpperCase()
                      )
                    : null
                }
                onChange={(value) => {
                  const newMap = new Map(
                    dataElectionResultsPrecinctsToShapeMap
                  );
                  newMap.set(
                    `${precinct.county}_${precinct.precinct}`.toUpperCase(),
                    value
                  );
                  updateDataElectionResultsPrecinctsToShapeMap(newMap);
                }}
              >
                {precinctsMapInSelectedCounty.map((precinctShape) => (
                  <Option
                    id={precinctShape.PRECINCT_N}
                    value={precinctShape.PRECINCT_N}
                  >
                    {precinctShape.PRECINCT_N} ({precinctShape.PRECINCT_I})
                  </Option>
                ))}
              </Select>
            </Descriptions.Item>
          ))}
      </Descriptions>
      {showCSVOutputs && (
        <Input.TextArea
          rows={4}
          value={convertToCSV(dataElectionResultsPrecinctsToShapeMap)}
        />
      )}
    </div>
  );
}
