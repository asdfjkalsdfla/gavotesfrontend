/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-use-before-define */
import React, { useMemo, useState, useTransition } from "react";
import { Table, Menu } from "antd";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Download } from "lucide-react";
import { CSVLink } from "react-csv";
import { useElectionData } from "./ElectionDataProvider.jsx";
import { numberFormat, numberFormatPercent, numberFormatRatio, RDIndicator, sortNumeric } from "./Utils.jsx";

export default function VotesTable({ isCountyLevel, countyFilter, updateCountyFilter, updateIsCountyLevel, updateActiveSelection }) {
  const { locationResults, currentElectionRace, previousElectionRace, currentAbsenteeElection, baseAbsenteeElection } = useElectionData();
  const [rows, updateRows] = useState([]);

  const [showColumnSelect, updateShowColumnSelect] = useState(false);

  const columns = useMemo(
    () => [
      absenteeComparisonColumnsBuilder(),
      absenteeColumnsBuilder(currentAbsenteeElection, "absenteeCurrent"),
      absenteeColumnsBuilder(baseAbsenteeElection, "absenteeBase"),
      electionResultColumnsBuilder(currentElectionRace, "electionResultsCurrent"),
      electionResultColumnsBuilder(previousElectionRace, "electionResultsBase"),
      electionResultComparisonColumnsBuilder(),
      demographicColumnBuilder(),
    ],
    [isCountyLevel, updateIsCountyLevel, updateCountyFilter, currentAbsenteeElection, baseAbsenteeElection, currentElectionRace, previousElectionRace],
  );

  const [columnsDisplayedIDs, updateColumnsDisplayedIDs] = useState([
    "absenteeCurrent##absenteeVotesAsOfCurrentDate",
    "absenteeBase##absenteeVotesAsOfCurrentDate",
    "turnoutAbsenteeBallotsSameDay",
    "electionResultsCurrent##perRepublican",
    "electionResultsCurrent##perDemocratic",
    "electionResultsCurrent##marginPerPerDemocratic",
    "electionResultsBase##perRepublican",
    "electionResultsBase##perDemocratic",
    "electionResultsBase##marginPerPerDemocratic",
    "perShiftDemocratic",
    "totalVotesPercent",
    "voteShiftDemocraticNormalized",
  ]);

  const updateColumnsDisplayedCheckboxes = (key, isChecked) => {
    if (isChecked) {
      columnsDisplayedIDs.push(key);
    } else {
      columnsDisplayedIDs.splice(columnsDisplayedIDs.indexOf(key), 1);
    }
    updateColumnsDisplayedIDs([...columnsDisplayedIDs]);
  };

  const columnsDisplayed = useMemo(() => {
    const dataColumns = [];
    columns.forEach((columnGroup) => {
      const childrenIncluded = columnGroup.children.filter((column) => columnsDisplayedIDs.includes(column.key));
      if (childrenIncluded.length > 0) dataColumns.push({ ...columnGroup, children: childrenIncluded });
    });
    return [...idColumnBuilder(isCountyLevel, updateIsCountyLevel, updateCountyFilter, updateActiveSelection), ...dataColumns];
  }, [columns, columnsDisplayedIDs, isCountyLevel, updateCountyFilter, updateIsCountyLevel]);

  const csvFileHeaders = [];
  columnsDisplayed.forEach((column) => {
    if (column.children) {
      column.children.forEach((childColumn) => {
        csvFileHeaders.push({ label: childColumn.title, key: childColumn.dataIndex.join(".") });
      });
    } else {
      csvFileHeaders.push({ label: column.title, key: column.dataIndex.join(".") });
    }
  });
  const [isPending, startTransition] = useTransition();

  useMemo(() => {
    startTransition(() => {
      const newRows = [...locationResults.values()].filter((row) => row.CTYNAME).map((row) => ({ key: row.id, ...row }));
      // // Force calculation of new values
      // newRows.forEach((row) => {
      //   columns.forEach((parentColumn) => {
      //     if (!parentColumn.children) return;
      //     parentColumn?.children.forEach((column) => {
      //       const dataIndexes = Array.isArray(column.dataIndex) ? column.dataIndex : [column.dataIndex];
      //       let prevValue = row;
      //       if (!prevValue) return;
      //       dataIndexes.forEach((index) => {
      //         prevValue = prevValue?.[index];
      //         console.log(prevValue);
      //       });
      //     });
      //   });
      // });
      updateRows(newRows);
    });
  }, [locationResults]);

  return (
    <div className="p-4" style={{ width: "10fr", height: "1fr" }} data-testid="electionResultTable">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex lg:flex-1">
          <div className="text-2xl font-bold">State of Georgia - Fulton</div>
        </div>
        <div className="flex flex-1 justify-end">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
            onClick={() => {
              updateShowColumnSelect(!showColumnSelect);
            }}
          >
            <Settings className="mr-2 h-5 w-5" />
          </button>
          <CSVLink data={rows} headers={csvFileHeaders} filename="voting-data.csv">
            <Download className="mr-2 h-5 w-5" />
          </CSVLink>
        </div>
      </div>
      {showColumnSelect && (
        <div className="pt-6">
          <div className="text-lg font-bold">Data Elements</div>
          <div className="flex gap-x-10">
            {columns
              .filter((column) => column.children)
              .map((dataGroup) => (
                <div key={dataGroup.key}>
                  <div>
                    <b>{dataGroup.title}</b>
                  </div>
                  <div>
                    {dataGroup.children &&
                      dataGroup.children.map((dataElements) => (
                        <div key={dataElements.key} className="pt-1.5 items-top flex space-x-5">
                          <Checkbox
                            id={dataElements.key}
                            checked={columnsDisplayedIDs.includes(dataElements.key)}
                            onCheckedChange={(checked) => {
                              updateColumnsDisplayedCheckboxes(dataElements.key, checked);
                            }}
                          />{" "}
                          <div className="grid leading-none">
                            <label
                              htmlFor={dataElements.key}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {dataElements.title}
                            </label>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      <Menu
        mode="horizontal"
        selectedKeys={countyFilter ? ["county"] : ["state"]}
        items={[
          {
            key: "state",
            label: (
              <a
                onClick={() => {
                  updateCountyFilter(null);
                  updateActiveSelection(null);
                  updateIsCountyLevel(true);
                }}
              >
                State of Georgia
              </a>
            ),
          },
          {
            key: "county",
            label: countyFilter,
          },
        ]}
      />
      <Table
        loading={isPending}
        dataSource={rows}
        columns={columnsDisplayed}
        scroll={{ scrollToFirstRowOnChange: true, x: "max-content", y: 500 }}
        pagination={{ pageSize: 100 }}
        sticky={true}
        size="small"
      />
    </div>
  );
}

const idColumnBuilder = (isCountyLevel, updateIsCountyLevel, updateCountySelected, updateActiveSelection) => {
  const idColumnsParent = [
    {
      title: "County",
      key: "county",
      dataIndex: ["CTYNAME"],
      width: 150,
      sorter: (a, b) => (a.CTYNAME > b.CTYNAME ? 1 : -1),
      defaultSortOrder: "ascend",
      fixed: "left",
      render: (text, record) =>
        isCountyLevel ? (
          <a
            onClick={() => {
              updateIsCountyLevel(false);
              updateActiveSelection(null);
              updateCountySelected(record.CTYNAME);
            }}
          >
            {text}
          </a>
        ) : (
          <span>{text}</span>
        ),
    },
  ];
  if (!isCountyLevel) {
    idColumnsParent.push({
      title: "Precinct",
      key: "precinct",
      dataIndex: ["PRECINCT_N"],
      width: 150,
      sorter: (a, b) => (a.PRECINCT_N > b.PRECINCT_N ? 1 : -1),
      defaultSortOrder: "ascend",
      fixed: "left",
      className: "fixedCellBG",
    });
  }
  return idColumnsParent;
};

const absenteeColumnsBuilder = (electionInfo, absenteeElectionColumn) => {
  const children = [
    {
      key: `${absenteeElectionColumn}##absenteeVotesAsOfCurrentDate`,
      title: "At Same Days to Election",
      dataIndex: [absenteeElectionColumn, "absenteeVotesAsOfCurrentDate"],
      width: 100,
      align: "right",
      render: (text) => numberFormat.format(text),
      sorter: (a, b) => a?.[absenteeElectionColumn]?.absenteeVotesAsOfCurrentDate - b?.[absenteeElectionColumn]?.absenteeVotesAsOfCurrentDate,
    },
    {
      key: `${absenteeElectionColumn}##totalAbsenteeVotes`,
      title: "Total",
      dataIndex: [absenteeElectionColumn, "totalAbsenteeVotes"],
      align: "right",
      width: 100,
      render: (text) => numberFormat.format(text),
      sorter: (a, b) => a?.[absenteeElectionColumn]?.totalAbsenteeVotes - b?.[absenteeElectionColumn]?.totalAbsenteeVotes,
    },
  ];
  return {
    title: `Absentee Ballots - ${electionInfo?.label}`,
    key: `absBallots##${electionInfo?.name}`,
    width: children.length * 100,
    children,
  };
};

const absenteeComparisonColumnsBuilder = () => {
  const children = [
    {
      key: "turnoutAbsenteeBallotsSameDay",
      title: "Ratio on Same Day",
      dataIndex: ["absenteeBallotComparison", "turnoutAbsenteeBallotsSameDay"],
      width: 100,
      align: "right",
      render: (text) => numberFormatRatio.format(text),
      sorter: (a, b) => a?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay - b?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay,
    },
    {
      key: "turnoutAbsenteeBallots",
      title: "Ratio of All",
      dataIndex: ["absenteeBallotComparison", "turnoutAbsenteeBallots"],
      width: 100,
      align: "right",
      render: (text) => numberFormatRatio.format(text),
      sorter: (a, b) => a?.absenteeBallotComparison?.turnoutAbsenteeBallots - b?.absenteeBallotComparison?.turnoutAbsenteeBallots,
    },
  ];
  return {
    title: "Comparison of Absentee Ballots",
    key: "absCompare",
    width: children.length * 100,
    children,
  };
};

const electionResultColumnsBuilder = (raceInfo, raceColumn) => {
  const children = [
    {
      key: `${raceColumn}##republican`,
      title: `${raceInfo?.republican} (R)`,
      dataIndex: [raceColumn, "republican"],
      width: 100,
      align: "right",
      render: (text) => numberFormat.format(text),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.republican, b?.[raceColumn]?.republican),
    },
    {
      key: `${raceColumn}##perRepublican`,
      title: `${raceInfo?.republican} (R) %`,
      dataIndex: [raceColumn, "perRepublican"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.perRepublican, b?.[raceColumn]?.perRepublican),
    },
    {
      key: `${raceColumn}##democratic`,
      title: `${raceInfo?.democratic} (D)`,
      dataIndex: [raceColumn, "democratic"],
      width: 100,
      align: "right",
      render: (text) => numberFormat.format(text),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.democratic, b?.[raceColumn]?.democratic),
    },
    {
      key: `${raceColumn}##perDemocratic`,
      title: `${raceInfo?.democratic} (D) %`,
      dataIndex: [raceColumn, "perDemocratic"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.perDemocratic, b?.[raceColumn]?.perDemocratic),
    },
    {
      key: `${raceColumn}##other`,
      title: "Other Candidates",
      dataIndex: [raceColumn, "other"],
      width: 100,
      align: "right",
      render: (text) => numberFormat.format(text),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.other, b?.[raceColumn]?.other),
    },
    {
      key: `${raceColumn}##perOther`,
      title: "Other Candidates %",
      dataIndex: [raceColumn, "perOther"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.perOther, b?.[raceColumn]?.perOther),
    },
    {
      key: `${raceColumn}##totalVotes`,
      title: "Total",
      dataIndex: [raceColumn, "totalVotes"],
      width: 100,
      align: "right",
      render: (text) => numberFormat.format(text),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.totalVotes, b?.[raceColumn]?.totalVotes),
    },
    {
      key: `${raceColumn}##marginDemocratic`,
      title: "Margin",
      dataIndex: [raceColumn, "marginDemocratic"],
      width: 100,
      align: "right",
      render: (text) => (
        <>
          {RDIndicator(text)} {numberFormat.format(Math.abs(text))}
        </>
      ),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.marginDemocratic, b?.[raceColumn]?.marginDemocratic),
    },
    {
      key: `${raceColumn}##marginPerPerDemocratic`,
      title: "Margin %",
      dataIndex: [raceColumn, "marginPerPerDemocratic"],
      width: 100,
      align: "right",
      render: (text) => (
        <>
          {RDIndicator(text)} {numberFormatPercent.format(Math.abs(text))}
        </>
      ),
      sorter: (a, b) => sortNumeric(a?.[raceColumn]?.marginPerPerDemocratic, b?.[raceColumn]?.marginPerPerDemocratic),
    },
    {
      key: `${raceColumn}##marginEarlyPerRepublican`,
      title: "Early Vote Margin %",
      dataIndex: [raceColumn, "marginEarlyPerRepublican"],
      width: 100,
      align: "right",
      render: (text) => (
        <>
          {RDIndicator(-1 * text)} {numberFormatPercent.format(Math.abs(text))}
        </>
      ),
      sorter: (a, b) => sortNumeric(-1 * a?.[raceColumn]?.marginEarlyPerRepublican, -1 * b?.[raceColumn]?.marginEarlyPerRepublican),
    },
  ];
  return {
    title: `${raceInfo?.election?.label} - ${raceInfo?.name}`,
    key: `electionResult##${raceInfo?.election?.label}##${raceInfo?.name}`,
    width: children.length * 100,
    children,
  };
};

const electionResultComparisonColumnsBuilder = () => {
  const children = [
    {
      key: "perShiftDemocratic",
      title: "Swing (Shift in R/D %)",
      dataIndex: ["electionResultsComparison", "perShiftDemocratic"],
      width: 100,
      align: "right",
      render: (text) => (
        <>
          {RDIndicator(text)} {numberFormatPercent.format(Math.abs(text))}
        </>
      ),
      sorter: (a, b) => sortNumeric(a?.electionResultsComparison?.perShiftDemocratic, b?.electionResultsComparison?.perShiftDemocratic),
    },
    {
      key: "totalVotesPercent",
      title: "% of Previous Turnout",
      dataIndex: ["electionResultsComparison", "totalVotesPercent"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.electionResultsComparison?.totalVotesPercent, b?.electionResultsComparison?.totalVotesPercent),
    },
    {
      key: "voteShiftDemocraticNormalized",
      title: "Shift in Vote Margin (Normalized)",
      dataIndex: ["electionResultsComparison", "voteShiftDemocraticNormalized"],
      width: 100,
      align: "right",
      render: (text) => (
        <>
          {RDIndicator(text)} {numberFormat.format(Math.abs(text))}
        </>
      ),
      sorter: (a, b) => sortNumeric(a?.electionResultsComparison?.voteShiftDemocraticNormalized, b?.electionResultsComparison?.voteShiftDemocraticNormalized),
    },
    {
      key: "perShiftRepublicanEarly",
      title: "EV Shift in R/D %",
      dataIndex: ["electionResultsComparison", "perShiftRepublicanEarly"],
      width: 100,
      align: "right",
      render: (text) => (
        <>
          {RDIndicator(-1 * text)} {numberFormatPercent.format(Math.abs(text))}
        </>
      ),
      sorter: (a, b) => sortNumeric(-1 * a?.electionResultsComparison?.perShiftRepublicanEarly, -1 * b?.electionResultsComparison?.perShiftRepublicanEarly),
    },
  ];
  return {
    title: "Comparison of Election Results",
    key: "electionResultCompare",
    width: children.length * 100,
    children,
  };
};

const demographicColumnBuilder = () => {
  const children = [
    {
      key: "demographics##whitePer",
      title: "White %",
      dataIndex: ["demographics", "whitePer"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.demographics?.whitePer, b?.demographics?.whitePer),
    },
    {
      key: "demographics##blackPer",
      title: "Black %",
      dataIndex: ["demographics", "blackPer"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.demographics?.blackPer, b?.demographics?.blackPer),
    },
    {
      key: "demographics##hispanicPer",
      title: "Hispanic %",
      dataIndex: ["demographics", "hispanicPer"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.demographics?.hispanicPer, b?.demographics?.hispanicPer),
    },
    {
      key: "demographics##asianPer",
      title: "Asian %",
      dataIndex: ["demographics", "asianPer"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.demographics?.asianPer, b?.demographics?.asianPer),
    },
    {
      key: "demographics##unknownPer",
      title: "Unknown %",
      dataIndex: ["demographics", "unknownPer"],
      width: 100,
      align: "right",
      render: (text) => numberFormatPercent.format(text),
      sorter: (a, b) => sortNumeric(a?.demographics?.unknownPer, b?.demographics?.unknownPer),
    },
  ];
  return {
    title: "Demographics",
    width: children.length * 100,
    key: "demographics",
    children,
  };
};
