import { AppShell } from "./components/layout/AppShell";
import { CollapsibleSidebar } from "./components/layout/CollapsibleSidebar";
import { DatasetBrowser } from "./components/datasets/DatasetBrowser";
import { MainFetchPanel } from "./components/query/MainFetchPanel";
import { SidebarLocationCard } from "./components/query/SidebarLocationCard";
import { DatasetWorkspace } from "./components/workspace/DatasetWorkspace";
import { cx } from "./lib/cx";
import { QueryDraftProvider } from "./context/QueryDraftContext";
import { SidebarUIProvider, useSidebarUI } from "./context/SidebarUIContext";
import { ToastProvider } from "./context/ToastContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";

function Layout() {
  const { collapsed } = useSidebarUI();

  return (
    <AppShell>
      {/*
       * Both columns are plain grid items — neither uses `sticky`. A sticky
       * sidebar previously trapped its own content off-screen when the form
       * grew, and separately drifted out of alignment with the main column
       * when a sibling's height changed (a known browser quirk with sticky
       * recalculation). Letting both columns flow with the page avoids both
       * bug classes entirely: they can never disagree on their start position.
       */}
      <div
        className={cx(
          "grid gap-5 lg:items-start lg:transition-[grid-template-columns] lg:duration-300 lg:ease-in-out",
          collapsed
            ? "lg:grid-cols-[40px_minmax(0,1fr)]"
            : "lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]",
        )}
      >
        <CollapsibleSidebar>
          <SidebarLocationCard />
          <DatasetBrowser />
        </CollapsibleSidebar>
        <div className="flex flex-col gap-5">
          <MainFetchPanel />
          <DatasetWorkspace />
        </div>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <QueryDraftProvider>
        <WorkspaceProvider>
          <SidebarUIProvider>
            <Layout />
          </SidebarUIProvider>
        </WorkspaceProvider>
      </QueryDraftProvider>
    </ToastProvider>
  );
}
