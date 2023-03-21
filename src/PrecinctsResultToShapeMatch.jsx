import React, { useState, useEffect } from "react";
import { Select, Input, Table, Checkbox } from "antd";
import Papa from "papaparse";

const { Option } = Select;

export default function PrecinctsResultToShapeMatch() {
  const [counties, updateCounties] = useState([]);
  const [countiesNoMatch, updateCountiesNoMatch] = useState([]);
  const [shapePrecincts, updateShapesPrecincts] = useState();
  const [electionResultsPrecinctsToShapeMap, updateElectionResultsPrecinctsToShapeMap] = useState();
  const [electionResultNoMatch, updateElectionsNoMatch] = useState();
  const [manualElectionResultsPrecinctsToShapeMap, updateManualElectionResultsPrecinctsToShapeMap] = useState();

  useEffect(() => {
    const loadData = async () => {
      const fetchPromises = [
        fetch("/static/GA_precincts_simple_2022.json"),
        fetch("/static/2022_runoff_map_2022_ids.csv"),
        fetch("/static/2022_runoff_map_2022_ids_manual.csv"),
      ];
      const [responseShape, responsePrecinctsMap, responsePrecinctMapManual] = await Promise.all(fetchPromises);
      if (!responseShape.ok || !responsePrecinctsMap.ok || !responsePrecinctMapManual.ok) {
        console.log("ERROR loading data file");
        return;
      }
      const [geoJSON, precinctResultsMapCSV, manualPrecinctResultsMapCSV] = await Promise.all([
        responseShape.json(),
        responsePrecinctsMap.text(),
        responsePrecinctMapManual.text(),
      ]);

      /// ///////////////////////////////////////////////////////
      // Filter to just the results where we don't match
      /// ///////////////////////////////////////////////////////

      // Use a hash map for the look ups
      const electionPrecinctMap = new Map();
      const precinctResultsMap = Papa.parse(precinctResultsMapCSV, { header: true });
      precinctResultsMap.data.forEach((precinct) => {
        electionPrecinctMap.set(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase(), precinct);
      });
      updateElectionResultsPrecinctsToShapeMap(electionPrecinctMap);

      const shapePrecinctMap = new Map();
      geoJSON.features.forEach((precinct) => shapePrecinctMap.set(`${precinct.properties.CTYNAME}_${precinct.properties.PRECINCT_I}`.toUpperCase(), precinct));
      updateShapesPrecincts(shapePrecinctMap);

      // find where they don't exist
      const electionNoMatch = [];
      electionPrecinctMap.forEach((precinct, id) => {
        if (precinct.score < 90) electionNoMatch.push(electionPrecinctMap.get(id));
      });
      updateElectionsNoMatch(electionNoMatch);

      const manualPrecinctResultsMappingMap = new Map();
      const manualPrecinctResults = Papa.parse(manualPrecinctResultsMapCSV, { header: true });
      manualPrecinctResults.data.forEach((precinct) => {
        const id = `${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase();
        manualPrecinctResultsMappingMap.set(id, precinct);
        electionPrecinctMap.set(id, precinct); // in case these aren't in sync
      });
      updateManualElectionResultsPrecinctsToShapeMap(manualPrecinctResultsMappingMap);

      // pull the counties from the election results
      const countiesNoMatchSet = new Set();
      electionNoMatch.forEach((precinct) => countiesNoMatchSet.add(precinct.county));
      const countiesNoMatch = [...countiesNoMatchSet.values()].sort();
      updateCountiesNoMatch(countiesNoMatch);

      // all
      const countiesSet = new Set();
      geoJSON.features.forEach((precinct) => countiesSet.add(precinct.properties.CTYNAME));
      const counties = [...countiesSet.values()].sort();
      updateCounties(counties);
    };

    loadData();
  }, []);

  const [showAllCounties, updateShowAllCounties] = useState(false);
  const [selectedCounty, updateSelectedCounty] = useState();
  const [electionPrecinctsInSelectedCounty, updateElectionPrecinctsInSelectedCounty] = useState([]);
  const [mapPrecinctsInSelectedCounty, updatePrecinctsMapInSelectedCounty] = useState([]);

  useEffect(() => {
    if (!selectedCounty) return;
    const tmpPrecinctsInSelectedCounty = [...electionResultsPrecinctsToShapeMap.values()]
      .filter((precinct) => precinct.county === selectedCounty)
      .sort((a, b) => (a.electionResultsPrecinctName > b.electionResultsPrecinctName ? 1 : -1));
    updateElectionPrecinctsInSelectedCounty(tmpPrecinctsInSelectedCounty);
    const tmpPrecinctsMapInSelectedCounty = [...shapePrecincts.values()]
      .filter((precinct) => precinct.properties.CTYNAME === selectedCounty.toUpperCase())
      .map((precinct) => precinct.properties)
      .sort((a, b) => (a.PRECINCT_N > b.PRECINCT_N ? 1 : -1));
    updatePrecinctsMapInSelectedCounty(tmpPrecinctsMapInSelectedCounty);
  }, [manualElectionResultsPrecinctsToShapeMap, selectedCounty]);

  const [mapPrecinctsNotSelectedInCounty, updateMapPrecinctsNotSelectedInCounty] = useState([]);
  const [mapPrecinctsSelectedMultipleTimesInCounty, updateMapPrecinctsSelectedMultipleTimesInCounty] = useState([]);
  useEffect(() => {
    const tmpPrecinctsMapNotUsed = [];
    const tmpPrecinctsMapUsedMulti = [];
    mapPrecinctsInSelectedCounty.forEach((shapePrecinct) => {
      const shapesInElectionMap = electionPrecinctsInSelectedCounty.filter(
        (electionToMapRecord) => electionToMapRecord.precinct.toUpperCase() === shapePrecinct.PRECINCT_I
      );
      if (shapesInElectionMap.length === 0) tmpPrecinctsMapNotUsed.push(shapePrecinct);
      if (shapesInElectionMap.length > 1) tmpPrecinctsMapUsedMulti.push(shapePrecinct);
    });
    updateMapPrecinctsNotSelectedInCounty(tmpPrecinctsMapNotUsed);
    updateMapPrecinctsSelectedMultipleTimesInCounty(tmpPrecinctsMapUsedMulti);
  }, [electionPrecinctsInSelectedCounty, mapPrecinctsInSelectedCounty]);

  const [showCSVOutputs] = useState(true);

  if (!electionResultNoMatch || !manualElectionResultsPrecinctsToShapeMap) return <div>Loading</div>;

  const convertToCSV = (manualData) => {
    let csv = "county,precinct,mapPrecinctName,electionResultsPrecinctName,score\n";
    manualData.forEach((value) => {
      csv = `${csv}${value.county},${value.precinct},${value.mapPrecinctName},${value.electionResultsPrecinctName},${value.score}\n`;
    });
    return csv;
  };

  const precinctOptions =
    mapPrecinctsInSelectedCounty &&
    mapPrecinctsInSelectedCounty.map((precinctShape) => (
      <Option key={precinctShape.PRECINCT_I} id={precinctShape.PRECINCT_I} value={precinctShape.PRECINCT_I}>
        {precinctShape.PRECINCT_N} ({precinctShape.PRECINCT_I})
      </Option>
    ));

  const columns = [
    {
      title: "Election Precinct Name",
      dataIndex: "electionResultsPrecinctName",
      sorter: (a, b) => a.electionResultsPrecinctName > b.electionResultsPrecinctName,
      defaultSortOrder: "ascend",
    },
    {
      title: "Match Score",
      dataIndex: "score",
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: "Manual",
      dataIndex: "man",
      render: (text, precinct) => (
        <Checkbox
          checked={manualElectionResultsPrecinctsToShapeMap.has(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase())}
          enabled={false}
        />
      ),
    },
    {
      title: "Precinct",
      dataIndex: "precinct",
      render: (text, precinct) => (
        <Select
          id={`${precinct.county}_${precinct.precinct}`}
          style={{ width: "400px" }}
          showSearch
          filterOption={(input, option) => {
            if (!input) return false;
            return option.children.join(" ").toLowerCase().indexOf(input.toLowerCase()) >= 0;
          }}
          value={
            manualElectionResultsPrecinctsToShapeMap.has(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase())
              ? manualElectionResultsPrecinctsToShapeMap.get(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase()).precinct
              : electionResultsPrecinctsToShapeMap.get(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase())?.precinct
          }
          onChange={(value) => {
            const recordMap = {
              county: precinct.county,
              precinct: value,
              mapPrecinctName: "TODO",
              electionResultsPrecinctName: precinct.electionResultsPrecinctName,
              score: 85,
            };
            const newMap = new Map(manualElectionResultsPrecinctsToShapeMap);
            newMap.set(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase(), recordMap);
            electionResultsPrecinctsToShapeMap.set(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase(), recordMap);
            updateManualElectionResultsPrecinctsToShapeMap(newMap);
          }}
        >
          {precinctOptions}
        </Select>
      ),
    },
  ];

  console.log(counties);

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
        {showAllCounties ? (
          <>
            {counties.map((county) => (
              <Option key={county} id={county} value={county}>
                {county}
              </Option>
            ))}
          </>
        ) : (
          <>
            {countiesNoMatch.map((county) => (
              <Option key={county} id={county} value={county}>
                {county}
              </Option>
            ))}
          </>
        )}
        )
      </Select>{" "}
      <Checkbox
        onChange={(e) => {
          updateShowAllCounties(e.target.checked);
        }}
        checked={showAllCounties}
      >
        All
      </Checkbox>
      <br />
      <br />
      <b>Not Used:</b>{" "}
      {mapPrecinctsNotSelectedInCounty &&
        mapPrecinctsNotSelectedInCounty.map((shape) => (
          <span key={shape.PRECINCT_N}>
            {shape.PRECINCT_N} ({shape.PRECINCT_I}),{" "}
          </span>
        ))}
      <br />
      <b>Used Multiple Times:</b>{" "}
      {mapPrecinctsSelectedMultipleTimesInCounty &&
        mapPrecinctsSelectedMultipleTimesInCounty.map((shape) => (
          <span key={shape.PRECINCT_N}>
            {shape.PRECINCT_N} ({shape.PRECINCT_I}),{" "}
          </span>
        ))}
      <br />
      <br />
      <Table
        columns={columns}
        size="small"
        dataSource={electionPrecinctsInSelectedCounty}
        rows={100}
        pagination={{ pageSize: 100 }}
        style={{ width: "800px" }}
      />
      {showCSVOutputs && <Input.TextArea rows={4} value={convertToCSV(manualElectionResultsPrecinctsToShapeMap)} />}
    </div>
  );
}
