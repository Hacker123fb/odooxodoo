import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiLock, FiEye, FiEyeOff, FiTrash2, FiX } from 'react-icons/fi';
import { authService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const DeleteAccountModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    if (isDeleting) return;
    setPassword('');
    setConfirmText('');
    setErrorMessage('');
    onClose();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter your password to confirm account deletion.');
      return;
    }

    if (confirmText !== 'DELETE') {
      setErrorMessage('Please type DELETE exactly in uppercase to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      await authService.deleteAccount({ password, confirmText });
      showToast('Your account has been permanently deleted.', 'success');
      handleClose();
      logout();
      navigate('/login');
    } catch (err) {
      const msg = err.message || err.data?.message || 'Failed to delete account. Please verify your password.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmed = password.length > 0 && confirmText === 'DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="p-6 pb-4 border-b border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Account
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Irreversible Permanent Action
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleDelete} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              Please read carefully before proceeding:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
              <li>Your user credentials and access tokens will be revoked immediately.</li>
              <li>Your profile and notifications will be permanently purged.</li>
              <li>System records created by your account will be securely retained for fleet audit integrity.</li>
            </ul>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Password Confirmation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enter Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                disabled={isDeleting}
                className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Type DELETE confirmation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              To verify, type <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">DELETE</span> below:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isDeleting}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 tracking-wider"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 transition-all"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
