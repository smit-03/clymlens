import type { ReactNode } from "react";

import { cx } from "../../lib/cx";

type Tone = "neutral" | "brand" | "moss" | "warm" | "cool";

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  moss: "bg-moss-500/10 text-moss-700 ring-moss-500/20",
  warm: "bg-orange-50 text-orange-700 ring-orange-100",
  cool: "bg-sky-50 text-sky-700 ring-sky-100",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
