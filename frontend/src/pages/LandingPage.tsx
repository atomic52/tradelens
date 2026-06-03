import { Link } from "react-router-dom";

// ─── Fake mini dashboard for feature mockups ────────────────────────────────

function MockStatCard({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-800/70 rounded-xl border border-slate-700/60 p-3">
      <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      <p className={`${color} font-bold text-lg mt-1 tabular-nums`}>{value}</p>
    </div>
  );
}

function MockDashboard() {
  const bars = [42, 28, 68, 55, 22, 38, 80, 92, 17, 63, 47, 33, 57, 75, 24, 88];
  return (
    <div className="bg-[#0b0f1a] rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/60 overflow-hidden">
      {/* window chrome */}
      <div className="bg-slate-800/80 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
        </div>
        <div className="flex-1 text-center text-[10px] text-slate-600 font-medium">Dashboard — All time</div>
        <div className="text-[10px] text-slate-700 font-medium">All ↓</div>
      </div>

      <div className="p-4 space-y-3">
        {/* stat row */}
        <div className="grid grid-cols-4 gap-2">
          <MockStatCard label="Net P&L" value="+$2,841" color="text-emerald-400" />
          <MockStatCard label="Win Rate" value="62%" />
          <MockStatCard label="Profit Factor" value="1.84" />
          <MockStatCard label="Avg Hold" value="2d 4h" />
        </div>

        {/* daily bars */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-[10px] font-semibold">Daily P&L</p>
            <p className="text-slate-600 text-[10px]">16 trading days</p>
          </div>
          <div className="flex items-end gap-[3px] h-14">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${i % 3 === 1 ? "bg-red-500/70" : "bg-emerald-500/70"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* cumulative curve (SVG) */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-[10px] font-semibold">Cumulative P&L</p>
            <p className="text-emerald-400 text-[10px] font-semibold">+$2,841</p>
          </div>
          <svg viewBox="0 0 280 48" className="w-full h-10" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,46 C15,42 25,40 45,36 C65,32 75,34 95,27 C115,20 125,23 145,15 C165,8 175,11 195,7 C215,3 235,5 255,2 C265,1 270,1 280,1" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M0,46 C15,42 25,40 45,36 C65,32 75,34 95,27 C115,20 125,23 145,15 C165,8 175,11 195,7 C215,3 235,5 255,2 C265,1 270,1 280,1 L280,48 L0,48 Z" fill="url(#lg)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MockImport() {
  return (
    <div className="bg-[#0b0f1a] rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/60 overflow-hidden">
      <div className="bg-slate-800/80 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
        </div>
        <div className="flex-1 text-center text-[10px] text-slate-600 font-medium">Upload</div>
      </div>
      <div className="p-4 space-y-3">
        {/* import cards */}
        {[
          { title: "Trade History CSV", badge: "CSV", desc: "Stocks & options activity report" },
          { title: "Futures & Event Contracts", badge: "PDF", desc: "Monthly futures statement" },
          { title: "Individual Investing Statement", badge: "PDF", desc: "Monthly investing account PDF" },
        ].map((c) => (
          <div key={c.title} className="bg-slate-800/70 rounded-xl border border-slate-700/50 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-indigo-400">
              {c.badge}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{c.title}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{c.desc}</p>
            </div>
            <div className="ml-auto">
              <div className="bg-indigo-600/90 rounded-md px-2.5 py-1 text-[10px] text-white font-medium">Upload</div>
            </div>
          </div>
        ))}
        {/* success banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-emerald-400 text-[10px] font-medium">Uploaded 28 trades (112 executions) — Jan 2026 Futures</p>
        </div>
      </div>
    </div>
  );
}

function MockJournal() {
  const trades = [
    { symbol: "MNQ", dir: "LONG", pnl: "+$480", date: "Jan 14", tags: ["breakout", "trend"] },
    { symbol: "MES", dir: "SHORT", pnl: "-$120", date: "Jan 15", tags: ["reversal"] },
    { symbol: "NQ", dir: "LONG", pnl: "+$1,240", date: "Jan 16", tags: ["earnings", "gap-up"] },
  ];
  return (
    <div className="bg-[#0b0f1a] rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/60 overflow-hidden">
      <div className="bg-slate-800/80 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
        </div>
        <div className="flex-1 text-center text-[10px] text-slate-600 font-medium">Trade Log</div>
      </div>
      <div className="p-4 space-y-2">
        {trades.map((t) => (
          <div key={t.symbol + t.date} className="bg-slate-800/70 rounded-xl border border-slate-700/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-white text-sm font-bold">{t.symbol}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.dir === "LONG" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {t.dir}
                </span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${t.pnl.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                {t.pnl}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 text-[10px]">{t.date}</span>
              <span className="text-slate-700">·</span>
              {t.tags.map((tag) => (
                <span key={tag} className="bg-indigo-500/15 text-indigo-400 text-[9px] font-medium px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        {/* notes preview */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-3">
          <p className="text-slate-600 text-[10px] uppercase font-semibold tracking-wider mb-1.5">Notes</p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Strong breakout above VWAP on high volume. Thesis confirmed — held through the first pullback. Size was right.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "#07090f" }}>

      {/* ── Floating pill nav ────────────────────────────────────── */}
      <header className="fixed top-5 left-0 right-0 z-20 flex justify-center px-5">
        <div className="flex items-center gap-4 rounded-2xl px-5 h-12 w-full max-w-2xl"
          style={{
            background: "rgba(22, 28, 45, 0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
          <span className="text-xl font-black tracking-tighter leading-none mr-auto"
            style={{ color: "#f1f5f9" }}>
            Trade<span style={{
              background: "linear-gradient(90deg,#818cf8,#c084fc,#f472b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Lens</span>
          </span>
          <Link to="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors whitespace-nowrap">
            Sign in
          </Link>
          <Link to="/register"
            className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap">
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 pt-36 pb-24 min-h-screen">
        {/* atmosphere */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 100% 60% at 50% -5%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(192,132,252,0.07) 0%, transparent 60%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.04) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }} />

        {/* eyebrow label */}
        <div className="relative flex items-center gap-3 mb-8">
          <div className="h-px w-8" style={{ background: "linear-gradient(to right, transparent, rgba(129,140,248,0.4))" }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-400">Trade Journal</span>
          <div className="h-px w-8" style={{ background: "linear-gradient(to left, transparent, rgba(129,140,248,0.4))" }} />
        </div>

        {/* MASSIVE wordmark */}
        <h1 className="relative select-none mb-6 leading-none tracking-tighter"
          style={{
            fontSize: "clamp(68px, 11vw, 130px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            filter: "drop-shadow(0 0 70px rgba(129,140,248,0.28))",
          }}>
          <span style={{ color: "#f1f5f9" }}>Trade</span>
          <span style={{
            background: "linear-gradient(100deg, #818cf8 0%, #c084fc 55%, #f472b6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Lens</span>
        </h1>

        {/* tagline */}
        <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
          Import your Robinhood statements, <span className="text-slate-200 font-medium">understand every trade</span>, and sharpen your edge — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-xl shadow-black/30">
            Start for free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link to="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            Sign in
          </Link>
        </div>
        <p className="text-xs mt-3" style={{ color: "rgba(100,116,139,0.7)" }}>10 free uploads · no credit card required</p>

        {/* stats strip */}
        <div className="relative mt-20 pt-8 w-full max-w-2xl mx-auto grid grid-cols-4 divide-x"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" }}>
          {[
            { value: "11+", label: "Metrics" },
            { value: "FIFO", label: "Matching" },
            { value: "3", label: "Formats" },
            { value: "Free", label: "To start" },
          ].map((s) => (
            <div key={s.label} className="px-6 text-center"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-xl font-black text-white tracking-tight">{s.value}</p>
              <p className="text-[11px] mt-1 uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.7)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature 1: Dashboard analytics ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* mockup left */}
          <div className="flex-1 w-full max-w-lg">
            <MockDashboard />
          </div>
          {/* copy right */}
          <div className="flex-1 max-w-md">
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">Analytics</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-5">
              Every metric<br />that actually matters
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Net P&L, win rate, profit factor, expectancy, max drawdown, avg hold time, current streak, and more — all on one dashboard. Filter by today, this week, month, YTD, or all-time.
            </p>
            <ul className="space-y-3">
              {[
                "11+ performance metrics in one view",
                "Daily P&L bars + cumulative equity curve",
                "Per-symbol breakdown and win rate",
                "Streak tracking: current, best win, worst loss",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)" }}>
                    <svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)" }} />
      </div>

      {/* ── Feature 2: Import ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
          {/* mockup right (reversed) */}
          <div className="flex-1 w-full max-w-lg">
            <MockImport />
          </div>
          {/* copy left */}
          <div className="flex-1 max-w-md">
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">Upload</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-5">
              Statements in.<br />Data out. Instantly.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Works with all three Robinhood statement types — Trade History CSVs, Futures & Event Contracts PDFs, and Individual Investing Statements.
            </p>
            <ul className="space-y-3">
              {[
                "Trade History CSV, Futures & Event Contracts, Individual Investing Statement",
                "FIFO trade matching across executions",
                "SHA-256 deduplication — import safely twice",
                "Futures multipliers: ES, NQ, MNQ, GC, SI…",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)" }}>
                    <svg className="w-2.5 h-2.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)" }} />
      </div>

      {/* ── Feature 3: Journal ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* mockup left */}
          <div className="flex-1 w-full max-w-lg">
            <MockJournal />
          </div>
          {/* copy right */}
          <div className="flex-1 max-w-md">
            <p className="text-pink-400 text-xs font-semibold uppercase tracking-widest mb-4">Journal</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-5">
              Every trade has<br />a story. Record it.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              The trade log shows every position with full execution detail. Add tags and notes directly to any trade — revisit your thesis, understand what worked, and build real pattern recognition over time.
            </p>
            <ul className="space-y-3">
              {[
                "Full execution detail: entry, exit, fees, quantity",
                "Custom tags (breakout, scalp, earnings…)",
                "Free-form notes on each trade",
                "Sort and filter by symbol, status, or direction",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(244,114,182,0.15)", border: "1px solid rgba(244,114,182,0.3)" }}>
                    <svg className="w-2.5 h-2.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Up and running in minutes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* connector line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
              style={{ background: "linear-gradient(to right, rgba(99,102,241,0.3), rgba(192,132,252,0.3), rgba(244,114,182,0.3))" }} />

            {[
              {
                step: "01",
                color: "text-indigo-400",
                ring: "rgba(99,102,241,0.2)",
                border: "rgba(99,102,241,0.3)",
                title: "Create your account",
                desc: "Sign up free in seconds — no credit card needed. Create a trading account in Settings to organise your imports.",
              },
              {
                step: "02",
                color: "text-violet-400",
                ring: "rgba(139,92,246,0.2)",
                border: "rgba(139,92,246,0.3)",
                title: "Import your statements",
                desc: "Upload a Robinhood PDF or CSV. TradeLens parses every execution and matches trades automatically using FIFO.",
              },
              {
                step: "03",
                color: "text-pink-400",
                ring: "rgba(244,114,182,0.15)",
                border: "rgba(244,114,182,0.25)",
                title: "Understand your performance",
                desc: "Explore P&L charts, win rate, expectancy, and your full trade history. Add notes to any trade to capture your thinking.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10"
                  style={{ background: item.ring, border: `1px solid ${item.border}` }}>
                  <span className={`text-lg font-black ${item.color}`}>{item.step}</span>
                </div>
                <h3 className="font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)",
        }} />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Simple, honest pricing
            </h2>
            <p className="text-slate-400 mt-4 text-base max-w-sm mx-auto">Start free. Upgrade when you're ready to go deeper.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl p-8 flex flex-col" style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
              </div>
              <p className="text-slate-500 text-sm mb-8">Forever free. No credit card needed.</p>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  "10 uploads total",
                  "1 trading account",
                  "All 3 statement types",
                  "Full analytics dashboard",
                  "Trade journal with notes & tags",
                  "FIFO trade matching",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className="block text-center py-3 rounded-xl text-sm font-semibold text-slate-300 transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-8 flex flex-col relative overflow-hidden" style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)",
              border: "1px solid rgba(139,92,246,0.4)",
            }}>
              {/* glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{
                background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
              }} />
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Pro</p>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(139,92,246,0.25)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.4)" }}>
                  Most popular
                </span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">$20</span>
                <span className="text-slate-400 text-sm mb-1.5">/month</span>
              </div>
              <p className="text-slate-400 text-sm mb-8">Everything in Free, plus:</p>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  "Unlimited uploads",
                  "Up to 5 trading accounts",
                  "All statement types",
                  "Full analytics dashboard",
                  "Trade journal with notes & tags",
                  "Cancel any time",
                ].map((f, i) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                    <svg className={`w-4 h-4 flex-shrink-0 ${i < 2 ? "text-violet-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className="block text-center py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(100deg, #6366f1, #8b5cf6)" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Start free, then upgrade
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }} />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Ready to see<br />
            <span style={{
              background: "linear-gradient(100deg, #818cf8, #c084fc, #f472b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>your edge?</span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg leading-relaxed max-w-md mx-auto">
            Start free, upgrade when you're ready. No credit card required to get started.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-2xl shadow-black/40">
            Get started free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="text-xs mt-4" style={{ color: "rgba(100,116,139,0.6)" }}>No credit card required</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs"
          style={{ color: "rgba(100,116,139,0.5)" }}>
          <span className="font-black text-sm tracking-tighter" style={{ color: "#475569" }}>
            Trade<span style={{
              background: "linear-gradient(90deg,#818cf8,#c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Lens</span>
          </span>
          <span>Trade smarter, not harder.</span>
        </div>
      </footer>

    </div>
  );
}
