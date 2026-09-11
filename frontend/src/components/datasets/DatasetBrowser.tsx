import { useMemo } from "react";

import { useWorkspace } from "../../context/WorkspaceContext";
import type { FileInfo } from "../../api/types";
import { formatCoordinates, formatPeriod, parseDatasetName } from "../../lib/datasetName";
import { formatBytes, formatRelativeTime } from "../../lib/format";
import { cx } from "../../lib/cx";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { PanelHeader } from "../ui/Panel";
import { Skeleton } from "../ui/Skeleton";
import { ChevronRightIcon, LayersIcon, RefreshIcon } from "../ui/icons";

function DatasetRow({
  file,
  selected,
  onSelect,
}: {
  file: FileInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  const parsed = parseDatasetName(file.name);
  const primary = parsed
    ? formatCoordinates(parsed.latitude, parsed.longitude)
    : file.name;
  const secondary = parsed ? formatPeriod(parsed.startDate, parsed.endDate) : "Unrecognized name";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cx(
        "group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors sm:px-5",
        selected
          ? "border-brand-500 bg-brand-50/70"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50",
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cx(
            "truncate text-[13px] font-medium",
            selected ? "text-brand-800" : "text-slate-800",
          )}
        >
          {primary}
        </p>
        <p className="truncate text-xs text-slate-500">{secondary}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {formatBytes(file.size)} · {formatRelativeTime(file.created_at)}
        </p>
      </div>
      <ChevronRightIcon
        className={cx(
          "h-4 w-4 shrink-0 transition-colors",
          selected ? "text-brand-500" : "text-slate-300 group-hover:text-slate-400",
        )}
      />
    </button>
  );
}

export function DatasetBrowser() {
  const { files, filesStatus, filesError, refreshFiles, selectedFile, selectFile } = useWorkspace();

  const countLabel = useMemo(() => {
    if (filesStatus === "loading" && files.length === 0) return "Loading…";
    if (files.length === 0) return "Nothing stored yet";
    return `${files.length} stored ${files.length === 1 ? "dataset" : "datasets"}`;
  }, [filesStatus, files.length]);

  const isInitialLoading = filesStatus === "loading" && files.length === 0;
  const isError = filesStatus === "error" && files.length === 0;

  return (
    <section aria-label="Stored datasets">
      <PanelHeader
        title="Datasets"
        description={countLabel}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refreshFiles()}
            aria-label="Refresh dataset list"
            disabled={filesStatus === "loading"}
          >
            <RefreshIcon
              className={cx("h-4 w-4", filesStatus === "loading" && "animate-spin")}
            />
          </Button>
        }
      />

      <div className="divide-y divide-slate-100">
        {isInitialLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 px-4 py-3.5 sm:px-5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          ))}

        {isError && (
          <div className="p-4">
            <Alert
              tone="error"
              action={
                <Button variant="secondary" size="sm" onClick={() => void refreshFiles()}>
                  Retry
                </Button>
              }
            >
              {filesError?.message ?? "Couldn't load datasets."}
            </Alert>
          </div>
        )}

        {!isInitialLoading && !isError && files.length === 0 && (
          <EmptyState
            icon={<LayersIcon className="h-5 w-5" />}
            title="No datasets yet"
            description="Fetch historical weather for a location and it will appear here."
          />
        )}

        {files.map((file) => (
          <DatasetRow
            key={file.name}
            file={file}
            selected={file.name === selectedFile}
            onSelect={() => selectFile(file.name)}
          />
        ))}
      </div>
    </section>
  );
}
