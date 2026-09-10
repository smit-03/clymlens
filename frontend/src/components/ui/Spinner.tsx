import { cx } from "../../lib/cx";

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent",
        className ?? "h-4 w-4",
      )}
    />
  );
}
