import { lazy, Suspense, useState } from "react";

import { useWorkspace } from "../../context/WorkspaceContext";
import { useQueryDraft } from "../../context/QueryDraftContext";
import { useSidebarUI } from "../../context/SidebarUIContext";
import { useToast } from "../../context/ToastContext";
import { formatCoordinates, formatPeriod, parseDatasetName } from "../../lib/datasetName";
import { validateQuery, type QueryFieldErrors } from "../../lib/validation";
import { Button } from "../ui/Button";
import { PanelHeader } from "../ui/Panel";
import { Skeleton } from "../ui/Skeleton";
import { ChevronLeftIcon, ExpandIcon } from "../ui/icons";
import { DateRangeFields } from "./DateRangeFields";
import { LocationFields } from "./LocationFields";
import { MapPickerModal } from "./MapPickerModal";

const LocationMap = lazy(() =>
  import("./LocationMap").then((m) => ({ default: m.LocationMap })),
);

function toNumberOrNull(raw: string): number | null {
  const n = Number(raw.trim());
  return raw.trim() !== "" && Number.isFinite(n) ? n : null;
}

function storeErrorMessage(status: number, message: string): string {
  if (status === 0) return "Can't reach the API. Check your connection and try again.";
  if (status === 429) return "Too many requests just now — wait a few seconds and retry.";
  return message;
}

export function SidebarLocationCard() {
  const { values, setCoords } = useQueryDraft();
  const { submitQuery, storeStatus } = useWorkspace();
  const { show } = useToast();
  const { setCollapsed } = useSidebarUI();
  const [errors, setErrors] = useState<QueryFieldErrors>({});
  const [expanded, setExpanded] = useState(false);

  const isSubmitting = storeStatus === "loading";
  const lat = toNumberOrNull(values.latitude);
  const lon = toNumberOrNull(values.longitude);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateQuery(values);
    setErrors(result.errors);
    if (!result.value) return;
    setCollapsed(true); // give the dashboard the room while the fetch runs
    try {
      const stored = await submitQuery(result.value);
      const parsed = parseDatasetName(stored.file);
      const label = parsed
        ? `${formatCoordinates(parsed.latitude, parsed.longitude)} · ${formatPeriod(parsed.startDate, parsed.endDate)}`
        : stored.file;
      show("success", stored.cached ? `Loaded existing dataset · ${label}` : `Stored · ${label}`);
    } catch (error) {
      const status = (error as { status?: number })?.status ?? 0;
      const message = (error as { message?: string })?.message ?? "Something went wrong.";
      show("error", storeErrorMessage(status, message));
    }
  }

  return (
    <section aria-label="Quick fetch">
      <PanelHeader
        title="Quick fetch"
        description="Pin a point, then fetch."
        actions={
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4 sm:px-5">
        <div className="relative">
          <Suspense fallback={<Skeleton className="h-36 w-full rounded-lg" />}>
            <LocationMap
              latitude={lat}
              longitude={lon}
              onChange={setCoords}
              disabled={isSubmitting}
              zoomControl={false}
              className="h-36 w-full overflow-hidden rounded-lg border border-slate-200"
            />
          </Suspense>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand map"
            title="Expand map"
            className="absolute right-2 top-2 z-[500] cursor-pointer rounded-md bg-white/80 p-1.5 text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <LocationFields errors={errors} disabled={isSubmitting} size="sm" />
        <DateRangeFields errors={errors} disabled={isSubmitting} />

        {errors.form && <p className="text-xs text-amber-600">{errors.form}</p>}

        <Button type="submit" size="sm" loading={isSubmitting} className="w-full">
          {isSubmitting ? "Fetching…" : "Fetch & store"}
        </Button>
      </form>

      {expanded && <MapPickerModal onClose={() => setExpanded(false)} />}
    </section>
  );
}
