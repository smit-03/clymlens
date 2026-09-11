import type { ReactNode } from "react";

import { useSidebarUI } from "../../context/SidebarUIContext";
import { ChevronRightIcon } from "../ui/icons";

/**
 * One continuous card around the sidebar's sections (quick fetch + dataset
 * list), matching the main panel's border/shadow — the collapse toggle lives
 * inside the first section's own header, not as a separate row above the
 * card, so both columns always start flush with each other.
 */
export function CollapsibleSidebar({ children }: { children: ReactNode }) {
  const { collapsed, setCollapsed } = useSidebarUI();

  if (collapsed) {
    return (
      <div
        className="hidden lg:flex lg:w-fit lg:justify-start"
        style={{ animation: "clymlens-fade-in 220ms ease-out" }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show sidebar"
          title="Show sidebar"
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)] backdrop-blur-sm"
      style={{ animation: "clymlens-fade-in 220ms ease-out" }}
    >
      {children}
    </div>
  );
}
