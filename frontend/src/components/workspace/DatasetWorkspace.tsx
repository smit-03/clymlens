import { lazy, Suspense, useMemo } from "react";

import { useWorkspace } from "../../context/WorkspaceContext";
import { dayCount, formatCoordinates, formatPeriod, parseDatasetName } from "../../lib/datasetName";
import { formatTemp, shortDate } from "../../lib/format";
import { summarize } from "../../lib/stats";
import { hasPlottableData, normalizeWeather } from "../../lib/weatherData";
import { Alert } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Panel } from "../ui/Panel";
import { Skeleton } from "../ui/Skeleton";
import { ActivityIcon, ClockIcon, GlobeIcon, LayersIcon } from "../ui/icons";
import { ObservationsTable } from "./ObservationsTable";

// Recharts is heavy; only load it once a dataset with plottable data is open.
const TemperatureChart = lazy(() =>
  import("./TemperatureChart").then((m) => ({ default: m.TemperatureChart })),
);

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-4 py-3 sm:px-5">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <Panel aria-label="Selected dataset" className="overflow-hidden">
      <div className="space-y-2 px-5 py-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3.5 w-40" />
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-y border-slate-100 sm:grid-cols-4 sm:divide-y-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 px-5 py-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
      <div className="px-5 py-4">
        <Skeleton className="h-[260px] w-full" />
      </div>
    </Panel>
  );
}

export function DatasetWorkspace() {
  const { selectedFile, content, contentStatus, contentError, reloadContent, refreshFiles, files } =
    useWorkspace();

  const normalized = useMemo(() => normalizeWeather(content), [content]);
  const summary = useMemo(() => summarize(normalized.rows), [normalized.rows]);
  const parsed = selectedFile ? parseDatasetName(selectedFile) : null;

  if (!selectedFile) {
    return (
      <Panel aria-label="Selected dataset" data-tour-target="chart-table">
        <EmptyState
          icon={<ActivityIcon className="h-5 w-5" />}
          title={files.length === 0 ? "Nothing to inspect yet" : "Select a dataset"}
          description={
            files.length === 0
              ? "Fetch a location and date range above — it'll show up in the list, ready to inspect."
              : "Choose a dataset from the list to see its temperature trend and daily observations."
          }
        />
      </Panel>
    );
  }

  if (contentStatus === "loading" && !content) return <WorkspaceSkeleton />;

  if (contentStatus === "error") {
    const is404 = contentError?.status === 404;
    return (
      <Panel aria-label="Selected dataset" className="p-5">
        <Alert
          tone={is404 ? "warning" : "error"}
          title={is404 ? "Dataset unavailable" : "Couldn't load this dataset"}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (is404 ? void refreshFiles() : reloadContent())}
            >
              {is404 ? "Refresh list" : "Retry"}
            </Button>
          }
        >
          {is404
            ? "This dataset is no longer in storage. It may have been removed or expired."
            : (contentError?.message ?? "Something went wrong while fetching the file.")}
        </Alert>
      </Panel>
    );
  }

  const unit = normalized.temperatureUnit;
  const location = parsed
    ? formatCoordinates(parsed.latitude, parsed.longitude)
    : (normalized.meta.latitude != null && normalized.meta.longitude != null
        ? formatCoordinates(normalized.meta.latitude, normalized.meta.longitude)
        : selectedFile);
  const period = parsed ? formatPeriod(parsed.startDate, parsed.endDate) : "";
  const days = parsed ? dayCount(parsed.startDate, parsed.endDate) : normalized.rows.length;

  return (
    <Panel
      aria-label="Selected dataset"
      data-tour-target="chart-table"
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{location}</h2>
          {period && <p className="mt-0.5 text-sm text-slate-500">{period}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">
              <LayersIcon className="h-3 w-3" />
              {days} {days === 1 ? "day" : "days"}
            </Badge>
            {normalized.meta.timezone && (
              <Badge>
                <ClockIcon className="h-3 w-3" />
                {normalized.meta.timezone}
              </Badge>
            )}
            {normalized.meta.elevation != null && (
              <Badge>
                <GlobeIcon className="h-3 w-3" />
                {Math.round(normalized.meta.elevation)} m
              </Badge>
            )}
          </div>
        </div>
        <code className="max-w-full truncate rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
          {selectedFile}
        </code>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-y border-slate-100 sm:grid-cols-4 sm:divide-y-0">
        <Stat label="Avg high" value={formatTemp(summary.avgMax, unit)} />
        <Stat label="Avg low" value={formatTemp(summary.avgMin, unit)} />
        <Stat
          label="Warmest"
          value={summary.warmest ? formatTemp(summary.warmest.value, unit) : "—"}
          sub={summary.warmest ? shortDate(summary.warmest.date) : undefined}
        />
        <Stat
          label="Coolest"
          value={summary.coolest ? formatTemp(summary.coolest.value, unit) : "—"}
          sub={summary.coolest ? shortDate(summary.coolest.date) : undefined}
        />
      </div>

      {summary.warmest && summary.coolest && (
        <p className="border-l-2 border-moss-500/40 bg-moss-500/[0.04] px-4 py-2.5 text-[13px] text-slate-600 sm:px-5">
          Over {summary.dayCount} days, the high peaked at{" "}
          <span className="font-medium text-slate-800">{formatTemp(summary.warmest.value, unit)}</span>{" "}
          on {shortDate(summary.warmest.date)} and the low bottomed out at{" "}
          <span className="font-medium text-slate-800">{formatTemp(summary.coolest.value, unit)}</span>{" "}
          on {shortDate(summary.coolest.date)}.
        </p>
      )}

      <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
        {hasPlottableData(normalized.rows) ? (
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <TemperatureChart rows={normalized.rows} unit={unit} />
          </Suspense>
        ) : (
          <EmptyState
            title="No temperature values"
            description="The stored file has no daily max/min readings for this range."
          />
        )}
      </div>

      {normalized.rows.length > 0 && (
        <div className="border-t border-slate-100">
          <ObservationsTable rows={normalized.rows} unit={unit} />
        </div>
      )}
    </Panel>
  );
}
