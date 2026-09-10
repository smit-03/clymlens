import { cx } from "../../lib/cx";

/** ClymLens mark: a stylized lens iris over a horizon — climate data, brought into focus. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" opacity="0.55" />
        <path
          d="M5 13.5c2-2.2 4-2.2 6 0s4 2.2 6 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="9" r="1.9" fill="currentColor" />
      </svg>
    </span>
  );
}
