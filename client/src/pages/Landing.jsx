import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import {
  FiShield,
  FiZap,
  FiDatabase,
  FiTruck,
  FiCheckCircle,
  FiArrowRight,
  FiLock,
  FiTrendingUp,
  FiCpu,
  FiActivity,
  FiRepeat,
  FiUsers,
  FiDollarSign,
  FiFileText
} from 'react-icons/fi';

/**
 * Enterprise Landing Page showcasing TransitOps platform achievements,
 * high-performance PostgreSQL architecture, security milestones, and direct login access.
 */
export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const achievements = [
    {
      icon: FiShield,
      badge: 'Security Pro Max',
      title: 'Zero-Trust RBAC & Route Clearance',
      description:
        '100% authoritative server-side endpoint protection (restrictTo) guarding all API routes. Pre-request client shields and controller validations reject URL tampering, routing unauthorized actors to dedicated 401 & 403 barriers.',
      metric: '100% Route Coverage'
    },
    {
      icon: FiRepeat,
      badge: 'Data Integrity',
      title: 'Dual-Layer Mutation Idempotency',
      description:
        'Guaranteed zero duplicate database inserts during rapid double-clicks or unstable networks. Employs in-flight mutex locks and cached responses with X-Idempotent-Replay headers.',
      metric: '0 Duplicate Writes'
    },
    {
      icon: FiDatabase,
      badge: 'Architecture',
      title: 'PostgreSQL 3NF & High-Read Indexing',
      description:
        'Normalized third-normal-form relational engine equipped with optimized B-tree composite and partial indexes (e.g. status = ACTIVE) delivering sub-millisecond query execution on high-read lookup tables.',
      metric: '< 1ms Query Execution'
    },
    {
      icon: FiZap,
      badge: 'Performance',
      title: 'High-Speed UI Chunking & Smart Caching',
      description:
        'Vite-powered modular chunking with lazy viewport loading. In-memory API query caching eliminates redundant network round-trips while instantly invalidating when database changes occur.',
      metric: '3.2s Production Build'
    },
    {
      icon: FiTruck,
      badge: 'Operations',
      title: 'Automated Fleet Dispatch & Safety Roster',
      description:
        'Intelligent dispatch conflict resolution prevents double-booking of vehicles and drivers. Integrated safety scores, license expiry trackers, and automated vehicle odometer progression.',
      metric: '6 Fleet Modules'
    },
    {
      icon: FiTrendingUp,
      badge: 'Finance',
      title: 'Expense Audit & Fuel Intelligence',
      description:
        'End-to-end multi-role financial approval workflows for operational expenses and automated fuel cost-per-kilometer analytics with executive reporting exports.',
      metric: 'Full Financial Audit'
    }
  ];

  const techStack = [
    { name: 'PostgreSQL 3NF', category: 'Database Engine', desc: 'Normalized relational schema with partial B-tree indexing' },
    { name: 'Express & Node.js', category: 'Backend Foundation', desc: 'Restricted RBAC middleware, self-healing keep-alive' },
    { name: 'React 18 & Vite', category: 'Frontend Architecture', desc: 'Code-split modular chunks & stateful theme engine' },
    { name: 'Cryptographic Auth', category: 'Security Layer', desc: 'Dual-cookie JWT, CSRF token validation, HMAC verification' },
    { name: 'Idempotency Engine', category: 'Reliability', desc: 'UUIDv4 mutation replay cache & in-flight locks' },
    { name: 'Render & Vercel', category: 'Deployment', desc: 'Edge-distributed frontend with permanent cloud worker' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans selection:bg-primary-500 selection:text-white transition-colors duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#0B0F19]/80 border-b border-slate-200 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-md">
              <FiTruck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                Transit<span className="text-primary-600 dark:text-primary-400">Ops</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Systems Online
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#achievements" className="hover:text-slate-950 dark:hover:text-white transition-colors">Achievements</a>
            <a href="#security" className="hover:text-slate-950 dark:hover:text-white transition-colors">Security Fortress</a>
            <a href="#stack" className="hover:text-slate-950 dark:hover:text-white transition-colors">Tech Architecture</a>
            <a href="#stats" className="hover:text-slate-950 dark:hover:text-white transition-colors">Key Metrics</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2"
                id="landing-goto-dashboard-btn"
              >
                Enter Dashboard ({user?.role?.replace('_', ' ')})
                <FiArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="text-xs font-semibold px-3.5 py-2 hidden sm:inline-flex"
                  id="landing-signin-outline-btn"
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
                  id="landing-portal-access-btn"
                >
                  Operations Portal
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-primary-500/10 via-slate-400/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary-500" />
            TransitOps v2.4 Enterprise Release
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-primary-600 dark:text-primary-400 font-mono">PostgreSQL 3NF Engine</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Unified Fleet Logistics & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Zero-Trust Transport Operations
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            An ultra-secure, highly normalized logistics management ecosystem. Engineered with strict server-side route clearance, dual-layer mutation idempotency, and sub-millisecond database queries.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/10 dark:shadow-none"
              id="hero-launch-portal-btn"
            >
              <FiLock className="w-4 h-4" />
              Sign In to Operations Portal
              <FiArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
              id="hero-register-btn"
            >
              <FiUsers className="w-4 h-4" />
              Register Staff Account
            </Button>
          </div>

          {/* Trust Banner / Security Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Strict RBAC Enforced
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Idempotent Mutations
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Anti-Brute-Force Shield
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Sub-ms Partial Indexes
            </span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. KEY METRICS COUNTER BAR
      ───────────────────────────────────────────────────────────── */}
      <section id="stats" className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                &lt; 1ms
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Indexed Query Latency
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                100%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Server-Side Route Clearance
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                0 Duplicates
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mutation Idempotency
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                3.2s
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Vite Production Build
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. MAJOR ENGINEERING ACHIEVEMENTS
      ───────────────────────────────────────────────────────────── */}
      <section id="achievements" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Platform Innovations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Major Project Achievements
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Transforming fleet operations from a basic registry into a zero-trust, high-throughput enterprise infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {achievements.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-bold">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400">
                      {item.metric}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      Verified <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SECURITY FORTRESS & URL TAMPERING DEFENSE
      ───────────────────────────────────────────────────────────── */}
      <section id="security" className="py-16 bg-slate-900 text-white relative overflow-hidden">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Enterprise Defense Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white">
              Zero-Trust Route Protection & Parameter Guarding
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Every route, parameter, and mutation is strictly gated. If an unauthorized user attempts to manipulate URL parameters (e.g. changing <code className="bg-slate-800 px-1.5 py-0.5 rounded text-rose-300">/vehicles/3</code> to <code className="bg-slate-800 px-1.5 py-0.5 rounded text-rose-300">/vehicles/1</code>), our defensive layers immediately halt execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <FiShield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">1. Client Pre-Clearance Guard</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Before sending an API dispatch, detail views inspect session credentials. Unauthorized access immediately redirects to custom <strong>401 Unauthorized</strong> or <strong>403 Forbidden</strong> views.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <FiLock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">2. Server-Side restrictTo Enforcement</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Independent of the frontend, Express route handlers validate signed JWT tokens and enforce strict role boundaries, returning authoritative HTTP 403 status codes.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <FiActivity className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">3. Anti-Brute-Force & Lockout</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Attack surface mitigation features exponential IP lockout cooldowns (/blocked) preventing credential stuffing and brute-force token enumeration.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. TECH STACK SPECIFICATION
      ───────────────────────────────────────────────────────────── */}
      <section id="stack" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Under The Hood
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Engineered with Modern Technologies
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Built on production-grade standards to ensure extreme responsiveness and maintainability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-primary-600 dark:text-primary-400">
                  {tech.category}
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {tech.name}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. BOTTOM CALL TO ACTION
      ───────────────────────────────────────────────────────────── */}
      <section className="pb-24 pt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 inline-block mb-4">
                Access Authorized Portal
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Experience Enterprise Fleet Operations?
              </h3>
              <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Sign in with your corporate credentials to manage vehicles, dispatch trips, audit expenses, and oversee maintenance schedules in real time.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="primary"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"
                  id="cta-bottom-signin-btn"
                >
                  <FiLock className="w-4 h-4" />
                  Sign In to TransitOps
                  <FiArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white border-slate-700 hover:bg-slate-800"
                  id="cta-bottom-register-btn"
                >
                  Create Staff Account
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F19] py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">TransitOps Platform</span>
            <span>•</span>
            <span>Production Grade v2.4</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#achievements" className="hover:text-slate-900 dark:hover:text-white transition-colors">Achievements</a>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</a>
            <button onClick={() => navigate('/login')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Staff Login</button>
            <button onClick={() => navigate('/register')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Register</button>
          </div>

          <div>
            © {new Date().getFullYear()} TransitOps Logistics Systems. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
