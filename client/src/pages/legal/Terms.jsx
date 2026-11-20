import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiChevronDown, FiChevronUp } from 'react-icons/fi';

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
    href={`#section-${num}`}
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
    <section id={`section-${num}`} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
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
export const Terms = () => {
  const goBack = useSmartBack();

  const toc = [
    'Acceptance of Terms',
    'Definitions',
    'Eligibility and Account Registration',
    'User Accounts and Authorized Access',
    'Fleet and Telemetry Data Ownership',
    'Acceptable Use Policy',
    'Prohibited Conduct',
    'Intellectual Property Rights',
    'Compliance with Transport Laws',
    'Service Availability and Maintenance',
    'Security Responsibilities',
    'IP Lockout and Brute-Force Protection Policy',
    'Third-Party Services and Integrations',
    'Data Accuracy and Operational Liability',
    'Financial Data and Expense Records',
    'Subscription, Billing, and Refund Policy',
    'Termination and Account Suspension',
    'Export and Data Portability',
    'Limitation of Liability',
    'Indemnification',
    'Governing Law and Dispute Resolution',
    'Modifications to Terms',
    'Severability',
    'Entire Agreement',
    'Contact Information',
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
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">Terms &amp; Conditions</span>
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
                <FiFileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Terms and Conditions</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Last updated: October 2026 · TransitOps Operations Platform · Version 3.1
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              These Terms and Conditions ("Agreement") constitute a legally binding contract between you
              ("User", "you", or "your") and TransitOps Logistics Systems Private Limited ("TransitOps",
              "we", "us", or "our") governing your access to and use of the TransitOps Fleet Operations
              Platform, including all software, APIs, dashboards, data services, and related documentation
              (collectively, the "Platform" or "Service"). Please read this Agreement in its entirety before
              accessing or using any component of the Platform.
            </p>
          </div>

          {/* Sections */}
          <Section num={1} title="Acceptance of Terms">
            <p>By clicking "I Agree," checking the acceptance checkbox during registration, or otherwise accessing or using the Platform in any manner, you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions and our Privacy Policy, which is incorporated herein by reference.</p>
            <p>If you are entering into this Agreement on behalf of a company, organization, government body, or other legal entity, you represent and warrant that you have the full legal authority to bind such entity to this Agreement. In that case, "you" and "your" refer to that entity.</p>
            <p>If you do not agree to all provisions of this Agreement, you must immediately cease all use of the Platform and notify your organization's Super Administrator of your refusal.</p>
          </Section>

          <Section num={2} title="Definitions">
            <ul className="space-y-2">
              <Li><strong>"Platform"</strong> means the TransitOps Fleet Operations web application, REST APIs, database services, reporting modules, and all associated tools.</Li>
              <Li><strong>"Organization"</strong> means the business entity that has subscribed to or been granted access to the Platform.</Li>
              <Li><strong>"User"</strong> means any natural person who is authorized by an Organization to access the Platform under an assigned role.</Li>
              <Li><strong>"Fleet Data"</strong> means all records including vehicle registrations, driver profiles, trip itineraries, fuel logs, maintenance records, and financial expense entries.</Li>
              <Li><strong>"Authorized Role"</strong> means one of the five access tiers: Super Admin, Fleet Manager, Dispatcher, Safety Officer, or Financial Analyst.</Li>
              <Li><strong>"Session"</strong> means a browser-authenticated context valid until the tab or window is closed, backed by a JWT stored exclusively in sessionStorage.</Li>
              <Li><strong>"IP Lockout"</strong> means the temporary suspension of access from a specific IPv4 or IPv6 address following repeated failed authentication attempts.</Li>
              <Li><strong>"Content"</strong> means all data, text, records, reports, documents, and other information submitted to or generated by the Platform.</Li>
            </ul>
          </Section>

          <Section num={3} title="Eligibility and Account Registration">
            <p>The Platform is intended exclusively for use by verified personnel of registered organizations. You must be at least 18 years of age or the age of majority in your jurisdiction, whichever is greater, to create or operate a Platform account.</p>
            <p>During registration you must provide accurate, current, and complete information including your full legal name, a valid organizational email address, and a working mobile contact number. You agree to promptly update such information if it changes.</p>
            <p>Account registration requires successful email OTP (One-Time Password) verification. Any registration that circumvents the OTP verification process — including but not limited to use of automated scripts, temporary email services, or shared credentials — is strictly prohibited and will result in immediate account suspension.</p>
            <p>TransitOps reserves the right to reject any registration application without cause or notice, at our sole discretion, including where we suspect the submission to be fraudulent or in violation of this Agreement.</p>
          </Section>

          <Section num={4} title="User Accounts and Authorized Access">
            <p>Each User account is personal and non-transferable. You are solely responsible for maintaining the confidentiality of your login credentials — including your password, OTP tokens, and any security questions — and for all activities conducted under your account.</p>
            <p>You must immediately notify your Organization's Super Administrator and TransitOps support at <strong>support@transitops.in</strong> if you suspect unauthorized access to your account, credential compromise, or any other security breach.</p>
            <p>You agree not to share your account credentials with any other person, including colleagues. If your organization requires another staff member to access specific modules, the Super Administrator must create a separate account with an appropriate Authorized Role.</p>
            <p>Accounts that remain inactive for 180 consecutive days may be deactivated by the Organization's Super Administrator or automatically flagged for review by TransitOps.</p>
            <ul className="space-y-2">
              <Li>Passwords must meet minimum complexity requirements: at least 8 characters, one uppercase letter, one number, and one special character.</Li>
              <Li>Password changes take immediate effect and invalidate all existing sessions including active browser tabs.</Li>
              <Li>Account recovery requires verification via the registered organizational email address.</Li>
            </ul>
          </Section>

          <Section num={5} title="Fleet and Telemetry Data Ownership">
            <p>Your Organization retains all rights, title, and interest in and to all Fleet Data uploaded to, generated by, or stored within the Platform. TransitOps claims no ownership over any vehicle records, driver information, trip telemetry, financial entries, or any other operational content submitted by your Organization.</p>
            <p>TransitOps processes Fleet Data solely to provide the contracted operational services and for no other purpose whatsoever. We will not use your Fleet Data to train machine learning models, produce market research, or share insights with other organizations.</p>
            <p>Upon termination of your Organization's access to the Platform, all Fleet Data will be retained for a 30-day grace period during which you may request a full structured export in CSV or JSON format. After expiry of this period, data may be permanently purged from active systems in accordance with our data retention schedules.</p>
          </Section>

          <Section num={6} title="Acceptable Use Policy">
            <p>You agree to use the Platform only for lawful, legitimate fleet operations management purposes. Acceptable use includes:</p>
            <ul className="space-y-2">
              <Li>Registering and managing vehicles, drivers, and operational routes belonging to your Organization.</Li>
              <Li>Scheduling, dispatching, and tracking trips across your authorized fleet.</Li>
              <Li>Recording fuel consumption, maintenance events, and operational expenditures.</Li>
              <Li>Generating reports for internal business intelligence, compliance, and regulatory audits.</Li>
              <Li>Managing staff accounts and role permissions within your Organization's scope.</Li>
              <Li>Accessing support documentation and audit trails for legitimate operational purposes.</Li>
            </ul>
          </Section>

          <Section num={7} title="Prohibited Conduct">
            <p>You expressly agree that you will not, under any circumstances:</p>
            <ul className="space-y-2">
              <Li>Attempt to gain unauthorized access to any Platform module, another organization's data, or any underlying server infrastructure.</Li>
              <Li>Use automated tools, bots, scrapers, or scripts to extract data, enumerate endpoints, or stress-test the Platform.</Li>
              <Li>Submit false, misleading, or fabricated Fleet Data including fictitious driver credentials, odometer readings, or financial records.</Li>
              <Li>Reverse-engineer, decompile, disassemble, or attempt to derive source code from any component of the Platform.</Li>
              <Li>Resell, sublicense, or otherwise commercialize access to the Platform or any data derived from it.</Li>
              <Li>Circumvent IP lockout restrictions by rotating proxy addresses, VPNs, or Tor exit nodes during a lockout period.</Li>
              <Li>Introduce malware, ransomware, or any malicious code into the Platform through any channel.</Li>
              <Li>Violate any applicable local, national, or international law in connection with your use of the Platform.</Li>
              <Li>Impersonate any person, entity, or TransitOps employee through any Platform feature.</Li>
              <Li>Interfere with or disrupt the operational integrity of the Platform for other users or organizations.</Li>
            </ul>
          </Section>

          <Section num={8} title="Intellectual Property Rights">
            <p>All aspects of the Platform — including but not limited to its source code, algorithms, database schema, user interface design, visual design language, brand marks, documentation, and underlying software architecture — are and shall remain the exclusive intellectual property of TransitOps Logistics Systems Private Limited and its licensors.</p>
            <p>This Agreement does not grant you any intellectual property license beyond the limited, non-exclusive, non-transferable, revocable right to access and use the Platform strictly as described herein. No rights are granted by implication, estoppel, or otherwise.</p>
            <p>Any feedback, suggestions, ideas, or enhancement requests you submit to TransitOps regarding the Platform may be used by TransitOps freely and without obligation, attribution, or compensation.</p>
          </Section>

          <Section num={9} title="Compliance with Transport Laws">
            <p>You acknowledge that fleet operations are subject to extensive regulatory oversight. You are solely responsible for ensuring that all use of the Platform complies with applicable laws, including but not limited to:</p>
            <ul className="space-y-2">
              <Li>The Motor Vehicles Act and rules prescribed thereunder in India, or equivalent legislation in your jurisdiction.</Li>
              <Li>Commercial vehicle permit conditions, route authorizations, and state transport regulations.</Li>
              <Li>Driver licensing requirements including commercial driving licenses, endorsements, and medical fitness certificates.</Li>
              <Li>Vehicle roadworthiness standards, periodic inspection certificates (fitness certificates), and pollution control norms.</Li>
              <Li>Hazardous goods transport regulations where applicable to your fleet operations.</Li>
              <Li>Driver hours-of-service limitations and mandatory rest period requirements.</Li>
              <Li>Insurance, indemnity bond, and third-party liability requirements for commercial vehicles.</Li>
              <Li>Data localization requirements applicable to operational records under Indian IT law.</Li>
            </ul>
            <p>TransitOps provides a technology platform only and does not provide legal compliance advice. You should consult qualified legal counsel for compliance guidance specific to your operations.</p>
          </Section>

          <Section num={10} title="Service Availability and Maintenance">
            <p>TransitOps targets a monthly uptime of 99.5% for the Platform, excluding scheduled maintenance windows and events beyond our reasonable control. However, uptime is provided on a commercially reasonable efforts basis and does not constitute a guaranteed service level unless separately agreed in a written SLA addendum.</p>
            <p>Scheduled maintenance activities including database migrations, infrastructure upgrades, and security patches will be conducted during low-traffic windows wherever possible, with advance notice of at least 48 hours posted on the Platform's status page or communicated via the Organization's registered admin email.</p>
            <p>In the event of unscheduled downtime, TransitOps will use commercially reasonable efforts to restore service within 4 hours and will communicate status updates at 30-minute intervals via the registered administrator email.</p>
            <p>TransitOps reserves the right to temporarily suspend Platform access without notice for the purpose of preventing or mitigating active security incidents, infrastructure failures, or data integrity risks.</p>
          </Section>

          <Section num={11} title="Security Responsibilities">
            <p>Both TransitOps and you share responsibility for Platform security:</p>
            <p><strong>TransitOps is responsible for:</strong></p>
            <ul className="space-y-1.5">
              <Li>Maintaining server-side security including patched infrastructure, encrypted data at rest, and TLS-in-transit.</Li>
              <Li>Operating IP-level brute-force detection and automatic lockout mechanisms.</Li>
              <Li>Implementing and maintaining parameterized database queries to prevent SQL injection.</Li>
              <Li>Role-based access enforcement at the API layer independent of frontend UI state.</Li>
            </ul>
            <p><strong>You are responsible for:</strong></p>
            <ul className="space-y-1.5">
              <Li>Using strong, unique passwords and not sharing credentials with third parties.</Li>
              <Li>Ensuring that your access device is free from malware and keyloggers.</Li>
              <Li>Logging out of sessions on shared or public devices immediately after use.</Li>
              <Li>Promptly reporting suspected compromises or anomalous activity to your Super Administrator.</Li>
              <Li>Not transmitting credentials over unsecured channels such as SMS or unencrypted email.</Li>
            </ul>
          </Section>

          <Section num={12} title="IP Lockout and Brute-Force Protection Policy">
            <p>The Platform includes automated IP-level brute-force protection to guard against credential-stuffing attacks. This system operates as follows:</p>
            <ul className="space-y-2">
              <Li>After a configured number of consecutive failed login attempts from a single IP address, that IP address is temporarily blocked from accessing login, registration, and all protected routes.</Li>
              <Li>The lockout duration is authoritative on the server side. The remaining lockout time is communicated to the client and persisted accurately — reopening the browser, clearing browser storage, or refreshing the page does not reset the timer.</Li>
              <Li>Attempting to circumvent an active IP lockout by switching to a different IP address, using a VPN, or employing proxy services constitutes a violation of this Agreement and may result in permanent account or organizational account suspension.</Li>
              <Li>Legitimate users who are blocked due to a shared IP address (e.g., corporate NAT) may contact support@transitops.in to request manual review of the lockout.</Li>
              <Li>During an active lockout, the IP address may only access the public landing page and the blocked-access notification page. All other routes return an automatic redirect.</Li>
            </ul>
          </Section>

          <Section num={13} title="Third-Party Services and Integrations">
            <p>The Platform may send OTP emails via third-party SMTP providers (including but not limited to Google Workspace, SendGrid, or Nodemailer-compatible services). These providers are bound by their own terms of service and privacy policies.</p>
            <p>The Platform does not currently embed third-party advertising networks, tracking pixels, or analytics SDKs. Any future integrations of this nature will be disclosed in advance and subject to revision of this Agreement.</p>
            <p>Where the Platform links to external websites or resources, such links are provided for convenience only. TransitOps has no control over and assumes no responsibility for the content, accuracy, or practices of any third-party website.</p>
          </Section>

          <Section num={14} title="Data Accuracy and Operational Liability">
            <p>The Platform is a data management and operational tool. The accuracy of Fleet Data — including odometer readings, driver credentials, trip distances, fuel quantities, and expense amounts — is the sole responsibility of the users who enter and manage such data.</p>
            <p>TransitOps does not independently verify the accuracy of Fleet Data submitted to the Platform. Any operational, regulatory, or financial decisions made on the basis of data stored in the Platform are your responsibility. TransitOps shall not be liable for decisions made based on inaccurate, incomplete, or outdated data.</p>
            <p>Reports, analytics dashboards, and aggregated statistics generated by the Platform are derived computationally from the Fleet Data you submit. The validity of these outputs is directly contingent on the accuracy of the underlying input data.</p>
          </Section>

          <Section num={15} title="Financial Data and Expense Records">
            <p>The Platform supports recording of financial data including fuel costs, maintenance expenditures, trip revenue, and miscellaneous expenses in Indian Rupees (₹). This feature is provided as an operational record-keeping tool only and does not constitute accounting software, financial advisory services, or a system of record for statutory or tax compliance purposes.</p>
            <p>You are solely responsible for ensuring that expense records maintained on the Platform are reconciled with your organization's official accounting systems. TransitOps data does not substitute for formal invoices, GST records, or statutory financial filings.</p>
          </Section>

          <Section num={16} title="Subscription, Billing, and Refund Policy">
            <p>TransitOps may offer the Platform under various subscription tiers, enterprise agreements, or pilot access arrangements. Specific pricing, billing cycles, and included features are governed by the Order Form or Subscription Agreement entered into by your Organization separately from these Terms.</p>
            <p>All fees are non-refundable unless otherwise expressly stated in the applicable Order Form or where required by applicable consumer protection law. In case of a billing dispute, you must notify TransitOps in writing within 30 days of the billing date.</p>
            <p>Failure to pay subscription fees on time may result in suspension of Platform access after a 7-day grace period, during which a data export may be requested. Continued non-payment beyond 30 days may result in permanent termination and purge of Organization data.</p>
          </Section>

          <Section num={17} title="Termination and Account Suspension">
            <p>Either party may terminate this Agreement:</p>
            <ul className="space-y-2">
              <Li><strong>By your Organization:</strong> At any time by submitting a written termination request to support@transitops.in. A 30-day data export window will be provided after termination is processed.</Li>
              <Li><strong>By TransitOps:</strong> Immediately and without notice if you breach any material provision of this Agreement, including the Prohibited Conduct provisions, or engage in activities that pose a security risk to the Platform or other organizations.</Li>
              <Li><strong>By TransitOps:</strong> With 30 days written notice for business reasons including discontinuation of the Platform.</Li>
            </ul>
            <p>Upon termination, all licenses granted to you hereunder immediately cease. Provisions of this Agreement that by their nature should survive termination (including Sections 5, 8, 14, 19, 20, and 21) shall continue to apply.</p>
          </Section>

          <Section num={18} title="Export and Data Portability">
            <p>You have the right to request an export of your Organization's Fleet Data in machine-readable formats (CSV or JSON) at any time during an active subscription. Export requests must be submitted by a verified Super Administrator to support@transitops.in.</p>
            <p>TransitOps will fulfill data export requests within 5 business days for standard data volumes. Exceptionally large datasets (exceeding 100,000 records per module) may require up to 10 business days and may be delivered in compressed archive format.</p>
            <p>Exported data is provided in its raw structured form as stored in the Platform database. Formatting, localization, or transformation into specific third-party formats is not included in standard export fulfillment.</p>
          </Section>

          <Section num={19} title="Limitation of Liability">
            <p>To the fullest extent permitted by applicable law, TransitOps and its officers, directors, employees, agents, and licensors shall not be liable to you or your Organization for any:</p>
            <ul className="space-y-2">
              <Li>Indirect, incidental, special, consequential, or punitive damages, including lost profits, lost revenue, or lost data.</Li>
              <Li>Damages arising from unauthorized access to your account or Fleet Data resulting from your failure to safeguard credentials.</Li>
              <Li>Losses resulting from reliance on inaccurate Fleet Data entered by users of your Organization.</Li>
              <Li>Business interruption, reputational harm, or regulatory penalties arising from Platform downtime, however caused.</Li>
              <Li>Damages attributable to third-party service failures including email providers, cloud hosting infrastructure, or payment processors.</Li>
            </ul>
            <p>In jurisdictions where limitation of liability for consequential damages is not permitted, our liability shall be limited to the maximum extent allowed by law. Our total aggregate liability to your Organization for all claims under this Agreement shall not exceed the total fees paid by your Organization to TransitOps in the 12 months immediately preceding the claim.</p>
          </Section>

          <Section num={20} title="Indemnification">
            <p>You agree to indemnify, defend, and hold harmless TransitOps, its officers, directors, employees, affiliates, agents, and licensors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorney fees) arising out of or relating to:</p>
            <ul className="space-y-2">
              <Li>Your violation of any provision of this Agreement.</Li>
              <Li>Fleet Data submitted by your Organization that infringes any third-party intellectual property, privacy, or data rights.</Li>
              <Li>Your Organization's non-compliance with applicable transport, labor, or data protection laws.</Li>
              <Li>Any claim by a third party arising from your use or misuse of the Platform.</Li>
              <Li>Your gross negligence or willful misconduct in connection with Platform use.</Li>
            </ul>
          </Section>

          <Section num={21} title="Governing Law and Dispute Resolution">
            <p>This Agreement shall be governed by and construed in accordance with the laws of India, without regard to its conflict-of-law provisions. The United Nations Convention on Contracts for the International Sale of Goods does not apply.</p>
            <p>Any dispute arising out of or in connection with this Agreement, including its validity, breach, termination, or interpretation, shall first be subject to good-faith negotiation between the parties for a period of 30 days.</p>
            <p>If the dispute is not resolved through negotiation, it shall be submitted to binding arbitration under the Arbitration and Conciliation Act, 1996 (India), with a sole arbitrator appointed by mutual agreement. The seat of arbitration shall be Bengaluru, Karnataka, India, and proceedings shall be conducted in English.</p>
            <p>Nothing in this clause prevents either party from seeking injunctive relief from a competent court of jurisdiction in Bengaluru, Karnataka, India, where necessary to prevent irreparable harm pending resolution of a dispute.</p>
          </Section>

          <Section num={22} title="Modifications to Terms">
            <p>TransitOps reserves the right to modify, update, or replace any part of this Agreement at any time. Material changes will be communicated to registered Organization administrators via email at least 14 days prior to taking effect. Your continued use of the Platform after such notice period constitutes acceptance of the revised Terms.</p>
            <p>Non-material changes (such as typographic corrections, formatting updates, or clarifying language that does not alter obligations) may take effect immediately without advance notice.</p>
            <p>The version and effective date of the current Terms are indicated at the top of this document. We recommend reviewing this Agreement periodically.</p>
          </Section>

          <Section num={23} title="Severability">
            <p>If any provision of this Agreement is held by a court or arbitrator of competent jurisdiction to be invalid, illegal, or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable, or severed from this Agreement if modification is not possible. The remaining provisions of this Agreement shall continue in full force and effect.</p>
          </Section>

          <Section num={24} title="Entire Agreement">
            <p>This Agreement, together with our Privacy Policy, any applicable Order Forms, and any Service Level Agreement addenda, constitutes the entire agreement between you and TransitOps with respect to the subject matter hereof and supersedes all prior and contemporaneous negotiations, representations, warranties, and agreements — whether written or oral — relating to such subject matter.</p>
          </Section>

          <Section num={25} title="Contact Information">
            <p>For any questions, notices, or inquiries regarding these Terms and Conditions, please contact:</p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-1.5">
              <p><strong>TransitOps Logistics Systems Private Limited</strong></p>
              <p>Legal &amp; Compliance Team</p>
              <p>Email: <strong>legal@transitops.in</strong></p>
              <p>Support: <strong>support@transitops.in</strong></p>
              <p>Address: Bengaluru, Karnataka, India — 560001</p>
              <p>Business Hours: Monday–Friday, 9:00 AM – 6:00 PM IST</p>
            </div>
          </Section>

          {/* Footer */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} TransitOps Logistics Systems · Version 3.1 · October 2026
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
                href="/privacy"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                Privacy Policy →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
