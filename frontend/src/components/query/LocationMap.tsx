import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
  disabled?: boolean;
  /** Overrides the default height/rounding — pass a Tailwind height class, e.g. "h-full". */
  className?: string;
  zoomControl?: boolean;
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

const PIN = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11Z" fill="#2451d6" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="11" r="2.6" fill="#fff"/>
  </svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

export function LocationMap({
  latitude,
  longitude,
  onChange,
  disabled,
  className,
  zoomControl = true,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastEmitted = useRef<string>("");

  // Initialise once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [latitude ?? 20, longitude ?? 0],
      zoom: latitude != null ? 6 : 2,
      zoomControl,
      attributionControl: true,
      // Leaflet fades new tiles in from opacity 0. That fade can get interrupted
      // by a resize happening at the same time (e.g. the sidebar collapse/expand
      // transition), leaving fully-loaded tiles stuck invisible. Skipping the
      // animation avoids the failure mode entirely — tiles just appear.
      fadeAnimation: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      if (disabled) return;
      const lat = round4(event.latlng.lat);
      const lng = round4(((event.latlng.lng + 540) % 360) - 180); // normalise to [-180, 180)
      lastEmitted.current = `${lat},${lng}`;
      onChangeRef.current(lat, lng);
    });

    mapRef.current = map;

    // Container may have been laid out after mount.
    setTimeout(() => map.invalidateSize(), 0);

    // The container can keep changing size after mount — e.g. the sidebar's
    // collapse/expand transition, or a window resize. Calling invalidateSize()
    // on every intermediate frame of that transition confuses Leaflet's tile
    // loading (it ends up covering only the size some mid-transition frame
    // had, leaving the rest blank once the animation settles). Debounce so it
    // only runs once, against the final, settled size.
    let settleTimer: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => map.invalidateSize(), 150);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(settleTimer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect external coordinate changes (search box, manual entry).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude == null || longitude == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const key = `${latitude},${longitude}`;
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: PIN }).addTo(map);
    }
    if (key !== lastEmitted.current) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 6));
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Map — click to set coordinates"
      className={className ?? "h-52 w-full overflow-hidden rounded-lg border border-slate-200"}
    />
  );
}
