import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiLock } from 'react-icons/fi';
import Button from '../../components/common/Button.jsx';

/**
 * Enterprise Privacy Policy page for TransitOps
 */
export const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Last updated: October 2026 • TransitOps Operations Platform
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 self-start sm:self-auto text-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Commitment to Data Privacy</h2>
            <p>
              At TransitOps, we are committed to maintaining the confidentiality, integrity, and security of personal and operational information. This Privacy Policy outlines our practices regarding information collection, usage, and protection.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
              <li><strong>Staff Account Data:</strong> Name, work email address, contact telephone, and employee role.</li>
              <li><strong>Operator Records:</strong> Driver identification numbers, license credentials, and safety status.</li>
              <li><strong>Fleet Telemetry:</strong> Vehicle registration plates, fuel logs, service history, and trip dispatch itineraries.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">3. How Information is Used</h2>
            <p>
              Data collected is strictly used to power fleet dispatch, generate operational reports, alert staff of vehicle maintenance, and calculate fuel efficiency. We do not sell, rent, or monetize your fleet data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Data Security & Storage</h2>
            <p>
              All operational records are stored in enterprise-grade encrypted databases. Access to company data is guarded by multi-factor session validation and restricted by designated organizational roles.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">5. Data Retention & Account Deletion</h2>
            <p>
              Users may request removal of their account credentials or export of their fleet records by contacting their company Super Administrator or reaching out to privacy@transitops.com.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">6. Contact Our Privacy Officer</h2>
            <p>
              If you have any questions or concerns regarding this policy, please email <span className="font-semibold text-slate-900 dark:text-white">privacy@transitops.com</span>.
            </p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>© {new Date().getFullYear()} TransitOps Logistics Systems</span>
          <Button variant="primary" onClick={() => navigate('/login')} className="text-xs">
            Return to Login
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Privacy;
