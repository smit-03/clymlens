import { useEffect, useMemo, useState } from "react";

import { cx } from "../../lib/cx";
import { formatTemp, shortDate, weekday } from "../../lib/format";
import { summarize } from "../../lib/stats";
import type { DailyRow } from "../../lib/weatherData";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { ChevronLeftIcon, ChevronRightIcon } from "../ui/icons";

const PAGE_SIZES = [10, 20, 50] as const;
const WEEKEND = new Set([0, 6]);

function isWeekend(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return WEEKEND.has(day);
}

function TempCell({
  value,
  unit,
  tone,
  extreme,
}: {
  value: number | null;
  unit: string;
  tone: "max" | "min" | "muted";
  extreme?: string;
}) {
  const text = formatTemp(value, "");
  const color = value === null ? "text-slate-300" : tone === "muted" ? "text-slate-400" : "text-slate-800";

  if (extreme && value !== null) {
    const chip =
      tone === "max"
        ? "bg-temp-max/10 text-temp-max ring-temp-max/25"
        : "bg-temp-min/10 text-temp-min ring-temp-min/25";
    return (
      <Tooltip label={`${extreme} · ${formatTemp(value, unit)}`}>
        <span
          className={cx(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-sm font-semibold tabular-nums ring-1 ring-inset",
            chip,
          )}
        >
          {tone === "max" ? "▲" : "▼"} {text}
        </span>
      </Tooltip>
    );
  }
  return <span className={cx("tabular-nums", color)}>{text}</span>;
}

export function ObservationsTable({ rows, unit }: { rows: DailyRow[]; unit: string }) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [rows, pageSize]);

  const summary = useMemo(() => summarize(rows), [rows]);
  const warmestDate = rows.length > 1 ? summary.warmest?.date : undefined;
  const coolestDate = rows.length > 1 ? summary.coolest?.date : undefined;

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
        <div>
          <h3 className="text-[13px] font-semibold text-slate-800">Daily observations</h3>
          {(warmestDate || coolestDate) && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              Extremes for the range are marked ▲ / ▼.
            </p>
          )}
        </div>
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">Daily weather observations for the selected dataset</caption>
          <thead>
            <tr className="border-y border-slate-200 text-[10px] uppercase tracking-[0.08em] text-slate-400">
              <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold sm:pl-5">
                Date
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold text-slate-500">
                High <span className="font-normal normal-case text-slate-300">{unit}</span>
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold text-slate-500">
                Low <span className="font-normal normal-case text-slate-300">{unit}</span>
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Feels high <span className="text-slate-300">{unit}</span>
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Feels low <span className="text-slate-300">{unit}</span>
              </th>
              <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-medium sm:pr-5">
                Mean <span className="text-slate-300">{unit}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.date}
                className={cx(
                  "border-b border-slate-100 transition-colors hover:bg-slate-50/80",
                  isWeekend(row.date) && "bg-slate-50/50",
                )}
              >
                <th scope="row" className="whitespace-nowrap py-2.5 pl-4 pr-3 text-left font-normal sm:pl-5">
                  <span className="font-medium text-slate-800">{shortDate(row.date)}</span>
                  <span className="ml-1.5 text-xs text-slate-400">{weekday(row.date)}</span>
                </th>
                <td className="px-3 py-2.5 text-right">
                  <TempCell
                    value={row.tMax}
                    unit={unit}
                    tone="max"
                    extreme={row.date === warmestDate ? "Warmest high in this range" : undefined}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <TempCell
                    value={row.tMin}
                    unit={unit}
                    tone="min"
                    extreme={row.date === coolestDate ? "Coolest low in this range" : undefined}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <TempCell value={row.appMax} unit={unit} tone="muted" />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <TempCell value={row.appMin} unit={unit} tone="muted" />
                </td>
                <td className="py-2.5 pl-3 pr-4 text-right sm:pr-5">
                  <TempCell value={row.tMean} unit={unit} tone="muted" />
                </td>
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
