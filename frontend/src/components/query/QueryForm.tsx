import { lazy, Suspense, useMemo, useState } from "react";

import type { StoreWeatherResponse } from "../../api/types";
import { useWorkspace } from "../../context/WorkspaceContext";
import { countryFlag } from "../../lib/countryFlag";
import { formatCoordinates, formatPeriod, parseDatasetName } from "../../lib/datasetName";
import { placeRegion, type GeoPlace } from "../../lib/geocoding";
import {
  validateQuery,
  type QueryFieldErrors,
  type QueryFormValues,
} from "../../lib/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Panel, PanelHeader } from "../ui/Panel";
import { Skeleton } from "../ui/Skeleton";
import { TextField } from "../ui/TextField";
import { CitySearch } from "./CitySearch";

// Leaflet pulls in its own chunk; only load it with the form.
const LocationMap = lazy(() =>
  import("./LocationMap").then((m) => ({ default: m.LocationMap })),
);

function defaultValues(): QueryFormValues {
  const end = new Date(Date.now() - 5 * 86_400_000);
  const start = new Date(end.getTime() - 9 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { latitude: "19.0760", longitude: "72.8777", startDate: iso(start), endDate: iso(end) };
}

function storeErrorMessage(status: number, message: string): string {
  if (status === 0) return "Can't reach the API. Check your connection and try again.";
  if (status === 429) return "Too many requests just now — wait a few seconds and retry.";
  return message;
}

function toNumberOrNull(raw: string): number | null {
  const n = Number(raw.trim());
  return raw.trim() !== "" && Number.isFinite(n) ? n : null;
}

export function QueryForm() {
  const { submitQuery, storeStatus, storeError } = useWorkspace();
  const [values, setValues] = useState<QueryFormValues>(defaultValues);
  const [errors, setErrors] = useState<QueryFieldErrors>({});
  const [submitted, setSubmitted] = useState<StoreWeatherResponse | null>(null);
  const [place, setPlace] = useState<GeoPlace | null>(null);

  const isSubmitting = storeStatus === "loading";
  const lat = toNumberOrNull(values.latitude);
  const lon = toNumberOrNull(values.longitude);

  function patch(next: Partial<QueryFormValues>, keepPlace = false) {
    setValues((prev) => ({ ...prev, ...next }));
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(next).map((k) => [k, undefined])), form: undefined }));
    setSubmitted(null);
    if (!keepPlace) setPlace(null);
  }

  function handleCoords(latitude: number, longitude: number) {
    patch({ latitude: latitude.toFixed(4), longitude: longitude.toFixed(4) });
  }

  function handlePlace(selected: GeoPlace) {
    setValues((prev) => ({
      ...prev,
      latitude: selected.latitude.toFixed(4),
      longitude: selected.longitude.toFixed(4),
    }));
    setErrors((prev) => ({ ...prev, latitude: undefined, longitude: undefined, form: undefined }));
    setSubmitted(null);
    setPlace(selected);
  }

  const successLabel = useMemo(() => {
    if (!submitted) return null;
    const parsed = parseDatasetName(submitted.file);
    if (!parsed) return submitted.file;
    const where = formatCoordinates(parsed.latitude, parsed.longitude);
    const when = formatPeriod(parsed.startDate, parsed.endDate);
    return submitted.cached
      ? `Loaded existing dataset · ${where} · ${when}`
      : `Stored · ${where} · ${when}`;
  }, [submitted]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateQuery(values);
    setErrors(result.errors);
    if (!result.value) return;
    try {
      setSubmitted(await submitQuery(result.value));
    } catch {
      /* surfaced via storeError */
    }
  }

  return (
    <Panel aria-label="Fetch weather data">
      <PanelHeader
        title="Fetch weather data"
        description="Search a place, drop a pin, or type coordinates."
      />
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-4 py-4 sm:px-5">
        <CitySearch onSelect={handlePlace} disabled={isSubmitting} />

        <Suspense fallback={<Skeleton className="h-52 w-full rounded-lg" />}>
          <LocationMap
            latitude={lat}
            longitude={lon}
            onChange={handleCoords}
            disabled={isSubmitting}
          />
        </Suspense>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-slate-700">Coordinates</span>
            {place && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                {countryFlag(place.countryCode)} {place.name}
                {placeRegion(place) && <span className="text-slate-400">· {placeRegion(place)}</span>}
              </span>
            )}
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <TextField
              label="Latitude"
              hideLabel
              inputMode="decimal"
              placeholder="Latitude (-90 to 90)"
              value={values.latitude}
              onChange={(e) => patch({ latitude: e.target.value })}
              error={errors.latitude}
              disabled={isSubmitting}
            />
            <TextField
              label="Longitude"
              hideLabel
              inputMode="decimal"
              placeholder="Longitude (-180 to 180)"
              value={values.longitude}
              onChange={(e) => patch({ longitude: e.target.value })}
              error={errors.longitude}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Start date"
            type="date"
            value={values.startDate}
            onChange={(e) => patch({ startDate: e.target.value }, true)}
            error={errors.startDate}
            disabled={isSubmitting}
          />
          <TextField
            label="End date"
            type="date"
            value={values.endDate}
            onChange={(e) => patch({ endDate: e.target.value }, true)}
            error={errors.endDate}
            disabled={isSubmitting}
          />
        </div>

        {errors.form && (
          <Alert tone="warning" className="!py-2">
            {errors.form}
          </Alert>
        )}
        {storeError && (
          <Alert tone="error" className="!py-2">
            {storeErrorMessage(storeError.status, storeError.message)}
          </Alert>
        )}
        {successLabel && !storeError && (
          <Alert tone="success" className="!py-2">
            {successLabel}
          </Alert>
        )}

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
