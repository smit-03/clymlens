import type { ReactNode } from "react";

import { ArrowUpRightIcon, DatabaseIcon, GlobeIcon } from "../ui/icons";
import { BrandMark } from "./BrandMark";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
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

          <div className="flex items-center gap-3 text-xs text-slate-500 sm:gap-4">
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <GlobeIcon className="h-3.5 w-3.5 text-slate-400" />
              Open-Meteo
            </span>
            <span className="hidden h-3 w-px bg-slate-200 md:block" />
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <DatabaseIcon className="h-3.5 w-3.5 text-slate-400" />
              Amazon S3
            </span>
            {API_BASE && (
              <>
                <span className="hidden h-3 w-px bg-slate-200 sm:block" />
                <a
                  href={`${API_BASE}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  API
                  <ArrowUpRightIcon className="h-3 w-3" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
