import { useMemo, useState } from "react";

import type { StoreWeatherResponse } from "../../api/types";
import { formatCoordinates, formatPeriod, parseDatasetName } from "../../lib/datasetName";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  validateQuery,
  type QueryFieldErrors,
  type QueryFormValues,
} from "../../lib/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Panel, PanelHeader } from "../ui/Panel";
import { TextField } from "../ui/TextField";
import { MapPinIcon } from "../ui/icons";

function defaultValues(): QueryFormValues {
  const end = new Date(Date.now() - 5 * 86_400_000);
  const start = new Date(end.getTime() - 9 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    latitude: "19.0760",
    longitude: "72.8777",
    startDate: iso(start),
    endDate: iso(end),
  };
}

function storeErrorMessage(status: number, message: string): string {
  if (status === 0) return "Can't reach the API. Check your connection and try again.";
  if (status === 429) return "Too many requests just now — wait a few seconds and retry.";
  return message;
}

export function QueryForm() {
  const { submitQuery, storeStatus, storeError } = useWorkspace();
  const [values, setValues] = useState<QueryFormValues>(defaultValues);
  const [errors, setErrors] = useState<QueryFieldErrors>({});
  const [submitted, setSubmitted] = useState<StoreWeatherResponse | null>(null);

  const isSubmitting = storeStatus === "loading";

  const set = (key: keyof QueryFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
    setSubmitted(null);
  };

  const successLabel = useMemo(() => {
    if (!submitted) return null;
    const parsed = parseDatasetName(submitted.file);
    if (!parsed) return submitted.file;
    const where = formatCoordinates(parsed.latitude, parsed.longitude);
    const when = formatPeriod(parsed.startDate, parsed.endDate);
    return submitted.cached ? `Loaded existing dataset · ${where} · ${when}` : `Stored · ${where} · ${when}`;
  }, [submitted]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateQuery(values);
    setErrors(result.errors);
    if (!result.value) return;
    try {
      const stored = await submitQuery(result.value);
      setSubmitted(stored);
    } catch {
      /* surfaced via storeError */
    }
  }

  return (
    <Panel aria-label="Fetch weather data">
      <PanelHeader
        title="Fetch weather data"
        description="Pick a location and date range to retrieve and store."
      />
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Latitude"
            inputMode="decimal"
            placeholder="-90 to 90"
            value={values.latitude}
            onChange={set("latitude")}
            error={errors.latitude}
            disabled={isSubmitting}
            trailing={<MapPinIcon className="h-4 w-4" />}
          />
          <TextField
            label="Longitude"
            inputMode="decimal"
            placeholder="-180 to 180"
            value={values.longitude}
            onChange={set("longitude")}
            error={errors.longitude}
            disabled={isSubmitting}
          />
          <TextField
            label="Start date"
            type="date"
            value={values.startDate}
            onChange={set("startDate")}
            error={errors.startDate}
            disabled={isSubmitting}
          />
          <TextField
            label="End date"
            type="date"
            value={values.endDate}
            onChange={set("endDate")}
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
