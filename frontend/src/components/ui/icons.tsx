import type { SVGProps } from "react";

/** Small inline icon set (1.75 stroke, 24 grid) — avoids an icon-library dependency. */
function Base({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Base>
);

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4m8-4v4" />
  </Base>
);

export const WindIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h8" />
  </Base>
);

export const ThermometerIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M14 14.8V5a2.5 2.5 0 0 0-5 0v9.8a4.5 4.5 0 1 0 5 0Z" />
  </Base>
);

export const LayersIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="m3 13 9 5 9-5M3 18l9 5 9-5" />
  </Base>
);

export const DatabaseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <ellipse cx="12" cy="6" rx="7.5" ry="3" />
    <path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
  </Base>
);

export const ActivityIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </Base>
);

export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.9 6 4 9-.1 3-1.5 6.4-4 9-2.5-2.6-3.9-6-4-9 .1-3 1.5-6.4 4-9Z" />
  </Base>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Base>
);

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M20 11a8 8 0 0 0-13.7-5L4 8m0 0V3m0 5h5M4 13a8 8 0 0 0 13.7 5L20 16m0 0v5m0-5h-5" />
  </Base>
);

export const ArrowUpRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Base>
);

export const ChevronLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="m15 6-6 6 6 6" />
  </Base>
);

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="m9 6 6 6-6 6" />
  </Base>
);

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const ExpandIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M9 4H4v5M4 4l6 6M15 20h5v-5M20 20l-6-6" />
  </Base>
);

export const CrosshairIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </Base>
);
