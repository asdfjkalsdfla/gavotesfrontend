import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";

import { ArrowDownUp, ArrowUpDown, MoreHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";

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
        fetch("/static/shapeFiles/GA_precincts_simple_2022.json"),
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

  const [showAllCounties, updateShowAllCounties] = useState(true);
  const [selectedCounty, updateSelectedCounty] = useState();
  const [electionPrecinctsInSelectedCounty, updateElectionPrecinctsInSelectedCounty] = useState([]);
  const [mapPrecinctsInSelectedCounty, updatePrecinctsMapInSelectedCounty] = useState([]);

  useEffect(() => {
    if (!selectedCounty) return;
    const tmpPrecinctsInSelectedCounty = [...electionResultsPrecinctsToShapeMap.values()]
      .filter((precinct) => precinct.county.toUpperCase() === selectedCounty.toUpperCase())
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
        (electionToMapRecord) => electionToMapRecord.precinct.toUpperCase() === shapePrecinct.PRECINCT_I,
      );
      if (shapesInElectionMap.length === 0) tmpPrecinctsMapNotUsed.push(shapePrecinct);
      if (shapesInElectionMap.length > 1) tmpPrecinctsMapUsedMulti.push(shapePrecinct);
    });
    updateMapPrecinctsNotSelectedInCounty(tmpPrecinctsMapNotUsed);
    updateMapPrecinctsSelectedMultipleTimesInCounty(tmpPrecinctsMapUsedMulti);
  }, [electionPrecinctsInSelectedCounty, mapPrecinctsInSelectedCounty]);

  const [showCSVOutputs] = useState(true);

  const convertToCSV = (manualData) => {
    let csv = "county,precinct,mapPrecinctName,electionResultsPrecinctName,score\n";
    manualData.forEach((value) => {
      csv = `${csv}${value.county},${value.precinct},${value.mapPrecinctName},${value.electionResultsPrecinctName},${value.score}\n`;
    });
    return csv;
  };

  const precinctOptions = useMemo(
    () =>
      mapPrecinctsInSelectedCounty &&
      mapPrecinctsInSelectedCounty.map((precinctShape) => ({
        value: precinctShape.PRECINCT_I,
        label: `${precinctShape.PRECINCT_N} (${precinctShape.PRECINCT_I})`,
      })),
    [mapPrecinctsInSelectedCounty],
  );

  const columns = useMemo(
    () => [
      {
        header: ({ column }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Election Precinct Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "electionResultsPrecinctName",
        sorter: (a, b) => a.electionResultsPrecinctName > b.electionResultsPrecinctName,
        defaultSortOrder: "ascend",
      },
      {
        header: ({ column }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Match Score
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "score",
        sorter: (a, b) => a.score - b.score,
      },
      {
        header: ({ column }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Manual
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "man",
        cell: ({ row }) => {
          const precinct = row.original;
          return (
            <Checkbox
              checked={manualElectionResultsPrecinctsToShapeMap.has(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase())}
              enabled={false}
            />
          );
        },
      },
      {
        header: "Precinct",
        accessorKey: "precinct",
        cell: ({ row }) => {
          const precinct = row.original;
          return (
            <Combobox
              id={`${precinct.county}_${precinct.precinct}`}
              style={{ width: "400px" }}
              value={
                manualElectionResultsPrecinctsToShapeMap.has(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase())
                  ? manualElectionResultsPrecinctsToShapeMap.get(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase()).precinct
                  : electionResultsPrecinctsToShapeMap.get(`${precinct.county}_${precinct.electionResultsPrecinctName}`.toUpperCase())?.precinct
              }
              onValueChange={(value) => {
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
              options={precinctOptions}
            />
          );
        },
      },
    ],
    [selectedCounty, mapPrecinctsInSelectedCounty, precinctOptions],
  );

  const [sorting, setSorting] = React.useState([]);

  const table = useReactTable({
    data: electionPrecinctsInSelectedCounty,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (!electionResultNoMatch || !manualElectionResultsPrecinctsToShapeMap) return <div>Loading</div>;

  return (
    <div className="p-5">
      <div className="text-lg">Map Data</div>
      <b>County:</b>{" "}
      <Combobox
        onValueChange={(value) => {
          updateSelectedCounty(value);
        }}
        value={selectedCounty}
        options={counties.map((county) => ({ value: county, label: county }))}
      />
      <Checkbox
        onCheckedChange={(checked) => {
          updateShowAllCounties(checked);
        }}
        checked={showAllCounties}
      />{" "}
      All
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
      <div className="rounded-md border w-6/12">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>;
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showCSVOutputs && <textarea rows={4} cols={90} value={convertToCSV(manualElectionResultsPrecinctsToShapeMap)} />}
    </div>
  );
}

export function Combobox({ value, onValueChange, options }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          {value ? options.find((option) => option.value.toUpperCase() === value.toUpperCase())?.label : "Select..."}
          <ArrowDownUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        {open && (
          <Command>
            <CommandInput placeholder="Search..." className="h-9" />
            <CommandEmpty>No values found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <Check className={cn("ml-auto h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
