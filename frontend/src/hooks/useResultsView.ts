import { useMemo, useState } from "react";
import type { StudentExamResult } from "../api/client";
import {
  filterResults,
  sortResults,
  type ResultsSortKey,
  type ResultsStatusFilter,
  type SortDirection,
} from "../utils/resultsStats";

/** Recherche, filtre de statut et tri des copies affichées dans le tableau. */
export function useResultsView(results: StudentExamResult[]) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ResultsStatusFilter>("all");
  const [sortKey, setSortKey] = useState<ResultsSortKey>("name");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const rows = useMemo(
    () => sortResults(filterResults(results, query, status), sortKey, direction),
    [results, query, status, sortKey, direction],
  );

  const toggleSort = (key: ResultsSortKey) => {
    if (key === sortKey) return setDirection((d) => (d === "asc" ? "desc" : "asc"));
    setSortKey(key);
    setDirection(key === "name" ? "asc" : "desc");
  };

  return { rows, query, setQuery, status, setStatus, sortKey, direction, toggleSort };
}
