import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * Smart back: go back in history, or fall to "/" if opened directly.
 */
const useSmartBack = () => {
  const navigate = useNavigate();
  return () => (window.history.length > 2 ? navigate(-1) : navigate('/'));
};

/* ── Table of Contents item ──────────────────────────────────────── */
const TocItem = ({ num, label }) => (
  <a
    href={`#priv-${num}`}
    className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-0.5"
  >
    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
      {num}
    </span>
    {label}
  </a>
);

/* ── Collapsible section ─────────────────────────────────────────── */
const Section = ({ num, title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <section id={`priv-${num}`} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {num}. {title}
        </h2>
        {open
          ? <FiChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <FiChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          {children}
        </div>
      )}
    </section>
  );
};

const Li = ({ children }) => (
  <li className="flex gap-2">
    <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
    <span>{children}</span>
  </li>
);

/* ── Main ────────────────────────────────────────────────────────── */
export const Privacy = () => {
  const goBack = useSmartBack();

  const toc = [
    'Our Commitment to Privacy',
    'Scope and Applicability',
    'Information We Collect',
    'How We Collect Information',
    'Legal Basis for Processing',
    'How We Use Your Information',
    'Data Sharing and Disclosure',
    'Fleet Telemetry and Operational Data',
    'Authentication and Session Data',
    'Cookies and Local Storage',
    'IP Address and Brute-Force Lockout Records',
    'Data Security Measures',
    'Data Retention Periods',
    'Data Subject Rights',
    'Cross-Border Data Transfers',
    'Children\'s Privacy',
    'Employee and Contractor Privacy',
    'Incident Response and Breach Notification',
    'Third-Party Links and Services',
    'Changes to This Privacy Policy',
    'Grievance Officer and Contact Information',
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100">

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center font-black text-white dark:text-slate-950 text-[10px]">TO</div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">TransitOps</span>
            <span className="hidden sm:inline text-slate-400 mx-1">·</span>
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">Privacy Policy</span>
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid lg:grid-cols-[260px_1fr] gap-10 items-start">

        {/* ── Sidebar ToC ──────────────────────────────────────────── */}
        <aside className="hidden lg:block sticky top-20 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Contents</p>
          <nav className="space-y-0.5">
            {toc.map((label, i) => <TocItem key={i} num={i + 1} label={label} />)}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Doc header */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Last updated: October 2026 · TransitOps Operations Platform · Version 2.4
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This Privacy Policy ("Policy") describes how TransitOps Logistics Systems Private Limited
              ("TransitOps", "we", "us", or "our") collects, uses, stores, protects, and in limited
              circumstances discloses information about users of the TransitOps Fleet Operations Platform
              ("Platform"). We are committed to handling all personal and operational data with the highest
              standards of confidentiality, integrity, and transparency. Please read this Policy carefully
              before using the Platform.
            </p>
          </div>

          {/* Sections */}
          <Section num={1} title="Our Commitment to Privacy">
            <p>Privacy is foundational to the design of TransitOps — not a feature added after the fact. We operate under the principle of data minimization: we collect only what is necessary to provide the operational services your Organization has engaged us to deliver, and nothing more.</p>
            <p>We do not monetize user data. We do not run behavioral advertising. We do not sell, rent, barter, or share your Fleet Data or personnel information with any third party for commercial gain. Our revenue model is based entirely on subscription fees for Platform access — not on data exploitation.</p>
            <p>This Policy is written in plain language wherever possible. Where legal terminology is required, we explain what it means in practical terms for your Organization.</p>
          </Section>

          <Section num={2} title="Scope and Applicability">
            <p>This Policy applies to:</p>
            <ul className="space-y-2">
              <Li>All registered users of the TransitOps Platform, including Super Administrators, Fleet Managers, Dispatchers, Safety Officers, and Financial Analysts.</Li>
              <Li>Visitors to the TransitOps public landing page (transitops.in) and associated marketing pages.</Li>
              <Li>All Fleet Data submitted to the Platform by your Organization's users.</Li>
              <Li>Information collected automatically through your interaction with the Platform.</Li>
            </ul>
            <p>This Policy does not apply to third-party websites, services, or applications linked from the Platform, including email providers, payment processors, or infrastructure services. Those entities are governed by their own privacy policies.</p>
          </Section>

          <Section num={3} title="Information We Collect">
            <p><strong>Personal Information (directly provided):</strong></p>
            <ul className="space-y-2">
              <Li><strong>Account Registration Data:</strong> Full legal name, organizational email address, mobile phone number, and employee role designation.</Li>
              <Li><strong>Authentication Credentials:</strong> Hashed and salted password (we never store plaintext passwords), OTP tokens (stored temporarily and purged upon use or expiry).</Li>
              <Li><strong>Profile Data:</strong> Any updates to name, contact number, or role submitted via account settings.</Li>
            </ul>
            <p><strong>Driver and Operator Records (submitted by your Organization):</strong></p>
            <ul className="space-y-2">
              <Li>Driver full names, license numbers, license expiry dates, contact information, and employment status.</Li>
              <Li>Safety performance indicators, incident flags, and compliance status.</Li>
            </ul>
            <p><strong>Fleet and Operational Records (submitted by your Organization):</strong></p>
            <ul className="space-y-2">
              <Li>Vehicle registration plates, chassis numbers, engine types, fuel categories, and insurance policy references.</Li>
              <Li>Odometer readings, fuel consumption logs, maintenance event records.</Li>
              <Li>Trip itineraries, route details, dispatch status, and distance metrics.</Li>
              <Li>Financial records: fuel costs, maintenance expenses, miscellaneous expenditures in Indian Rupees (₹).</Li>
            </ul>
            <p><strong>Automatically Collected Technical Data:</strong></p>
            <ul className="space-y-2">
              <Li>IP addresses of accessing devices (used for security and brute-force detection — see Section 11).</Li>
              <Li>Browser user-agent strings and device type (used for responsive UI optimization, not tracking).</Li>
              <Li>API request timestamps and route access logs (used for security auditing and debugging).</Li>
              <Li>Session JWT expiry metadata (used for authentication state management).</Li>
            </ul>
          </Section>

          <Section num={4} title="How We Collect Information">
            <p>We collect information through the following mechanisms:</p>
            <ul className="space-y-2">
              <Li><strong>Direct Submission:</strong> When you register an account, enter Fleet Data, submit forms, or contact our support team.</Li>
              <Li><strong>API Interactions:</strong> Every authenticated API call carries your session token, from which we derive your user identity and role for the duration of that request.</Li>
              <Li><strong>Server Logs:</strong> Our API server logs the originating IP address, HTTP method, endpoint accessed, HTTP response code, and timestamp for every request, including unauthenticated requests to public routes.</Li>
              <Li><strong>Email Interactions:</strong> If you contact support or receive OTP emails, we record the communication for service purposes.</Li>
            </ul>
            <p>We do not use third-party analytics SDKs (such as Google Analytics, Segment, or Mixpanel) on the Platform dashboard. The public landing page may include minimal performance measurement tooling, which is disclosed separately.</p>
          </Section>

          <Section num={5} title="Legal Basis for Processing">
            <p>For users in jurisdictions governed by the General Data Protection Regulation (GDPR) or equivalent data protection frameworks, TransitOps processes your personal data under the following legal bases:</p>
            <ul className="space-y-2">
              <Li><strong>Contractual Necessity:</strong> Processing your account data and Fleet Data is necessary to perform the services contracted by your Organization.</Li>
              <Li><strong>Legitimate Interests:</strong> Server logging, IP lockout records, and security monitoring are necessary for the protection of our Platform, our users, and our infrastructure against unauthorized access.</Li>
              <Li><strong>Legal Obligation:</strong> We may process and retain certain records where required to do so by applicable law, regulatory requirement, or court order.</Li>
              <Li><strong>Consent:</strong> Where we process data beyond the above bases (e.g., for new product features), we will seek explicit consent from the relevant data subjects.</Li>
            </ul>
            <p>For Indian users, data processing is conducted in compliance with the Information Technology Act, 2000, the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023, as applicable.</p>
          </Section>

          <Section num={6} title="How We Use Your Information">
            <p>We use the information collected for the following purposes and no others:</p>
            <ul className="space-y-2">
              <Li><strong>Service Delivery:</strong> To authenticate your identity, authorize role-appropriate access, and deliver all Platform features.</Li>
              <Li><strong>Operational Reporting:</strong> To generate fleet analytics, financial summaries, maintenance forecasts, and audit trails within your Organization's scope.</Li>
              <Li><strong>Security Enforcement:</strong> To detect, investigate, and respond to unauthorized access attempts, brute-force attacks, and potential security incidents.</Li>
              <Li><strong>Communication:</strong> To send OTP verification codes, account notifications, support responses, and important service announcements to your registered email or phone.</Li>
              <Li><strong>Platform Improvement:</strong> To identify technical errors, performance bottlenecks, and UI issues through server-side error logging. This does not involve tracking individual user behavior patterns.</Li>
              <Li><strong>Legal Compliance:</strong> To fulfill our obligations under applicable law, respond to lawful government requests, and protect our legal rights.</Li>
              <Li><strong>Account Management:</strong> To process account creation, modification, deactivation, and deletion requests.</Li>
            </ul>
            <p>We will never use your Fleet Data or personal information for:</p>
            <ul className="space-y-2">
              <Li>Profiling or targeting advertising — on or off the Platform.</Li>
              <Li>Benchmarking or sharing insights across organizations without explicit consent.</Li>
              <Li>Training artificial intelligence or machine learning models.</Li>
              <Li>Sale, rent, or barter to third-party data brokers or marketing firms.</Li>
            </ul>
          </Section>

          <Section num={7} title="Data Sharing and Disclosure">
            <p>TransitOps does not sell or rent personal data. We disclose information only in the following limited circumstances:</p>
            <ul className="space-y-2">
              <Li><strong>Within Your Organization:</strong> Users with appropriate roles can access Fleet Data submitted by their Organization. Super Administrators can view all organizational records. Other roles are restricted to their permitted data scope.</Li>
              <Li><strong>Service Providers:</strong> We engage trusted third-party service providers (including cloud hosting providers and SMTP email services) who process data on our behalf under strict data processing agreements and may not use your data for any independent purpose.</Li>
              <Li><strong>Legal Requirements:</strong> We may disclose information in response to a court order, subpoena, government investigation, or other legal process, after making reasonable efforts to notify the affected Organization where legally permissible.</Li>
              <Li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or part of TransitOps, your data may be transferred to the successor entity. You will be notified of any such transfer and the Privacy Policy applicable thereafter.</Li>
              <Li><strong>Safety and Emergency:</strong> We may disclose information where we believe disclosure is necessary to prevent imminent harm, physical injury, or criminal activity.</Li>
            </ul>
          </Section>

          <Section num={8} title="Fleet Telemetry and Operational Data">
            <p>Fleet Data submitted by your Organization — including vehicle records, driver profiles, trip logs, fuel consumption entries, maintenance histories, and expense records — is treated as confidential organizational data. TransitOps applies the following protections:</p>
            <ul className="space-y-2">
              <Li>Fleet Data is stored in isolated, access-controlled database schemas segregated per Organization.</Li>
              <Li>API endpoints enforce role-based access so that no user can query data outside their permitted scope.</Li>
              <Li>Database queries use parameterized statements that structurally prevent injection or unauthorized data access.</Li>
              <Li>Fleet Data is never aggregated, anonymized, or shared across Organizations for any purpose including benchmarking, market research, or product demonstrations.</Li>
            </ul>
            <p>Your Organization's Fleet Data belongs entirely to your Organization. TransitOps holds it in trust as a data processor, acting only on your instructions as established by your subscription agreement.</p>
          </Section>

          <Section num={9} title="Authentication and Session Data">
            <p>TransitOps uses JSON Web Tokens (JWT) for authenticated sessions. The following practices apply:</p>
            <ul className="space-y-2">
              <Li>JWT access tokens are stored exclusively in the browser's <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[11px]">sessionStorage</code>, which is automatically cleared when the browser tab or window is closed.</Li>
              <Li>We deliberately avoid <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[11px]">localStorage</code> for tokens to prevent cross-session persistence and reduce exposure to XSS-based token theft.</Li>
              <Li>JWT tokens contain your user ID, role, and expiry time. They are signed with a server-side secret and validated on every API call — UI-side state is never trusted for access decisions.</Li>
              <Li>Tokens have a finite expiry period. Long-lived sessions require re-authentication.</Li>
              <Li>On logout, the client-side token is cleared from sessionStorage. Server-side token invalidation is enforced where applicable.</Li>
            </ul>
          </Section>

          <Section num={10} title="Cookies and Local Storage">
            <p>The Platform uses a minimal set of browser storage mechanisms:</p>
            <ul className="space-y-2">
              <Li><strong>sessionStorage (Authentication):</strong> Stores the JWT token and user profile data for the active browser session only. Cleared automatically on tab/window close.</Li>
              <Li><strong>localStorage (Theme Preference):</strong> Stores your selected UI theme (light or dark mode) so it persists across sessions. This contains no personal or sensitive data.</Li>
              <Li><strong>localStorage (Lockout State):</strong> In the event of an IP lockout, the lockout metadata (remaining time, reason) is cached locally to allow the Blocked page to display accurate information without repeated API calls during the lockout period.</Li>
            </ul>
            <p>We do not use tracking cookies, cross-site cookies, advertising cookies, or third-party analytics cookies on the authenticated Platform dashboard. The public landing page may use one first-party session cookie for CSRF protection only.</p>
          </Section>

          <Section num={11} title="IP Address and Brute-Force Lockout Records">
            <p>Your device's IP address is collected for every request made to the Platform's API, both authenticated and unauthenticated. IP addresses are used for the following security purposes only:</p>
            <ul className="space-y-2">
              <Li>Detecting and blocking brute-force login attempts from a single IP address.</Li>
              <Li>Identifying potentially compromised accounts showing anomalous geographic access patterns.</Li>
              <Li>Generating security audit logs for incident investigation.</Li>
              <Li>Enforcing IP lockout restrictions in accordance with our Terms and Conditions.</Li>
            </ul>
            <p>IP lockout records — including the originating IP, attempt count, and lockout expiry timestamp — are retained in the database for a period of 7 days following expiry of the lockout, after which they are automatically purged.</p>
            <p>IP addresses are not associated with personal profiles, not shared with third parties, and not used for geographic targeting or behavioral profiling of any kind.</p>
            <p>If your Organization uses shared IP addresses (e.g., corporate NAT or a fixed office IP), a lockout triggered by one user may affect others on the same IP. In such cases, please contact support@transitops.in for manual review and early release of the lockout where legitimacy is verified.</p>
          </Section>

          <Section num={12} title="Data Security Measures">
            <p>TransitOps implements a comprehensive set of technical and organizational security measures to protect your data:</p>
            <p><strong>Technical Controls:</strong></p>
            <ul className="space-y-2">
              <Li>All data in transit is protected by TLS 1.2 or higher encryption.</Li>
              <Li>Passwords are hashed using bcrypt with a cost factor calibrated for modern hardware — plaintext passwords are never stored, logged, or transmitted.</Li>
              <Li>Database access is restricted to the application layer via a dedicated connection pool with role-limited credentials.</Li>
              <Li>All SQL interactions use parameterized queries to prevent injection attacks.</Li>
              <Li>API endpoints enforce rate limiting and role validation before any database query executes.</Li>
              <Li>Server infrastructure is maintained with current security patches and monitored for anomalous activity.</Li>
            </ul>
            <p><strong>Organizational Controls:</strong></p>
            <ul className="space-y-2">
              <Li>Access to production systems is restricted to a limited number of authorized TransitOps engineers on a need-to-know basis.</Li>
              <Li>Internal access to customer data for support or debugging purposes requires documented authorization and is logged.</Li>
              <Li>Security practices are reviewed periodically and updated in response to evolving threat landscapes.</Li>
            </ul>
            <p>Despite these measures, no system is perfectly secure. If you discover a potential security vulnerability in the Platform, please report it responsibly to security@transitops.in before public disclosure. We are committed to acknowledging and addressing valid vulnerability reports promptly.</p>
          </Section>

          <Section num={13} title="Data Retention Periods">
            <p>We retain different categories of data for different periods based on operational and legal requirements:</p>
            <ul className="space-y-2">
              <Li><strong>Active Account Data:</strong> Retained for the duration of the account's active subscription plus a 30-day post-termination grace period for export.</Li>
              <Li><strong>Fleet Operational Records:</strong> Retained in active systems for the active subscription period. Following termination and export grace period, moved to archival storage for up to 90 days before permanent deletion.</Li>
              <Li><strong>OTP Tokens:</strong> Purged automatically upon use, expiry, or within 10 minutes of generation, whichever is earliest.</Li>
              <Li><strong>IP Lockout Records:</strong> Retained for 7 days following lockout expiry, then automatically deleted.</Li>
              <Li><strong>API Access Logs:</strong> Retained for 30 days for security auditing and debugging, then automatically purged.</Li>
              <Li><strong>Support Communications:</strong> Retained for 12 months following resolution of the support ticket.</Li>
              <Li><strong>Legal Hold Data:</strong> Where required by law, court order, or active dispute, data may be retained beyond standard periods for as long as legally required.</Li>
            </ul>
          </Section>

          <Section num={14} title="Data Subject Rights">
            <p>Depending on your jurisdiction, you may have the following rights with respect to your personal data processed by TransitOps:</p>
            <ul className="space-y-2">
              <Li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</Li>
              <Li><strong>Right of Rectification:</strong> Request correction of inaccurate or incomplete personal data.</Li>
              <Li><strong>Right of Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal data, subject to our legal retention obligations.</Li>
              <Li><strong>Right of Portability:</strong> Request your personal data in a structured, machine-readable format.</Li>
              <Li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data in certain circumstances.</Li>
              <Li><strong>Right to Object:</strong> Object to processing based on our legitimate interests.</Li>
              <Li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw that consent at any time without affecting prior processing.</Li>
            </ul>
            <p>To exercise any of these rights, contact our Grievance Officer at privacy@transitops.in. We will acknowledge your request within 5 business days and fulfill it within 30 days (extendable by a further 30 days for complex requests, with notice).</p>
            <p>Please note that certain rights may be limited where processing is required for contractual necessity or legal compliance. Fleet Data submitted by your Organization as an entity is subject to the data rights of the Organization's designated Super Administrator rather than individual users.</p>
          </Section>

          <Section num={15} title="Cross-Border Data Transfers">
            <p>TransitOps primarily stores and processes data on infrastructure located in India. Where we engage third-party service providers (such as cloud infrastructure or email delivery services) that may process data in other jurisdictions, we ensure appropriate safeguards are in place, including:</p>
            <ul className="space-y-2">
              <Li>Data processing agreements that bind such providers to confidentiality and security obligations equivalent to those we observe.</Li>
              <Li>Use of providers who are participants in recognized international data transfer frameworks or certified under equivalent standards.</Li>
              <Li>Review of provider security practices before engagement and periodic re-evaluation.</Li>
            </ul>
            <p>We will notify your Organization of any material change to the jurisdictions in which your data may be processed, providing 30 days advance notice where possible.</p>
          </Section>

          <Section num={16} title="Children's Privacy">
            <p>The TransitOps Platform is not directed at, designed for, or intended to be used by individuals under the age of 18. We do not knowingly collect personal information from minors.</p>
            <p>If you believe that a minor under 18 has been registered on the Platform or has submitted personal data, please contact us immediately at privacy@transitops.in. Upon verification, we will take prompt steps to remove any such data.</p>
          </Section>

          <Section num={17} title="Employee and Contractor Privacy">
            <p>Where driver profiles or staff records submitted to the Platform contain personal data relating to employees or contractors of your Organization, your Organization acts as the data controller for such individuals' data, and TransitOps acts as the data processor.</p>
            <p>Your Organization is responsible for ensuring that it has an appropriate legal basis to submit and process the personal data of its employees and contractors on the Platform, and for providing those individuals with appropriate notice of such processing in accordance with applicable employment and data protection laws.</p>
          </Section>

          <Section num={18} title="Incident Response and Breach Notification">
            <p>In the event of a confirmed personal data breach that is likely to result in a risk to the rights and freedoms of affected individuals, TransitOps will:</p>
            <ul className="space-y-2">
              <Li>Notify the Super Administrator of affected Organizations via their registered email within 72 hours of becoming aware of the breach, to the extent reasonably practicable.</Li>
              <Li>Provide a clear description of the nature of the breach, the categories and approximate number of individuals affected, likely consequences, and measures taken or proposed to address the breach.</Li>
              <Li>Report to applicable data protection authorities where required by law.</Li>
              <Li>Maintain a record of all data security incidents regardless of whether breach notification is required.</Li>
            </ul>
            <p>TransitOps will cooperate with your Organization during incident response investigations and provide all reasonably available information to assist in any required notifications to affected data subjects.</p>
          </Section>

          <Section num={19} title="Third-Party Links and Services">
            <p>The Platform may reference or link to third-party websites, documentation resources, or external services for informational purposes. TransitOps has no control over and accepts no responsibility for the privacy practices, content, or security of such external resources.</p>
            <p>We strongly recommend reviewing the privacy policies of any third-party service you interact with through or in connection with the Platform. The presence of a link does not imply endorsement or any affiliation.</p>
          </Section>

          <Section num={20} title="Changes to This Privacy Policy">
            <p>TransitOps may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other operational factors. Material changes — those that meaningfully affect how we collect, use, or share your data — will be communicated to registered Organization Super Administrators by email at least 14 days before the revised Policy takes effect.</p>
            <p>Non-material changes (such as clarifying language, typographic corrections, or structural reorganization without substantive change) may be made without advance notice.</p>
            <p>The version number and effective date at the top of this document are updated with each revision. Continued use of the Platform after the effective date of a revised Policy constitutes acceptance of the updated terms.</p>
          </Section>

          <Section num={21} title="Grievance Officer and Contact Information">
            <p>In accordance with the Information Technology Act, 2000 and applicable rules, TransitOps has designated a Grievance Officer to address privacy-related concerns:</p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-1.5">
              <p><strong>Grievance Officer</strong></p>
              <p>TransitOps Logistics Systems Private Limited</p>
              <p>Email: <strong>privacy@transitops.in</strong></p>
              <p>Support (General): <strong>support@transitops.in</strong></p>
              <p>Security Disclosure: <strong>security@transitops.in</strong></p>
              <p>Address: Bengaluru, Karnataka, India — 560001</p>
              <p>Response Time: Within 5 business days of receipt</p>
              <p>Business Hours: Monday–Friday, 9:00 AM – 6:00 PM IST</p>
            </div>
            <p>We are committed to addressing all privacy concerns promptly, fairly, and transparently. If you are dissatisfied with our response, you may have the right to lodge a complaint with the relevant supervisory authority in your jurisdiction.</p>
          </Section>

          {/* Footer */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} TransitOps Logistics Systems · Version 2.4 · October 2026
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <a
                href="/terms"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                Terms &amp; Conditions →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
