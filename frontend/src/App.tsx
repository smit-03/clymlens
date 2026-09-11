import { AppShell } from "./components/layout/AppShell";
import { DatasetBrowser } from "./components/datasets/DatasetBrowser";
import { QueryForm } from "./components/query/QueryForm";
import { DatasetWorkspace } from "./components/workspace/DatasetWorkspace";
import { WorkspaceProvider } from "./context/WorkspaceContext";

export default function App() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start xl:grid-cols-[380px_minmax(0,1fr)]">
          {/*
           * The whole left column is the scroll region on large screens (sticky +
           * its own overflow) so it can never grow taller than the viewport and
           * clip its own content — whatever doesn't fit scrolls inside this box.
           */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-1 lg:pr-0.5">
            <QueryForm />
            <DatasetBrowser />
          </div>
          <DatasetWorkspace />
        </div>
      </AppShell>
    </WorkspaceProvider>
  );
}
