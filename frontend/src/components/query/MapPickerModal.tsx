import { lazy, Suspense, useState } from "react";

import { useQueryDraft } from "../../context/QueryDraftContext";
import { countryFlag } from "../../lib/countryFlag";
import { placeRegion, type GeoPlace } from "../../lib/geocoding";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Skeleton } from "../ui/Skeleton";
import { CitySearch } from "./CitySearch";

const LocationMap = lazy(() =>
  import("./LocationMap").then((m) => ({ default: m.LocationMap })),
);

function toNumberOrNull(raw: string): number | null {
  const n = Number(raw.trim());
  return raw.trim() !== "" && Number.isFinite(n) ? n : null;
}

export function MapPickerModal({ onClose }: { onClose: () => void }) {
  const { values, setCoords, setFromPlace } = useQueryDraft();
  const [lat, setLat] = useState(toNumberOrNull(values.latitude));
  const [lon, setLon] = useState(toNumberOrNull(values.longitude));
  const [place, setPlace] = useState<GeoPlace | null>(null);

  function handleMapChange(nextLat: number, nextLon: number) {
    setLat(nextLat);
    setLon(nextLon);
    setPlace(null);
  }

  function handlePlace(selected: GeoPlace) {
    setLat(selected.latitude);
    setLon(selected.longitude);
    setPlace(selected);
  }

  function confirm() {
    if (lat == null || lon == null) return;
    if (place) setFromPlace(place);
    else setCoords(lat, lon);
    onClose();
  }

  return (
    <Modal
      title="Pick a location"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={confirm} disabled={lat == null || lon == null}>
            Use this location
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <CitySearch onSelect={handlePlace} />
        <Suspense fallback={<Skeleton className="h-[46vh] w-full rounded-lg" />}>
          <LocationMap
            latitude={lat}
            longitude={lon}
            onChange={handleMapChange}
            className="h-[46vh] w-full overflow-hidden rounded-lg border border-slate-200"
          />
        </Suspense>
        <p className="text-xs text-slate-500">
          {lat != null && lon != null ? (
            <>
              {place ? (
                <span className="mr-1">
                  {countryFlag(place.countryCode)} {place.name}
                  {placeRegion(place) && <span className="text-slate-400"> · {placeRegion(place)}</span>} ·{" "}
                </span>
              ) : null}
              {lat.toFixed(4)}, {lon.toFixed(4)}
            </>
          ) : (
            "Click the map or search for a place."
          )}
        </p>
      </div>
    </Modal>
  );
}
