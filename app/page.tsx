export default function Home() {
  return <main className="flex min-h-screen items-center justify-center px-6 py-16">
    <section className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
      <p className="mb-12 text-xs font-semibold tracking-[0.22em] text-muted">ATM ENTERPRISE</p>
      <span className="mb-6 inline-flex rounded-full bg-accent/30 px-3 py-1 text-xs font-semibold">PRIVATE WORKSPACE</span>
      <h1 className="text-4xl font-semibold tracking-tight">Content Studio</h1>
      <p className="mt-4 max-w-sm text-base leading-7 text-muted">One workspace for every site. Register your content schemas and keep each organization’s content together.</p>
      <p className="mt-10 border-t border-zinc-100 pt-6 text-sm text-muted">Your content starts with a connected site.</p>
    </section>
  </main>;
}
