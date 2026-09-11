import type { ReactNode } from "react";

import { cx } from "../../lib/cx";

/** Hover/focus tooltip. `label` is also exposed to assistive tech via the wrapper. */
export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("group/tt relative inline-flex", className)} tabIndex={0} aria-label={label}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
