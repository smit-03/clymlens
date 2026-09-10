import { useEffect, useMemo, useState } from "react";

import type { DailyRow } from "../../lib/weatherData";
import { formatTemp, shortDate, weekday } from "../../lib/format";
import { cx } from "../../lib/cx";
import { Button } from "../ui/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "../ui/icons";

const PAGE_SIZES = [10, 20, 50] as const;

const COLUMNS: { key: keyof DailyRow; label: string; numeric: true }[] = [
  { key: "tMax", label: "High", numeric: true },
  { key: "tMin", label: "Low", numeric: true },
  { key: "appMax", label: "Feels high", numeric: true },
  { key: "appMin", label: "Feels low", numeric: true },
  { key: "tMean", label: "Mean", numeric: true },
];

export function ObservationsTable({ rows, unit }: { rows: DailyRow[]; unit: string }) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [rows, pageSize]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const startIndex = (current - 1) * pageSize;
  const visible = useMemo(
    () => rows.slice(startIndex, startIndex + pageSize),
    [rows, startIndex, pageSize],
  );

  const rangeStart = rows.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, rows.length);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-1 sm:px-5">
        <h3 className="text-[13px] font-semibold text-slate-800">Daily observations</h3>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Rows
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white py-1 pl-2 pr-6 text-xs text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto border-y border-slate-100">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Daily weather observations for the selected dataset</caption>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-2.5 text-left font-medium sm:px-5">
                Date
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col" className="px-4 py-2.5 text-right font-medium">
                  {col.label}
                  <span className="ml-1 font-normal normal-case text-slate-400">{unit}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visible.map((row) => (
              <tr key={row.date} className="transition-colors hover:bg-slate-50/70">
                <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left font-normal sm:px-5">
                  <span className="text-slate-800">{shortDate(row.date)}</span>
                  <span className="ml-1.5 text-xs text-slate-400">{weekday(row.date)}</span>
                </th>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      "px-4 py-2.5 text-right tabular-nums",
                      row[col.key] === null ? "text-slate-300" : "text-slate-700",
                    )}
                  >
                    {formatTemp(row[col.key] as number | null, "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-slate-500 sm:px-5">
        <span>
          Showing <span className="font-medium text-slate-700">{rangeStart}</span>–
          <span className="font-medium text-slate-700">{rangeEnd}</span> of{" "}
          <span className="font-medium text-slate-700">{rows.length}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(current - 1)}
            disabled={current <= 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <span className="px-1 tabular-nums">
            {current} / {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(current + 1)}
            disabled={current >= pageCount}
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
