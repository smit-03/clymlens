import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cx } from "../../lib/cx";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, trailing, className, ...rest },
  ref,
) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
            "placeholder:text-slate-400 focus:outline-none focus:ring-2",
            trailing && "pr-9",
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-slate-300 focus:border-brand-400 focus:ring-brand-100",
          )}
          {...rest}
        />
        {trailing && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
            {trailing}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
