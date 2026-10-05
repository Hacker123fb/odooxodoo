import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { authService } from '../api/apiService.js';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  FiTruck,
  FiMapPin,
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
  FiChevronRight,
  FiSun,
  FiMoon,
  FiTrendingUp,
  FiDroplet
} from 'react-icons/fi';
import { FaIndianRupeeSign } from 'react-icons/fa6';

/**
 * Modern Executive Fleet Management Landing Page
 * Designed for end-users, business executives, and fleet managers.
 * Clean, customer-centric value propositions without developer-heavy jargon.
 */
export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Evaluate isBlocked immediately from session/local storage
  const [isBlocked, setIsBlocked] = useState(() => {
    try {
      const raw = sessionStorage.getItem('lockout_info') || localStorage.getItem('lockout_info');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!(parsed?.blockedUntil && Date.now() < parsed.blockedUntil);
    } catch {
      return false;
    }
  });

  // Verify IP status asynchronously on Landing Page mount to immediately catch blocked IPs
  useEffect(() => {
    let isMounted = true;
    const verifyIp = async () => {
      try {
        const res = await authService.getIpStatus();
        if (isMounted && res?.blocked) {
          const remainingSeconds = res.remainingSeconds || ((res.remainingMinutes || 15) * 60);
          const lockData = {
            message: res.message || 'Access Denied: Your IP has been temporarily blocked.',
            remainingMinutes: res.remainingMinutes || 15,
            remainingSeconds,
            blockedUntil: res.blockedUntil || (Date.now() + remainingSeconds * 1000),
            reason: res.reason || 'IP_BLOCKED',
            timestamp: Date.now()
          };
          sessionStorage.setItem('lockout_info', JSON.stringify(lockData));
          localStorage.setItem('lockout_info', JSON.stringify(lockData));
          setIsBlocked(true);
        } else if (isMounted && res && !res.blocked) {
          sessionStorage.removeItem('lockout_info');
          localStorage.removeItem('lockout_info');
          setIsBlocked(false);
        }
      } catch (e) {
        if (e.status === 403 && isMounted) {
          setIsBlocked(true);
        }
      }
    };
    verifyIp();
    return () => { isMounted = false; };
  }, []);

  const handleAuthNavigation = (targetPath = '/login') => {
    if (isBlocked) {
      navigate('/blocked');
    } else {
      navigate(targetPath);
    }
  };

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
      icon: FaIndianRupeeSign,
      title: 'Fuel & Expense Control',
      tagline: 'Lower Operating Costs',
      description:
        'Log refills, calculate cost-per-kilometer, and audit route expenses. Multi-tier approval workflows ensure every rupee spent is verified and transparent.',
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

  const coreCapabilities = [
    {
      icon: FiShield,
      title: 'Automated Conflict Shield',
      desc: 'Real-time booking validation prevents vehicle double-allocation and blocks assigning drivers who are already en route or on rest periods.'
    },
    {
      icon: FiTool,
      title: 'Proactive Service Scheduling',
      desc: 'Prevent breakdowns with automated maintenance reminders based on live odometer intervals and calendar service due dates.'
    },
    {
      icon: FaIndianRupeeSign,
      title: 'Audited Expense Approvals',
      desc: 'Multi-tier verification for toll receipts, FASTag recharges, and route incidentals with digital document attachments.'
    },
    {
      icon: FiClock,
      title: 'Tamper-Resistant Odometers',
      desc: 'Synchronized departure and return mileage logging ensures complete trip distance integrity and accurate fuel efficiency metrics.'
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
          SECURITY NOTICE BANNER FOR BLOCKED IP
      ───────────────────────────────────────────────────────────── */}
      {isBlocked && (
        <div className="bg-rose-600 text-white px-4 py-3 sticky top-0 z-60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <FiShield className="w-5 h-5 shrink-0 text-rose-200 animate-pulse" />
            <span>Security Notice: Your IP address is temporarily blocked due to security policies. Portal sign-in is disabled.</span>
          </div>
          <button
            onClick={() => navigate('/blocked')}
            className="px-3.5 py-1.5 rounded-lg bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            View Lockout Details &rarr;
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#0B0F19]/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Unified Brand Logo matching Dashboard */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center font-black text-white dark:text-slate-950 text-xs tracking-wider shadow-xs select-none">
              TO
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight font-sans">
                Transit<span className="text-slate-500 dark:text-slate-400">Ops</span>
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
            <a href="#capabilities" className="hover:text-slate-950 dark:hover:text-white transition-colors">Capabilities</a>
            <a href="#security" className="hover:text-slate-950 dark:hover:text-white transition-colors">Security & Trust</a>
            <a href="#faq" className="hover:text-slate-950 dark:hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle visual theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-slate-700" />}
            </button>

            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => handleAuthNavigation('/dashboard')}
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
                  onClick={() => handleAuthNavigation('/login')}
                  className="text-xs font-semibold px-3.5 py-2 hidden sm:inline-flex"
                  id="landing-signin-outline-btn"
                >
                  Staff Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleAuthNavigation('/login')}
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
              onClick={() => handleAuthNavigation('/login')}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold flex items-center justify-center gap-2.5 shadow-md"
              id="hero-launch-portal-btn"
            >
              <FiLock className="w-4 h-4" />
              Sign In to Operations Portal
              <FiArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAuthNavigation('/register')}
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

          {/* Live Operations Telemetry Showcase */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-[#0E131F]/90 backdrop-blur-md shadow-xl overflow-hidden text-left">
            <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-[#0B0F19]/70">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2 font-mono">
                  transitops://live-telematics-hub
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Operational Network
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Active Dispatches */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Freight Dispatch</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">In Transit</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Tata Prima 4028.S
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  MH-12-RN-4821 • Mumbai ➔ Pune
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Assigned Operator</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Rajesh Sharma</span>
                </div>
              </div>

              {/* Card 2: Fuel Intelligence */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fuel Transaction</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">Audited</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  BPCL Highway Fuel Hub
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  140.0 L @ ₹91.20/L • Total ₹12,768.00
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Consumption Index</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">4.2 Km/L</span>
                </div>
              </div>

              {/* Card 3: Conflict Prevention Engine */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Safety Guard</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">0 Overlaps</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Intelligent Conflict Shield
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time validation blocks double-booked vehicles and expired licenses.
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Active Roster</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">25 Vehicles • 18 Drivers</span>
                </div>
              </div>

            </div>

            {/* Bottom summary strip */}
            <div className="px-6 py-3 border-t border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#080C14]/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-500 w-3.5 h-3.5" /> End-to-End Fleet Management Platform
              </span>
              <span>Currency: INR (₹)</span>
              <span>Security: Zero-Trust RBAC & Lockout Guard</span>
            </div>
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
          4. OPERATIONAL CAPABILITIES & WORKFLOWS
      ───────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Operations Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Engineered for Real-World Fleet Logistics
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Reliable, automated workflows that keep vehicles moving, operators compliant, and operational costs transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreCapabilities.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left space-y-3 shadow-xs hover:border-primary-500/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. GENERAL, REASSURING SECURITY CALLOUT (NON-TECHNICAL)
      ───────────────────────────────────────────────────────────── */}
      <section id="security" className="py-16 bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-white border-y border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Enterprise Trust & Reliability
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-slate-900 dark:text-white">
              Bank-Grade Security for Your Operations
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              We know your fleet data and financial transactions are critical. TransitOps protects your business with multi-layer safeguards so you can operate with total peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-6 space-y-3 shadow-xs transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FiLock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Private & Encrypted</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                All passwords, receipts, and vehicle telemetry are encrypted with industry-standard protocols. Your operational data is strictly private and never shared.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-6 space-y-3 shadow-xs transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FiShield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Staff Access Controls</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Assign customized roles to your team. Ensure drivers, dispatchers, mechanics, and accountants only see the records relevant to their daily responsibilities.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-6 space-y-3 shadow-xs transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FiActivity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">24/7 Cloud Reliability</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center text-slate-900 dark:text-white relative overflow-hidden shadow-xl transition-colors">
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border border-primary-500/20 dark:border-primary-500/30 inline-block mb-4">
                Enterprise Operations Portal
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Ready to Upgrade Your Fleet Management?
              </h3>
              <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Sign in with your staff credentials or register your organization to experience intuitive, automated fleet logistics today.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="primary"
                  onClick={() => handleAuthNavigation('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"
                  id="cta-bottom-signin-btn"
                >
                  <FiLock className="w-4 h-4" />
                  Sign In to Operations Portal
                  <FiArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAuthNavigation('/register')}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-white border-slate-300 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
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
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center font-black text-white dark:text-slate-950 text-xs tracking-wider shadow-xs select-none">
                TO
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight font-sans">
                Transit<span className="text-slate-500 dark:text-slate-400">Ops</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
              <a href="#capabilities" className="hover:text-slate-900 dark:hover:text-white transition-colors">Capabilities</a>
              <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</a>
              <Link to="/terms" className="font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors underline underline-offset-4">
                Terms and Conditions
              </Link>
              <Link to="/privacy" className="font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors underline underline-offset-4">
                Privacy Policy
              </Link>
              <button
                type="button"
                onClick={() => handleAuthNavigation('/login')}
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
