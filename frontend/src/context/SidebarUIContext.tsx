/* eslint-disable react-refresh/only-export-components -- context module: provider + hook belong together */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface SidebarUIValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const SidebarUIContext = createContext<SidebarUIValue | null>(null);

/** Whether the left column (quick fetch + dataset list) is collapsed to reclaim width. */
export function SidebarUIProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const value = useMemo(() => ({ collapsed, setCollapsed }), [collapsed]);
  return <SidebarUIContext.Provider value={value}>{children}</SidebarUIContext.Provider>;
}

export function useSidebarUI(): SidebarUIValue {
  const value = useContext(SidebarUIContext);
  if (!value) throw new Error("useSidebarUI must be used within a SidebarUIProvider");
  return value;
}

export function useOptionalSidebarUI(): SidebarUIValue | null {
  return useContext(SidebarUIContext);
}
