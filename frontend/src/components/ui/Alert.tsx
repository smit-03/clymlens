import type { ReactNode } from "react";

import { cx } from "../../lib/cx";

type Tone = "error" | "warning" | "info" | "success";

const TONES: Record<Tone, { wrap: string; icon: string; glyph: ReactNode }> = {
  error: {
    wrap: "border-rose-200 bg-rose-50 text-rose-800",
    icon: "text-rose-500",
    glyph: <path d="M12 9v4m0 4h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "text-amber-500",
    glyph: <path d="M12 9v4m0 4h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  },
  info: {
    wrap: "border-brand-200 bg-brand-50 text-brand-800",
    icon: "text-brand-500",
    glyph: <path d="M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />,
  },
  success: {
    wrap: "border-moss-500/25 bg-moss-500/10 text-moss-700",
    icon: "text-moss-600",
    glyph: <path d="m5 13 4 4L19 7" />,
  },
};

export function Alert({
  tone = "error",
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-lg border px-3.5 py-3 text-sm", t.wrap, className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cx("mt-0.5 h-4 w-4 shrink-0", t.icon)}
        aria-hidden="true"
      >
        {t.glyph}
      </svg>
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cx(title && "mt-0.5", "text-[13px] opacity-90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
