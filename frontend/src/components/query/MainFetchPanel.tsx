import { useState } from "react";

import { useWorkspace } from "../../context/WorkspaceContext";
import { useQueryDraft } from "../../context/QueryDraftContext";
import { useSidebarUI } from "../../context/SidebarUIContext";
import { useToast } from "../../context/ToastContext";
import { countryFlag } from "../../lib/countryFlag";
import { formatCoordinates, formatPeriod, parseDatasetName } from "../../lib/datasetName";
import { placeRegion } from "../../lib/geocoding";
import { validateQuery, type QueryFieldErrors } from "../../lib/validation";
import { Button } from "../ui/Button";
import { CrosshairIcon } from "../ui/icons";
import { Panel, PanelHeader } from "../ui/Panel";
import { CitySearch } from "./CitySearch";
import { DateRangeFields } from "./DateRangeFields";
import { LocationFields } from "./LocationFields";

function storeErrorMessage(status: number, message: string): string {
  if (status === 0) return "Can't reach the API. Check your connection and try again.";
  if (status === 429) return "Too many requests just now — wait a few seconds and retry.";
  return message;
}

export function MainFetchPanel() {
  const { values, place, setFromPlace } = useQueryDraft();
  const { submitQuery, storeStatus } = useWorkspace();
  const { show } = useToast();
  const { setCollapsed } = useSidebarUI();
  const [errors, setErrors] = useState<QueryFieldErrors>({});
  const [showCoords, setShowCoords] = useState(false);

  const isSubmitting = storeStatus === "loading";
  const hasCoordErrors = Boolean(errors.latitude || errors.longitude);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateQuery(values);
    setErrors(result.errors);
    if (result.errors.latitude || result.errors.longitude) setShowCoords(true);
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
    <Panel aria-label="Fetch weather data">
      <PanelHeader
        title="Fetch weather data"
        description="Search a place and pick a date range to retrieve and store it."
      />
      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-5">
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <CitySearch onSelect={setFromPlace} disabled={isSubmitting} />
          <div className="sm:w-72">
            <DateRangeFields errors={errors} disabled={isSubmitting} />
          </div>
        </div>

        {place && (
          <p className="inline-flex items-center gap-1 text-xs text-slate-500">
            {countryFlag(place.countryCode)} {place.name}
            {placeRegion(place) && <span className="text-slate-400">· {placeRegion(place)}</span>}
          </p>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowCoords((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-50/70 px-3 py-1.5 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-100/80"
            aria-expanded={showCoords || hasCoordErrors}
          >
            <CrosshairIcon className="h-3.5 w-3.5" />
            {showCoords || hasCoordErrors ? "Hide coordinates" : "Enter coordinates manually"}
          </button>
          {(showCoords || hasCoordErrors) && (
            <div className="mt-2 max-w-sm">
              <LocationFields errors={errors} disabled={isSubmitting} />
            </div>
          )}
        </div>

        {errors.form && <p className="text-xs text-amber-600">{errors.form}</p>}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-400">Up to 31 days per request.</p>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? "Fetching…" : "Fetch & store"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
