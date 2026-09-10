import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cx } from "../../lib/cx";

interface PanelProps extends ComponentPropsWithoutRef<"section"> {
  children: ReactNode;
  as?: "section" | "div" | "aside";
}

/** A restrained surface: soft border, white ground, gentle shadow. Use sparingly. */
export function Panel({ children, className, as: Tag = "section", ...rest }: PanelProps) {
  return (
    <Tag
      className={cx(
        "rounded-xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)] backdrop-blur-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
