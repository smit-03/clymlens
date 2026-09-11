import { useEffect, useId, useRef, useState } from "react";

import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { countryFlag } from "../../lib/countryFlag";
import { cx } from "../../lib/cx";
import { placeRegion, searchPlaces, type GeoPlace } from "../../lib/geocoding";
import { SearchIcon } from "../ui/icons";
import { Spinner } from "../ui/Spinner";

interface CitySearchProps {
  onSelect: (place: GeoPlace) => void;
  disabled?: boolean;
}

export function CitySearch({ onSelect, disabled }: CitySearchProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const debounced = useDebouncedValue(query, 300);

  useEffect(() => {
    const term = debounced.trim();
    if (term.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    searchPlaces(term, controller.signal)
      .then((places) => {
        setResults(places);
        setActiveIndex(places.length > 0 ? 0 : -1);
        setStatus("idle");
        setOpen(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(place: GeoPlace) {
    onSelect(place);
    setQuery(place.name);
    setOpen(false);
    setResults([]);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && (results.length > 0 || status === "error");

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={`${listId}-input`} className="block text-[13px] font-medium text-slate-700">
        Search for a place
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="e.g. Mumbai, Reykjavík, São Paulo"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          className={cx(
            "block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 shadow-sm",
            "placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
          )}
        />
        {status === "loading" && (
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
            <Spinner className="h-4 w-4" />
          </span>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {status === "error" && (
            <li className="px-3 py-2 text-xs text-slate-400">Couldn't reach the place search.</li>
          )}
          {results.map((place, i) => (
            <li
              key={place.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(place);
              }}
              className={cx(
                "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm",
                i === activeIndex ? "bg-brand-50" : "hover:bg-slate-50",
              )}
            >
              <span className="text-base leading-none">{countryFlag(place.countryCode) || "📍"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-800">{place.name}</span>
                {placeRegion(place) && (
                  <span className="block truncate text-xs text-slate-400">{placeRegion(place)}</span>
                )}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-300">
                {place.latitude.toFixed(2)}, {place.longitude.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
