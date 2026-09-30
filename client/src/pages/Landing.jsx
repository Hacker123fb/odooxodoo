import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  FiTruck,
  FiMapPin,
  FiDollarSign,
  FiTool,
  FiUserCheck,
  FiPieChart,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiLock,
  FiClock,
  FiActivity,
  FiFileText,
  FiHelpCircle,
  FiChevronRight
} from 'react-icons/fi';

/**
 * Modern Executive Fleet Management Landing Page
 * Designed for end-users, business executives, and fleet managers.
 * Clean, customer-centric value propositions without developer-heavy jargon.
 */
export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Legal Modal states for quick preview without leaving the page
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null

  const coreFeatures = [
    {
      icon: FiTruck,
      title: 'Live Fleet Oversight',
      tagline: 'Real-Time Vehicle Tracking',
      description:
        'Instantly view your entire vehicle roster with live operational statuses (Available, On Trip, In Shop). Monitor odometer milestones, cargo capacities, and assignment readiness.',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    {
      icon: FiMapPin,
      title: 'Smart Trip Dispatch',
      tagline: 'Conflict-Free Scheduling',
      description:
        'Dispatch journeys with automated conflict prevention. Never accidentally double-book a vehicle or assign an unavailable operator. Track departures, arrivals, and routes seamlessly.',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      icon: FiDollarSign,
      title: 'Fuel & Expense Control',
      tagline: 'Lower Operating Costs',
      description:
        'Log refills, calculate cost-per-kilometer, and audit route expenses. Multi-tier approval workflows ensure every rupee or dollar spent is verified and transparent.',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    {
      icon: FiTool,
      title: 'Preventive Maintenance',
      tagline: 'Zero Breakdown Surprises',
      description:
        'Schedule routine inspections, track service center visits, and log part replacements. Vehicles under repair are automatically marked "In Shop" until safely returned to service.',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    },
    {
      icon: FiUserCheck,
      title: 'Driver Safety Roster',
      tagline: 'Compliance & Performance',
      description:
        'Maintain complete driver profiles, safety scores, and automated license renewal alerts. Ensure all commercial operators are certified and compliant with road safety laws.',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    },
    {
      icon: FiPieChart,
      title: 'Executive Insights',
      tagline: 'One-Click Analytics',
      description:
        'Gain full visibility into fuel efficiency, maintenance budgets, and vehicle utilization rates. Generate presentation-ready reports for team reviews and audits.',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    }
  ];

  const benefits = [
    {
      metric: '25%',
      label: 'Average Fuel Cost Reduction',
      desc: 'Through optimized trip routing and accurate consumption auditing.'
    },
    {
      metric: '40%',
      label: 'Faster Dispatch Turnaround',
      desc: 'Automated vehicle and driver readiness checks eliminate manual phone calls.'
    },
    {
      metric: '99.9%',
      label: 'On-Time Service Schedules',
      desc: 'Proactive maintenance alerts keep vehicles safe and operational on the road.'
    },
    {
      metric: '100%',
      label: 'Paperless Compliance',
      desc: 'Centralized digital logs for expenses, fuel receipts, and operator licenses.'
    }
  ];

  const faqs = [
    {
      q: 'How does TransitOps prevent double-booking vehicles and drivers?',
      a: 'Our dispatch scheduling engine automatically checks vehicle and driver availability in real time. If a vehicle is currently on a journey or in the shop, the system alerts you and prevents accidental conflict.'
    },
    {
      q: 'Can staff members have different access levels?',
      a: 'Yes. TransitOps provides role-based access. Fleet Managers oversee vehicles and service logs, Dispatchers schedule trips, Financial Analysts review fuel and expense claims, and Super Admins manage global settings.'
    },
    {
      q: 'Is our company data secure and private?',
      a: 'Absolutely. We use bank-grade database encryption, secure authentication, and private cloud servers to ensure that only your authorized team members can access company records.'
    },
    {
      q: 'Does it work smoothly on both mobile and desktop?',
      a: 'Yes. TransitOps features a fully responsive modern interface designed for tablets in the warehouse, laptops in the dispatch office, and smartphones on the go.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans selection:bg-primary-500 selection:text-white transition-colors duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#0B0F19]/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-md">
              <FiTruck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                Transit<span className="text-primary-600 dark:text-primary-400">Ops</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Fleet Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-950 dark:hover:text-white transition-colors">Features</a>
            <a href="#benefits" className="hover:text-slate-950 dark:hover:text-white transition-colors">Why TransitOps</a>
            <a href="#security" className="hover:text-slate-950 dark:hover:text-white transition-colors">Security & Trust</a>
            <a href="#faq" className="hover:text-slate-950 dark:hover:text-white transition-colors">FAQ</a>
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
                Go to Dashboard ({user?.role?.replace('_', ' ') || 'Staff'})
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
                  Staff Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
                  id="landing-portal-access-btn"
                >
                  <FiLock className="w-3.5 h-3.5" />
                  Access Portal
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        
        {/* Soft background ambient gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Welcome Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 mb-6 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            Modern Fleet & Transport Operations Platform
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.18]">
            Complete Control Over Your <br className="hidden sm:inline" />
            <span className="text-primary-600 dark:text-primary-400">
              Fleet, Drivers & Trip Logistics
            </span>
          </h1>

          {/* User-Friendly Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate paperwork, prevent costly vehicle breakdowns, and schedule trips effortlessly. TransitOps connects your vehicles, maintenance, and expenses into one easy-to-use dashboard.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold flex items-center justify-center gap-2.5 shadow-md"
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
              <FiUserCheck className="w-4 h-4" />
              Register Staff Account
            </Button>
          </div>

          {/* Simple Trust Bullets */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Real-Time Fleet Tracking
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Automated Dispatch Checks
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Digital Expense Approvals
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500 w-4 h-4" /> Bank-Grade Data Protection
            </span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. CORE FEATURES GRID
      ───────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white dark:bg-[#0E131F] border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Everything You Need
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Built for Modern Transport Operations
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Designed to help dispatchers, fleet managers, and business owners run an efficient, stress-free fleet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {coreFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.tagline}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center text-xs font-semibold text-primary-600 dark:text-primary-400">
                    <span>Learn more</span>
                    <FiChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. MEASURABLE BUSINESS BENEFITS
      ───────────────────────────────────────────────────────────── */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Why Logistics Teams Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Deliver More, Spend Less, Stay Compliant
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Real results that make an immediate impact on your bottom line.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-2 shadow-xs"
              >
                <div className="text-4xl font-extrabold text-primary-600 dark:text-primary-400 font-mono">
                  {b.metric}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {b.label}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. GENERAL, REASSURING SECURITY CALLOUT (NON-TECHNICAL)
      ───────────────────────────────────────────────────────────── */}
      <section id="security" className="py-16 bg-slate-900 text-white relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Enterprise Trust & Reliability
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white">
              Bank-Grade Security for Your Operations
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              We know your fleet data and financial transactions are critical. TransitOps protects your business with multi-layer safeguards so you can operate with total peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FiLock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Private & Encrypted</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                All passwords, receipts, and vehicle telemetry are encrypted with industry-standard protocols. Your operational data is strictly private and never shared.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FiShield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Staff Access Controls</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Assign customized roles to your team. Ensure drivers, dispatchers, mechanics, and accountants only see the records relevant to their daily responsibilities.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <FiActivity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">24/7 Cloud Reliability</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Engineered for continuous uptime with automatic backups and cloud failover, guaranteeing your dispatch board is always accessible when your trucks are moving.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. FREQUENTLY ASKED QUESTIONS
      ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Got Questions?
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2 shadow-xs"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiHelpCircle className="text-primary-500 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. BOTTOM CALL TO ACTION
      ───────────────────────────────────────────────────────────── */}
      <section className="pb-24 pt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 inline-block mb-4">
                Enterprise Operations Portal
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Upgrade Your Fleet Management?
              </h3>
              <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Sign in with your staff credentials or register your organization to experience intuitive, automated fleet logistics today.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="primary"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"
                  id="cta-bottom-signin-btn"
                >
                  <FiLock className="w-4 h-4" />
                  Sign In to Operations Portal
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
          8. FOOTER WITH LEGAL TERMS & PRIVACY LINKS
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F19] py-10 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs">
                TO
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                TransitOps Smart Logistics
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
              <a href="#benefits" className="hover:text-slate-900 dark:hover:text-white transition-colors">Benefits</a>
              <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</a>
              <Link to="/terms" className="font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors underline underline-offset-4">
                Terms and Conditions
              </Link>
              <Link to="/privacy" className="font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors underline underline-offset-4">
                Privacy Policy
              </Link>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Staff Login
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              © {new Date().getFullYear()} TransitOps Logistics Systems. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Standard Operations v2.4</span>
              <span>•</span>
              <span className="text-emerald-500 font-semibold">Protected Cloud Environment</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
