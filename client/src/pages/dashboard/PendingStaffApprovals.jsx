import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiClock, FiUserCheck, FiShield, FiRefreshCw, FiMail, FiPhone, FiSend } from 'react-icons/fi';
import { authService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';

/**
 * Administrative Staff Approvals Queue Card
 * Displayed for Super Admins and Fleet Managers to authorize or decline new registrations
 */
export const PendingStaffApprovals = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await authService.getPendingApprovals();
      if (res && res.success) {
        setPendingUsers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPending(false);
  }, [fetchPending]);

  const handleApprove = async (id, name, email) => {
    setProcessingId(id);
    try {
      const res = await authService.approveUser(id);
      if (res && res.success) {
        showToast(`Staff member ${name} (${email}) has been authorized.`, 'success');
        setPendingUsers(prev => prev.filter(u => u.id !== id));
      } else {
        showToast(res?.message || 'Failed to approve staff member.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error authorizing user.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, name, email) => {
    if (!window.confirm(`Are you sure you want to reject the registration for ${name} (${email})?`)) {
      return;
    }
    setProcessingId(id);
    try {
      const res = await authService.rejectUser(id);
      if (res && res.success) {
        showToast(`Registration for ${name} has been rejected.`, 'info');
        setPendingUsers(prev => prev.filter(u => u.id !== id));
      } else {
        showToast(res?.message || 'Failed to reject registration.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error rejecting user.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (roleName) => {
    const roleColors = {
      FLEET_MANAGER: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      DISPATCHER: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      SAFETY_OFFICER: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      FINANCIAL_ANALYST: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    };
    const formatRole = (roleName || '').replace('_', ' ');

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${roleColors[roleName] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
        {formatRole}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="h-16 w-full bg-slate-100 dark:bg-slate-900 rounded" />
      </div>
    );
  }

  // Only render section if there are pending users or when explicitly viewing
  if (pendingUsers.length === 0) {
    return null; // Keep dashboard compact when no pending approvals exist
  }

  return (
    <div className="bg-white dark:bg-[#111827] border border-amber-200 dark:border-amber-900/60 rounded-xl shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:px-6 py-4 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            <FiShield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {user?.role === 'SUPER_ADMIN' ? 'Staff & Fleet Manager Approval Queue' : 'Staff Registration Approval Queue'}
              <span className="px-2 py-0.2 rounded-full text-xs font-semibold bg-amber-500 text-white">
                {pendingUsers.length} Pending
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Clearance required before credentials are activated. An automated decision email is sent immediately to the user upon approval or decline.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchPending(true)}
          disabled={refreshing}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition"
          title="Refresh queue"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Pending users list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {pendingUsers.map(candidate => (
          <div
            key={candidate.id}
            className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#0E1422] transition"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {candidate.full_name}
                </span>
                {getRoleBadge(candidate.role_name)}
                {candidate.role_name === 'FLEET_MANAGER' && (
                  <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    Super Admin Approval Required
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <FiMail className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                    {candidate.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px]">
                  <FiClock className="w-3 h-3 text-slate-400" />
                  Registered {new Date(candidate.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                type="button"
                variant="outline"
                className="text-xs py-1.5 px-3 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                isLoading={processingId === candidate.id}
                disabled={processingId !== null}
                onClick={() => handleReject(candidate.id, candidate.full_name, candidate.email)}
              >
                <FiX className="w-3.5 h-3.5" /> Decline
              </Button>

              <Button
                type="button"
                variant="primary"
                className="text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center gap-1.5 font-semibold"
                isLoading={processingId === candidate.id}
                disabled={processingId !== null}
                onClick={() => handleApprove(candidate.id, candidate.full_name, candidate.email)}
              >
                <FiCheck className="w-3.5 h-3.5" /> Approve Access
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingStaffApprovals;
