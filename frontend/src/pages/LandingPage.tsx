import { Link } from "react-router-dom";

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: "PDF & CSV Import",
    desc: "Upload Robinhood futures PDFs, monthly statements, or CSV exports. SHA-256 deduplication prevents double-importing.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: "Deep Analytics",
    desc: "Win rate, profit factor, expectancy, max drawdown, streaks, and 16+ metrics — filterable by today, week, month, YTD, or all-time.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "P&L Visualisations",
    desc: "Daily bar charts, cumulative equity curves, P&L by hour of day, and per-symbol breakdowns — all on one dashboard.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    title: "Trade Journal",
    desc: "Every trade with full execution detail. Add tags and notes to record your thesis, review your reasoning, and learn from each trade.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
    title: "Futures & Options",
    desc: "Correct contract multipliers for ES, NQ, SI, GC and more. Options chains and event contracts (Kalshi) handled natively.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Private by Default",
    desc: "Your data is stored privately under your account only. Nothing is shared or sold. Delete everything at any time.",
  },
];

const metrics = [
  { label: "Net P&L", color: "text-emerald-400" },
  { label: "Win Rate", color: "text-sky-400" },
  { label: "Profit Factor", color: "text-violet-400" },
  { label: "Expectancy", color: "text-amber-400" },
  { label: "Max Drawdown", color: "text-rose-400" },
  { label: "Avg Hold Time", color: "text-teal-400" },
  { label: "Win Streak", color: "text-emerald-400" },
  { label: "Trade Count", color: "text-sky-400" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-20 bg-surface/80 backdrop-blur border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-white tracking-tight text-base">
            Trade<span className="text-brand-400">Lens</span>
          </span>
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded-md font-medium transition-colors"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-surface pt-14">
        {/* subtle grid texture */}
        <div
          className="absolute inset-0 pt-14 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.07) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-24 text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-brand-950 border border-brand-800 text-brand-300 text-xs font-medium px-3 py-1 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block animate-pulse" />
            Built for active traders
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Your trades.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              Understood.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            TradeLens turns your Robinhood statements into a clear picture of your trading performance.
            Import PDFs and CSVs, analyse every metric that matters, and journal your trades — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              to="/register"
              className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-brand-900/40"
            >
              Start for free →
            </Link>
            <Link
              to="/login"
              className="border border-surface-border text-slate-300 hover:text-white hover:border-slate-500 px-8 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-xs text-slate-600">5 free imports · no credit card required</p>

          {/* floating metrics strip */}
          <div className="mt-16 overflow-hidden relative">
            <div className="flex gap-3 justify-center flex-wrap">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-surface-card border border-surface-border rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2"
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${m.color}`} />
                  <span className="text-slate-300">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "16+",    label: "Performance metrics" },
            { value: "3",      label: "Import formats" },
            { value: "FIFO",   label: "Trade matching" },
            { value: "Free",   label: "To get started" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Everything you need to trade better
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base">
            Stop guessing what's working. TradeLens gives you the data to make better decisions.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md hover:shadow-brand-100/50 transition-all bg-white"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Up and running in minutes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up free — no credit card needed. Create a trading account in Settings to get started.",
              },
              {
                step: "02",
                title: "Import your statements",
                desc: "Upload a Robinhood PDF or CSV. TradeLens parses executions and matches trades automatically using FIFO.",
              },
              {
                step: "03",
                title: "Understand your performance",
                desc: "Explore P&L charts, analytics, and your full trade history. Add notes and tags to any trade.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <p className="text-6xl font-extrabold text-slate-100 leading-none select-none mb-4">{item.step}</p>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to see your edge?
          </h2>
          <p className="text-slate-400 mb-10 max-w-md mx-auto">
            Start with 5 free imports. Understand what's working before you commit to more.
          </p>
          <Link
            to="/register"
            className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-3.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-brand-900/40 inline-block"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-400">
            Trade<span className="text-brand-400">Lens</span>
          </span>
          <span>Trade smarter, not harder.</span>
        </div>
      </footer>
    </div>
  );
}
