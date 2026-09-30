import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiLock, FiEye, FiEyeOff, FiTrash2, FiArrowLeft, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { authService, verifyBackendSecurityProof } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

/**
 * Dedicated Full-Page Account Deletion View
 * Replaces narrow modal with a spacious, clear, executive danger-zone layout.
 */
export const DeleteAccount = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!acknowledged) {
      setErrorMessage('You must acknowledge that this action is irreversible before proceeding.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your current account password to authorize deletion.');
      return;
    }

    if (confirmText !== 'DELETE') {
      setErrorMessage('Please type DELETE in uppercase into the confirmation field.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await authService.deleteAccount({ password, confirmText });

      // Verify authoritative backend signature proof
      await verifyBackendSecurityProof(res, 'ACCOUNT_DELETED_VERIFIED');

      showToast('Your staff account has been permanently removed.', 'success');
      logout();
      navigate('/login');
    } catch (err) {
      const msg = err.message || err.data?.message || 'Failed to delete account. Please verify your credentials.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isFormValid = acknowledged && password.length > 0 && confirmText === 'DELETE';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fadeIn">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold"
        >
          <FiArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Button>

        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/40">
          Danger Zone
        </span>
      </div>

      {/* Main Full-Page Danger Card */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Banner */}
        <div className="p-6 sm:p-8 bg-rose-50/60 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
              <FiAlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Delete Account
              </h1>
              <p className="text-sm text-rose-600 dark:text-rose-400 font-medium mt-1">
                Permanent and Irreversible Action for {user?.full_name || user?.email} ({user?.role?.replace('_', ' ')})
              </p>
            </div>
          </div>
        </div>

        {/* Warning checklist */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500 w-4 h-4" /> Please read carefully before continuing:
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pl-6 list-disc">
              <li>
                <strong>Immediate Revocation:</strong> Your login credentials, session cookies, and API authorizations will be terminated immediately.
              </li>
              <li>
                <strong>Profile & Alerts Purge:</strong> Your user profile, personal preferences, and notification inbox will be permanently deleted from the database.
              </li>
              <li>
                <strong>Audit Trail Retention:</strong> Operational records created by your account (such as vehicle logs, trips, and expenses) will be preserved anonymously to maintain fleet regulatory audit integrity.
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleDelete} className="space-y-5 max-w-xl">
            
            {/* Password input with toggle */}
            <Input
              id="confirm-password"
              name="password"
              label="Enter Current Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={FiLock}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex="-1"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Type DELETE confirmation */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-text" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                To verify, type <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">DELETE</span> below: *
              </label>
              <input
                id="confirm-text"
                type="text"
                placeholder="Type DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full py-2.5 px-3.5 text-sm bg-white dark:bg-[#0E1422] border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Acknowledgment Checkbox */}
            <div
              onClick={() => setAcknowledged(!acknowledged)}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              {acknowledged ? (
                <FiCheckSquare className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <FiSquare className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <span className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                I understand that deleting my account is permanent and cannot be reversed.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={!isFormValid || isDeleting}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    Permanently Delete My Account
                  </>
                )}
              </button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isDeleting}
                className="px-6 py-3 text-xs font-semibold"
              >
                Cancel and Keep Account
              </Button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

export default DeleteAccount;
