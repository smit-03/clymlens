/* eslint-disable react-refresh/only-export-components -- context module: provider + hook belong together */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { GeoPlace } from "../lib/geocoding";
import type { QueryFormValues } from "../lib/validation";

function defaultValues(): QueryFormValues {
  const end = new Date(Date.now() - 5 * 86_400_000);
  const start = new Date(end.getTime() - 9 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { latitude: "19.0760", longitude: "72.8777", startDate: iso(start), endDate: iso(end) };
}

interface QueryDraftValue {
  values: QueryFormValues;
  patch: (next: Partial<QueryFormValues>) => void;
  place: GeoPlace | null;
  setPlace: (place: GeoPlace | null) => void;
  setCoords: (latitude: number, longitude: number) => void;
  setFromPlace: (place: GeoPlace) => void;
}

const QueryDraftContext = createContext<QueryDraftValue | null>(null);

/**
 * One shared "what am I about to fetch" draft, so the compact sidebar picker
 * (map + coordinates) and the main fetch panel (city search) always agree —
 * editing coordinates in either place updates both.
 */
export function QueryDraftProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<QueryFormValues>(defaultValues);
  const [place, setPlace] = useState<GeoPlace | null>(null);

  const patch = useCallback((next: Partial<QueryFormValues>) => {
    setValues((prev) => ({ ...prev, ...next }));
  }, []);

  const setCoords = useCallback((latitude: number, longitude: number) => {
    setValues((prev) => ({ ...prev, latitude: latitude.toFixed(4), longitude: longitude.toFixed(4) }));
    setPlace(null);
  }, []);

  const setFromPlace = useCallback((selected: GeoPlace) => {
    setValues((prev) => ({
      ...prev,
      latitude: selected.latitude.toFixed(4),
      longitude: selected.longitude.toFixed(4),
    }));
    setPlace(selected);
  }, []);

  const value = useMemo<QueryDraftValue>(
    () => ({ values, patch, place, setPlace, setCoords, setFromPlace }),
    [values, patch, place, setCoords, setFromPlace],
  );

  return <QueryDraftContext.Provider value={value}>{children}</QueryDraftContext.Provider>;
}

export function useQueryDraft(): QueryDraftValue {
  const value = useContext(QueryDraftContext);
  if (!value) throw new Error("useQueryDraft must be used within a QueryDraftProvider");
  return value;
}
