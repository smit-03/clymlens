import { cx } from "../../lib/cx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("block rounded-md bg-slate-200/70", className)}
      style={{ animation: "clymlens-pulse 1.6s ease-in-out infinite" }}
    />
  );
}
