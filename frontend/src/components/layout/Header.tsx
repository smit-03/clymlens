export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">ClymLens</h1>
          <p className="text-sm text-slate-500">Historical daily weather explorer</p>
        </div>
      </div>
    </header>
  );
}
