import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiZap, FiShield, FiTruck, FiBarChart2,
  FiUsers, FiCpu, FiDatabase, FiGlobe, FiLock,
  FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiClock,
  FiChevronDown, FiChevronUp, FiMap, FiDollarSign,
  FiSettings, FiActivity
} from 'react-icons/fi';

/**
 * Back navigation hook — safely goes back or falls back to home.
 */
const useSmartBack = () => {
  const navigate = useNavigate();
  return () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
};

/* ── Expandable FAQ / Accordion ──────────────────────────────────── */
const Accordion = ({ items }) => {
  const [open, setOpen] = useState(null);
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {items.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span>{item.q}</span>
            {open === i
              ? <FiChevronUp className="w-4 h-4 shrink-0 text-primary-500" />
              : <FiChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
          </button>
          {open === i && (
            <div className="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/20">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Stat badge ───────────────────────────────────────────────────── */
const StatBadge = ({ value, label, icon: Icon }) => (
  <div className="flex flex-col items-center p-5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
    <Icon className="w-6 h-6 text-primary-500 mb-2" />
    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</span>
    <span className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5">{label}</span>
  </div>
);

/* ── Section heading ──────────────────────────────────────────────── */
const SectionHeading = ({ tag, title, sub }) => (
  <div className="mb-10">
    {tag && (
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2">
        {tag}
      </span>
    )}
    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h2>
    {sub && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">{sub}</p>}
  </div>
);

/* ── Main component ───────────────────────────────────────────────── */
export const LearnMore = () => {
  const goBack = useSmartBack();

  const pillars = [
    {
      icon: FiTruck,
      title: 'Unified Fleet Command',
      body: 'Every vehicle, driver, and route lives in a single pane of glass. From registration plates and insurance deadlines to real-time trip status — TransitOps gives fleet managers total situational awareness without juggling spreadsheets or disconnected apps.',
    },
    {
      icon: FiBarChart2,
      title: 'Intelligent Analytics Engine',
      body: 'Built-in analytical reports slice your operational data by route profitability, driver performance, fuel variance, and maintenance spend. Drill down from fleet-wide KPIs to individual vehicle ledgers in seconds.',
    },
    {
      icon: FiShield,
      title: 'Enterprise-Grade Security',
      body: 'Layered authentication with OTP verification, IP-level brute-force lockouts, session-only token storage, and role-based access control ensure that only the right people see the right data — every single time.',
    },
    {
      icon: FiCpu,
      title: 'Adaptive Performance Architecture',
      body: 'The platform is engineered around lazy-loaded micro-bundles, server-side pagination, in-memory API caching, and selective read indexes — so dashboards stay instant even as your fleet data grows into the hundreds of thousands of records.',
    },
    {
      icon: FiUsers,
      title: 'Role-Driven Access Model',
      body: 'Five distinct operational roles — Super Admin, Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst — each with precisely scoped permissions. No over-privileged accounts; no operational blind spots.',
    },
    {
      icon: FiRefreshCw,
      title: 'Continuous Operational Sync',
      body: 'Real-time event listeners and optimistic UI patterns mean the interface responds the instant you click — no refresh cycles, no stale data banners, no waiting for the server to catch up.',
    },
  ];

  const capabilities = [
    { icon: FiMap, title: 'Route & Trip Planning', desc: 'Schedule multi-stop routes, assign drivers, track dispatch status, and auto-calculate distance and fuel estimates per trip leg.' },
    { icon: FiDollarSign, title: 'Financial Ledger', desc: 'Capture fuel receipts, maintenance invoices, toll charges, and miscellaneous expenses — all reconciled against trip revenue in one ledger.' },
    { icon: FiActivity, title: 'Maintenance Forecasting', desc: 'Predictive maintenance alerts based on odometer intervals, last service date, and manufacturer schedules prevent costly breakdowns before they happen.' },
    { icon: FiDatabase, title: 'Structured 3NF Schema', desc: 'A fully normalized PostgreSQL schema eliminates data redundancy, preserves referential integrity, and supports audit trails across all operational tables.' },
    { icon: FiSettings, title: 'Platform Configuration', desc: 'Administrators can tune access policies, adjust lockout thresholds, manage user roles, and configure notification rules without touching code.' },
    { icon: FiGlobe, title: 'Light & Dark Mode UI', desc: 'A carefully engineered dual-theme system with smooth transitions adapts to user preference — desktop, tablet, or mobile.' },
  ];

  const techStack = [
    { layer: 'Frontend', items: ['React 18 (Concurrent)', 'Vite (ESM bundler)', 'Tailwind CSS (JIT)', 'React Router v6', 'Axios (intercepted)', 'React Icons'] },
    { layer: 'Backend', items: ['Node.js 20 LTS', 'Express 4 (REST API)', 'JWT (session-scoped)', 'Bcrypt (password hashing)', 'Nodemailer (OTP delivery)', 'CORS + Helmet'] },
    { layer: 'Database', items: ['PostgreSQL 15', '3NF normalized schema', 'Read-optimized indexes', 'Connection pooling (pg-pool)', 'Server-side pagination', 'Parameterized queries'] },
    { layer: 'Security', items: ['IP-level brute-force guard', 'OTP 2-factor verification', 'Role-based access control', 'Session-only token storage', 'Rate limiting', 'Input sanitization'] },
  ];

  const faqs = [
    {
      q: 'What makes TransitOps different from generic fleet software?',
      a: 'TransitOps is built specifically for operations teams — not just GPS tracking. It combines financial ledgers, driver credentialing, maintenance forecasting, and role-gated dashboards in one normalized data model, with sub-second load times thanks to lazy chunk loading and API caching.',
    },
    {
      q: 'How does the IP brute-force protection work?',
      a: 'After a configurable number of consecutive failed login attempts from the same IP address, that IP is temporarily locked out — preventing access to the login, register, and all protected routes. The cooldown timer is persisted server-side, so reopening the browser does not reset it. Only the landing page and blocked-notice page remain accessible.',
    },
    {
      q: 'Is my fleet data ever shared with third parties?',
      a: 'Never. All telemetry, driver records, financial entries, and operational data belong exclusively to your organization. TransitOps does not sell, aggregate, or monetize any customer data for advertising, analytics resale, or any other commercial purpose.',
    },
    {
      q: 'Can I control what each staff member can see?',
      a: 'Yes. The platform enforces five roles: Super Admin, Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst. Each role has precisely scoped read, write, and delete permissions at both the API and UI level — unknown roles are rejected at the route level before any data is fetched.',
    },
    {
      q: 'How does the OTP email verification work?',
      a: 'On registration, a time-limited one-time password is sent to the provided work email. The account is only activated after successful OTP entry. This ensures only real, organization-valid email addresses are used for account creation — eliminating disposable or bot registrations.',
    },
    {
      q: 'How fast does the dashboard load?',
      a: 'The dashboard is split into lazy-loaded code chunks that only fetch on demand. Stats are cached server-side for 5 seconds between requests, and all list views use server-side pagination (25 records per page) so you never wait for 10,000 rows to load. Typical first contentful paint on a standard connection is under 1 second.',
    },
    {
      q: 'What happens if a scheduled maintenance date is missed?',
      a: 'The platform flags overdue maintenance records in both the maintenance list view and the vehicle detail page, with a visual alert status indicator. Financial Analysts and Fleet Managers receive contextual warnings when adding new trips that involve vehicles with overdue service.',
    },
    {
      q: 'Is there a mobile app?',
      a: 'TransitOps is a fully responsive progressive web application. It adapts to any screen size — desktop, tablet, or mobile — without requiring a native app install. Touch interactions are optimized with tap-highlight removal and manipulation gestures for an app-like feel on iOS and Android.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100">

      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center font-black text-white dark:text-slate-950 text-[10px]">TO</div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">TransitOps</span>
            <span className="hidden sm:inline-block text-slate-400 dark:text-slate-600 mx-1">·</span>
            <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400">Platform Overview</span>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-20">

        {/* ── Hero ────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-4">
            Platform Deep Dive
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            How TransitOps Works — <br className="hidden sm:block" />
            <span className="text-slate-500 dark:text-slate-400">From the Ground Up</span>
          </h1>
          <p className="mt-5 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            TransitOps is a full-stack fleet operations command center built for logistics organizations
            that need real control — not just a dashboard with colored tiles. Here is everything that
            powers the platform, explained without marketing fluff.
          </p>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBadge icon={FiTruck} value="Unlimited" label="Vehicles supported" />
          <StatBadge icon={FiUsers} value="5 Roles" label="Granular access model" />
          <StatBadge icon={FiZap} value="<1s" label="Dashboard first load" />
          <StatBadge icon={FiLock} value="IP-level" label="Brute-force protection" />
        </div>

        {/* ── Six Pillars ────────────────────────────────────────── */}
        <section>
          <SectionHeading
            tag="Core Pillars"
            title="Six Foundations That Define the Platform"
            sub="Every design decision in TransitOps is rooted in one of these six operational priorities."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-slate-700 dark:text-slate-200" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Operational Capabilities ────────────────────────────── */}
        <section>
          <SectionHeading
            tag="Capabilities"
            title="What the Platform Actually Does"
            sub="A breakdown of every operational module available inside the TransitOps dashboard."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {capabilities.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mt-0.5">
                  <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Security Architecture ──────────────────────────────── */}
        <section className="bg-slate-900 dark:bg-slate-800/80 rounded-2xl p-8 sm:p-10 text-white">
          <SectionHeading
            tag="Security Architecture"
            title="Defence-in-Depth, Not Afterthought"
            sub="Security is layered across every tier — from the network edge to the database row."
          />
          <div className="grid sm:grid-cols-2 gap-5 mt-2">
            {[
              { icon: FiLock, title: 'IP Brute-Force Lockout', desc: 'After N failed logins, the source IP is blocked at the API level. The timer is server-authoritative — clearing browser storage does not reset it.' },
              { icon: FiCheckCircle, title: 'OTP Email Verification', desc: 'New accounts require time-limited OTP confirmation to a real organizational email, blocking bot signups and disposable addresses.' },
              { icon: FiAlertTriangle, title: 'Session-Only Token Storage', desc: 'JWT access tokens are stored in sessionStorage — never localStorage. They are wiped automatically when the browser tab closes.' },
              { icon: FiUsers, title: 'Role-Gated API Endpoints', desc: 'Every protected route validates the JWT role claim server-side before any database query executes. UI visibility alone is never trusted.' },
              { icon: FiClock, title: 'Cooldown Synchronization', desc: 'Lockout timers are seeded from server-returned blockedUntil timestamps. Re-opening the browser restores the real remaining time — not a fresh 15-minute window.' },
              { icon: FiDatabase, title: 'Parameterized Queries', desc: 'All database interactions use pg-pool with parameterized prepared statements — SQL injection is structurally impossible at the query layer.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <Icon className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-white">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech Stack ─────────────────────────────────────────── */}
        <section>
          <SectionHeading
            tag="Technology Stack"
            title="Open, Modern, Production-Proven"
            sub="No proprietary lock-in. Every technology choice is justified by performance, security, or maintainability."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {techStack.map(({ layer, items }) => (
              <div key={layer} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">{layer}</h3>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Performance Philosophy ─────────────────────────────── */}
        <section className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10">
          <SectionHeading
            tag="Performance"
            title="Built to Feel Instant"
            sub="Every interaction is designed to feel sub-100ms — even on slow connections."
          />
          <div className="space-y-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              <strong className="text-slate-900 dark:text-white">Code Splitting:</strong> Each feature module (Vehicles, Drivers, Trips, Fuel, Expenses, Maintenance, Reports) is a separate JS chunk loaded only when that route is first visited. The initial bundle is kept under 150 KB gzipped.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Route Prefetching:</strong> On the login page mount, the Dashboard chunk is prefetched in the background. By the time authentication succeeds, the next page is already in the browser cache — the transition is instant.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Server-Side Pagination:</strong> List views request 25 records at a time from the API. The server never sends the full table — it returns only the current window plus metadata for page controls.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">In-Memory API Cache:</strong> Dashboard aggregate statistics are cached in Node.js memory with a 5-second TTL. Rapid refreshes or concurrent users do not hammer the PostgreSQL aggregation query.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Selective Indexing:</strong> Read-heavy search columns (driver names, plate numbers, receipt IDs) have dedicated B-tree indexes. Write-heavy columns like odometer readings are intentionally left unindexed to keep INSERT/UPDATE performance high.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Tap Interaction Optimizations:</strong> Mobile browsers normally delay click events by 300ms for gesture disambiguation. TransitOps eliminates this with <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[11px]">touch-action: manipulation</code> and removes tap highlight artifacts globally.
            </p>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            tag="Frequently Asked"
            title="Questions We Hear Most Often"
          />
          <Accordion items={faqs} />
        </section>

        {/* ── CTA / Footer ──────────────────────────────────────────── */}
        <div className="text-center border-t border-slate-200 dark:border-slate-800 pt-10">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Ready to get started? Your fleet operations command center is one login away.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-5 py-2.5 rounded-lg hover:opacity-90 active:scale-[0.97] transition"
            >
              <FiZap className="w-3.5 h-3.5" /> Get Started
            </button>
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              <FiArrowLeft className="w-3.5 h-3.5" /> Go Back
            </button>
          </div>
          <p className="mt-8 text-[11px] text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} TransitOps Logistics Systems · <a href="/terms" className="underline hover:text-slate-600">Terms</a> · <a href="/privacy" className="underline hover:text-slate-600">Privacy</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LearnMore;
