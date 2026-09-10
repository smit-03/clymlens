import type { ReactNode } from "react";

import { DatabaseIcon, GlobeIcon } from "../ui/icons";
import { BrandMark } from "./BrandMark";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="leading-tight">
              <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">ClymLens</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Historical daily weather explorer
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-xs text-slate-500 md:flex">
            <span className="inline-flex items-center gap-1.5">
              <GlobeIcon className="h-3.5 w-3.5" />
              Open-Meteo archive
            </span>
            <span className="h-3 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-1.5">
              <DatabaseIcon className="h-3.5 w-3.5" />
              Amazon S3
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
