import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <AppShell>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Weather workspace</h2>
        <p className="mt-1 text-sm text-slate-500">
          The query form, stored-file browser, and temperature visualization are wired up in
          the next milestones.
        </p>
      </section>
    </AppShell>
  );
}
