import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiAlertOctagon,
  FiGlobe,
  FiUser,
  FiClock,
  FiActivity,
  FiInfo,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiUnlock,
  FiSlash,
  FiRotateCcw
} from 'react-icons/fi';
import { auditLogService, securityService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';

export const AuditLogs = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Navigation tab
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'security'

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    successfulLogins: 0,
    failedLogins: 0,
    uniqueIps: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Security Management State
  const [blockedIps, setBlockedIps] = useState([]);
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual IP Form
  const [manualIp, setManualIp] = useState('');
  const [manualIpReason, setManualIpReason] = useState('Suspicious automated activity detected by Super Admin');
  const [manualIpDuration, setManualIpDuration] = useState('1440');

  // Manual Account Lock Form
  const [manualEmail, setManualEmail] = useState('');
  const [manualEmailReason, setManualEmailReason] = useState('Compromised credential / safety lockdown by Super Admin');
  const [manualEmailDuration, setManualEmailDuration] = useState('1440');

  // Modals
  const [ipModal, setIpModal] = useState({ isOpen: false, ip: '', reason: '', duration: '1440' });
  const [accountModal, setAccountModal] = useState({ isOpen: false, email: '', name: '', reason: '', duration: '1440' });
  const [rollbackModal, setRollbackModal] = useState({ isOpen: false, log: null });

  // Eligibility check for rollback
  const isRollbackEligible = (action) => {
    if (!action) return false;
    return (
      action.startsWith('CREATE_') ||
      action.startsWith('UPDATE_') ||
      action.startsWith('DELETE_') ||
      action === 'RECORD_EXPENSE' ||
      action === 'ADMIN_REVOKE_IP_ACCESS' ||
      action === 'ADMIN_LOCK_ACCOUNT'
    );
  };

  // Fetch audit logs and overview stats
  const fetchLogs = useCallback(async (page = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [logsRes, statsRes] = await Promise.all([
        auditLogService.getLogs({
          page,
          limit: pagination.limit,
          search: debouncedSearch,
          status: selectedStatus,
          action: selectedAction
        }, { cache: false }),
        auditLogService.getStats({ cache: false })
      ]);

      if (logsRes?.success) {
        setLogs(logsRes.data || []);
        if (logsRes.pagination) {
          setPagination(logsRes.pagination);
        }
      }

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve audit activity logs.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, selectedStatus, selectedAction, pagination.limit, showToast]);

  // Fetch security items (blocked IPs & locked accounts)
  const fetchSecurityData = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingSecurity(true);
    try {
      const [ipsRes, accsRes] = await Promise.all([
        securityService.getBlockedIps(),
        securityService.getLockedAccounts()
      ]);

      if (ipsRes?.success) {
        setBlockedIps(ipsRes.data || []);
      }
      if (accsRes?.success) {
        setLockedAccounts(accsRes.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load security lockdown state.', 'error');
    } finally {
      setLoadingSecurity(false);
    }
  }, [isSuperAdmin, showToast]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  useEffect(() => {
    if (activeTab === 'security' && isSuperAdmin) {
      fetchSecurityData();
    }
  }, [activeTab, isSuperAdmin, fetchSecurityData]);

  const handleDownloadFile = () => {
    const downloadUrl = auditLogService.getDownloadUrl();
    window.open(downloadUrl, '_blank');
    showToast('Initiating audit log file download...', 'info');
  };

  // Super Admin Action: Revoke IP
  const handleRevokeIp = async (ipToRevoke, reason, duration) => {
    if (!ipToRevoke) return;
    setActionLoading(true);
    try {
      const res = await securityService.revokeIpAccess({
        ip: ipToRevoke,
        reason: reason || 'Suspicious access revoked by Super Admin',
        durationMinutes: parseInt(duration, 10) || 1440
      });
      showToast(res.message || `IP ${ipToRevoke} access revoked successfully.`, 'success');
      setIpModal({ isOpen: false, ip: '', reason: '', duration: '1440' });
      setManualIp('');
      fetchSecurityData();
      fetchLogs(pagination.page, true);
    } catch (err) {
      showToast(err.message || 'Failed to revoke IP access.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Super Admin Action: Restore IP
  const handleRestoreIp = async (ipToRestore) => {
    if (!ipToRestore) return;
    setActionLoading(true);
    try {
      const res = await securityService.restoreIpAccess({ ip: ipToRestore });
      showToast(res.message || `IP ${ipToRestore} access restored successfully.`, 'success');
      fetchSecurityData();
      fetchLogs(pagination.page, true);
    } catch (err) {
      showToast(err.message || 'Failed to restore IP access.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Super Admin Action: Lock Account
  const handleLockAccount = async (emailToLock, reason, duration) => {
    if (!emailToLock) return;
    setActionLoading(true);
    try {
      const res = await securityService.lockAccount({
        email: emailToLock,
        reason: reason || 'Safety lockdown by Super Admin',
        durationMinutes: parseInt(duration, 10) || 1440
      });
      showToast(res.message || `Account ${emailToLock} locked down successfully.`, 'success');
      setAccountModal({ isOpen: false, email: '', name: '', reason: '', duration: '1440' });
      setManualEmail('');
      fetchSecurityData();
      fetchLogs(pagination.page, true);
    } catch (err) {
      showToast(err.message || 'Failed to lock account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Super Admin Action: Unlock Account
  const handleUnlockAccount = async (emailToUnlock) => {
    if (!emailToUnlock) return;
    setActionLoading(true);
    try {
      const res = await securityService.unlockAccount({ email: emailToUnlock });
      showToast(res.message || `Account ${emailToUnlock} restored to ACTIVE status.`, 'success');
      fetchSecurityData();
      fetchLogs(pagination.page, true);
    } catch (err) {
      showToast(err.message || 'Failed to unlock account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Super Admin Action: Rollback action to previous state
  const handleRollback = async (logId) => {
    if (!logId) return;
    setActionLoading(true);
    try {
      const res = await securityService.rollbackAction(logId);
      showToast(res.message || 'Action state successfully rolled back to previous state.', 'success');
      setRollbackModal({ isOpen: false, log: null });
      if (selectedLogDetail && selectedLogDetail.id === logId) {
        setSelectedLogDetail(null);
      }
      fetchLogs(pagination.page, true);
      if (activeTab === 'security') {
        fetchSecurityData();
      }
    } catch (err) {
      showToast(err.message || 'Rollback execution failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionBadgeColor = (action, status) => {
    if (action?.includes('ROLLBACK')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50';
    }
    if (status === 'FAILED' || action?.includes('FAIL') || action?.includes('BLOCKED') || action?.includes('REVOKE') || action?.includes('LOCK')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
    }
    if (action?.includes('LOGIN') || action?.includes('RESTORE') || action?.includes('UNLOCK')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
    }
    if (action?.includes('CREATE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
    }
    if (action?.includes('UPDATE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    }
    if (action?.includes('DELETE')) {
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900">
              <FiShield className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              System Audit & Security Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking of staff authentications, client IP addresses, failure strikes, and operational database changes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadFile}
            className="flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download Log File</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (activeTab === 'logs') fetchLogs(pagination.page, true);
              else fetchSecurityData();
            }}
            disabled={refreshing || loadingSecurity}
            className="flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing || loadingSecurity ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'logs'
              ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-blue-500" />
            <span>Audit & Login Activity Logs</span>
          </div>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'security'
                ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-600 dark:border-rose-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiAlertOctagon className="w-4 h-4 text-rose-500" />
              <span>Security Lockdown & Access Control</span>
              {(blockedIps.length > 0 || lockedAccounts.length > 0) && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                  {blockedIps.length + lockedAccounts.length}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* TAB 1: AUDIT & LOGIN ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Events */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Recorded Events</span>
                <FiActivity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalEvents.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">All actions & queries</span>
            </div>

            {/* Successful Logins */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Successful Logins</span>
                <FiCheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.successfulLogins.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Authorized staff entries</span>
            </div>

            {/* Failed Login Attempts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Failed Attempts</span>
                <FiXCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {stats.failedLogins.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Blocked or bad credentials</span>
            </div>

            {/* Unique Access IPs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Unique Client IPs</span>
                <FiGlobe className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.uniqueIps.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Distinct network origins</span>
            </div>
          </div>

          {/* Filter and Search Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search email, IP address, user name..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">All Action Types</option>
                <option value="LOGIN">Authentication (Login/Logout)</option>
                <option value="ADMIN_REVOKE">IP Revocations</option>
                <option value="ADMIN_LOCK">Account Lockdowns</option>
                <option value="ADMIN_ROLLBACK">Rollback Operations</option>
                <option value="DRIVER">Driver Actions</option>
                <option value="VEHICLE">Vehicle Actions</option>
                <option value="TRIP">Trip Actions</option>
                <option value="MAINTENANCE">Maintenance Actions</option>
                <option value="FUEL">Fuel Log Actions</option>
                <option value="EXPENSE">Expense Actions</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILED">Failed / Blocked Only</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Staff / Identity</th>
                    <th className="py-3 px-4">Client IP Origin</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <FiRefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                        Fetching activity logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No activity records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isSelf = log.user_email && user?.email && log.user_email.toLowerCase() === user.email.toLowerCase();
                      const isSuperAdminUser = log.user_role === 'SUPER_ADMIN';

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Timestamp */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <FiClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </td>

                          {/* User Identity */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200 dark:border-slate-700">
                                  {(log.user_name || log.user_email || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {log.user_name || 'Anonymous User'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    {log.user_email || 'Unspecified'}
                                  </div>
                                  {log.user_role && log.user_role !== 'ANONYMOUS' && (
                                    <span className="inline-block mt-0.5 text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                      {log.user_role}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Super Admin Quick Action: Lock Account */}
                              {isSuperAdmin && log.user_email && !isSelf && !isSuperAdminUser && (
                                <button
                                  title="Super Admin: Lock this account for safety"
                                  onClick={() => setAccountModal({
                                    isOpen: true,
                                    email: log.user_email,
                                    name: log.user_name || log.user_email,
                                    reason: 'Suspicious activity observed in audit logs',
                                    duration: '1440'
                                  })}
                                  className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors cursor-pointer shrink-0"
                                >
                                  <FiLock className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Client IP & Route */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <FiGlobe className="w-3 h-3 text-slate-400" />
                                  <span>{log.ip_address}</span>
                                </div>
                                {log.path && (
                                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                                    <span className="font-bold text-slate-500">{log.method}</span> {log.path}
                                  </div>
                                )}
                              </div>

                              {/* Super Admin Quick Action: Revoke IP Access */}
                              {isSuperAdmin && log.ip_address && log.ip_address !== '127.0.0.1' && log.ip_address !== '::1' && (
                                <button
                                  title="Super Admin: Revoke access from this suspicious IP"
                                  onClick={() => setIpModal({
                                    isOpen: true,
                                    ip: log.ip_address,
                                    reason: 'Suspicious origin detected in audit logs',
                                    duration: '1440'
                                  })}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer shrink-0"
                                >
                                  <FiSlash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionBadgeColor(log.action, log.status)}`}>
                              {log.action}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {log.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                <FiCheckCircle className="w-3.5 h-3.5" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                                <FiXCircle className="w-3.5 h-3.5" />
                                Failed
                              </span>
                            )}
                          </td>

                          {/* Details & Rollback Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {log.details?.rolledBack && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                                  ROLLED BACK
                                </span>
                              )}

                              {isSuperAdmin && !log.details?.rolledBack && isRollbackEligible(log.action) && (
                                <button
                                  title="Super Admin: Rollback this action to previous state"
                                  onClick={() => setRollbackModal({ isOpen: true, log })}
                                  className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FiRotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>Rollback</span>
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedLogDetail(log)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div>
                  Showing Page <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> of{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total} total logs)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchLogs(pagination.page - 1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchLogs(pagination.page + 1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY LOCKDOWN & ACCESS CONTROL (SUPER ADMIN ONLY) */}
      {activeTab === 'security' && isSuperAdmin && (
        <div className="space-y-8">
          {/* Super Admin Notice Banner */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 flex items-start gap-3">
            <FiAlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="font-bold text-sm">Super Admin Emergency Threat Mitigation</div>
              <p>
                As a Super Admin, you have supreme administrative authority to immediately revoke ingress from suspicious IP addresses and lock down compromised accounts. Revoking an IP immediately terminates active requests, bans future handshakes, and routes client connections to the safety security screen. Locking an account freezes its active credentials and marks its status as <span className="font-mono font-bold">SUSPENDED</span> in the operational database.
              </p>
            </div>
          </div>

          {/* Section 1: Suspicious IP Access Revocation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FiSlash className="w-4 h-4 text-rose-600" />
                  Suspicious IP Access Revocation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instantly block malicious origins, bot networks, and suspicious IPs from communicating with TransitOps.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {blockedIps.length} Active Revocation(s)
              </span>
            </div>

            {/* Manual IP Revocation Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRevokeIp(manualIp, manualIpReason, manualIpDuration);
              }}
              className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  IP Address to Revoke
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 198.51.100.42"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Revocation Reason
                </label>
                <input
                  type="text"
                  value={manualIpReason}
                  onChange={(e) => setManualIpReason(e.target.value)}
                  placeholder="Reason for blocking IP"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Ban Duration
                </label>
                <select
                  value={manualIpDuration}
                  onChange={(e) => setManualIpDuration(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="60">1 Hour</option>
                  <option value="360">6 Hours</option>
                  <option value="1440">24 Hours (1 Day)</option>
                  <option value="10080">7 Days</option>
                  <option value="525600">1 Year (Permanent)</option>
                </select>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading || !manualIp}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5"
                >
                  <FiSlash className="w-3.5 h-3.5" />
                  <span>Revoke IP Access</span>
                </Button>
              </div>
            </form>

            {/* Blocked IPs Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Blocked IP</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Revoked At</th>
                    <th className="py-2.5 px-3">Duration / Remaining</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {blockedIps.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        No IP addresses are currently revoked or blocked.
                      </td>
                    </tr>
                  ) : (
                    blockedIps.map((b) => (
                      <tr key={b.ip} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                          {b.ip}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {b.reason || 'Suspicious access pattern'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {new Date(b.blockedAt).toLocaleTimeString()} ({new Date(b.blockedAt).toLocaleDateString()})
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                            {b.remainingMinutes ? `${b.remainingMinutes} min remaining` : b.formattedDuration}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleRestoreIp(b.ip)}
                            disabled={actionLoading}
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <FiUnlock className="w-3 h-3 mr-1 inline" />
                            Restore Access
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Compromised Staff Account Lockdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FiLock className="w-4 h-4 text-amber-600" />
                  Compromised Account Safety Lockdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Safely freeze accounts flagged for suspicious logins or credential leaks to prevent unauthorized operational tampering.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {lockedAccounts.length} Suspended Account(s)
              </span>
            </div>

            {/* Manual Account Lock Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLockAccount(manualEmail, manualEmailReason, manualEmailDuration);
              }}
              className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Staff Email to Lock
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. employee@transitops.internal"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Lockdown Reason
                </label>
                <input
                  type="text"
                  value={manualEmailReason}
                  onChange={(e) => setManualEmailReason(e.target.value)}
                  placeholder="Reason for account freeze"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Lockout Duration
                </label>
                <select
                  value={manualEmailDuration}
                  onChange={(e) => setManualEmailDuration(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="60">1 Hour</option>
                  <option value="360">6 Hours</option>
                  <option value="1440">24 Hours (1 Day)</option>
                  <option value="10080">7 Days</option>
                  <option value="525600">Until Manual Admin Unlock</option>
                </select>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading || !manualEmail}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5"
                >
                  <FiLock className="w-3.5 h-3.5" />
                  <span>Lock Account for Safety</span>
                </Button>
              </div>
            </form>

            {/* Locked Accounts Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Locked Since</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {lockedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No accounts are currently suspended or locked.
                      </td>
                    </tr>
                  ) : (
                    lockedAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{acc.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{acc.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {acc.role_name}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                            SUSPENDED
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {acc.reason}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {new Date(acc.lockedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleUnlockAccount(acc.email)}
                            disabled={actionLoading}
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <FiUnlock className="w-3 h-3 mr-1 inline" />
                            Unlock Account
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUICK REVOKE IP MODAL */}
      {ipModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <FiSlash className="w-4 h-4" />
                Revoke Access for Suspicious IP
              </h3>
              <button
                onClick={() => setIpModal({ isOpen: false, ip: '', reason: '', duration: '1440' })}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Target IP Address:</span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {ipModal.ip}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Revocation Reason
                </label>
                <input
                  type="text"
                  value={ipModal.reason}
                  onChange={(e) => setIpModal({ ...ipModal, reason: e.target.value })}
                  placeholder="e.g. Brute-force credential stuffing / malicious probing"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Revocation Duration
                </label>
                <select
                  value={ipModal.duration}
                  onChange={(e) => setIpModal({ ...ipModal, duration: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="60">1 Hour</option>
                  <option value="360">6 Hours</option>
                  <option value="1440">24 Hours (1 Day)</option>
                  <option value="10080">7 Days</option>
                  <option value="525600">Permanent (1 Year)</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                This will immediately drop all active connections from this IP and deny access to the portal and API endpoints.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIpModal({ isOpen: false, ip: '', reason: '', duration: '1440' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={() => handleRevokeIp(ipModal.ip, ipModal.reason, ipModal.duration)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Revoke Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK LOCK ACCOUNT MODAL */}
      {accountModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <FiLock className="w-4 h-4" />
                Emergency Account Safety Lockdown
              </h3>
              <button
                onClick={() => setAccountModal({ isOpen: false, email: '', name: '', reason: '', duration: '1440' })}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Target Staff Account:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {accountModal.name} <span className="font-mono text-slate-500 font-normal">({accountModal.email})</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Lockdown Reason
                </label>
                <input
                  type="text"
                  value={accountModal.reason}
                  onChange={(e) => setAccountModal({ ...accountModal, reason: e.target.value })}
                  placeholder="e.g. Account credentials suspected compromised"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Lockout Duration
                </label>
                <select
                  value={accountModal.duration}
                  onChange={(e) => setAccountModal({ ...accountModal, duration: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="60">1 Hour</option>
                  <option value="360">6 Hours</option>
                  <option value="1440">24 Hours (1 Day)</option>
                  <option value="10080">7 Days</option>
                  <option value="525600">Until Manual Admin Unlock</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                This locks down the account status to <span className="font-mono font-bold">SUSPENDED</span> in PostgreSQL and instantly terminates login ability across all active sessions.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAccountModal({ isOpen: false, email: '', name: '', reason: '', duration: '1440' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={() => handleLockAccount(accountModal.email, accountModal.reason, accountModal.duration)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Confirm Account Lock
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LOG RECORD INSPECTOR MODAL */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-blue-500" />
                Audit Record Inspector
              </h3>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Event Action:</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {selectedLogDetail.action} ({selectedLogDetail.status})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 uppercase font-semibold">IP Address:</span>
                  <div className="font-mono text-slate-900 dark:text-white mt-0.5">{selectedLogDetail.ip_address}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Time:</span>
                  <div className="text-slate-900 dark:text-white mt-0.5">
                    {new Date(selectedLogDetail.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-semibold">User Details:</span>
                <div className="text-slate-900 dark:text-white mt-0.5">
                  {selectedLogDetail.user_name} ({selectedLogDetail.user_email}) &middot; {selectedLogDetail.user_role}
                </div>
              </div>

              {selectedLogDetail.user_agent && (
                <div>
                  <span className="text-slate-400 uppercase font-semibold">User Agent / Client:</span>
                  <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px] bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 break-all">
                    {selectedLogDetail.user_agent}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 uppercase font-semibold">Metadata & Payloads:</span>
                <pre className="font-mono text-[11px] bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLogDetail.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {isSuperAdmin && !selectedLogDetail.details?.rolledBack && isRollbackEligible(selectedLogDetail.action) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const targetLog = selectedLogDetail;
                    setRollbackModal({ isOpen: true, log: targetLog });
                  }}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950/40 flex items-center gap-1.5"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                  <span>Rollback to Previous State</span>
                </Button>
              ) : <div />}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedLogDetail(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ROLLBACK CONFIRMATION MODAL */}
      {rollbackModal.isOpen && rollbackModal.log && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <FiRotateCcw className="w-4 h-4" />
                Rollback Action to Previous State
              </h3>
              <button
                onClick={() => setRollbackModal({ isOpen: false, log: null })}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <FiAlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>State Reversion Security Guard</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                  Rolling back will reverse the effects of this operational action and restore the affected database record to its verified prior state.
                </p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 font-sans font-semibold uppercase">Action: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{rollbackModal.log.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-semibold uppercase">Target Resource: </span>
                  <span className="text-slate-900 dark:text-white">{rollbackModal.log.details?.resourceType || rollbackModal.log.action.split('_')[1] || 'Entity'} ({rollbackModal.log.details?.resourceId || rollbackModal.log.details?.rawId || rollbackModal.log.id})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-semibold uppercase">Performed By: </span>
                  <span className="text-slate-900 dark:text-white">{rollbackModal.log.user_name} ({rollbackModal.log.user_email})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-semibold uppercase">Origin IP: </span>
                  <span className="text-slate-900 dark:text-white">{rollbackModal.log.ip_address}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-semibold uppercase">Recorded At: </span>
                  <span className="text-slate-900 dark:text-white">{new Date(rollbackModal.log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {rollbackModal.log.action.startsWith('CREATE_') || rollbackModal.log.action === 'RECORD_EXPENSE' ? (
                  <p>Impact: The newly created record will be permanently deleted from the database to restore previous state.</p>
                ) : rollbackModal.log.action.startsWith('DELETE_') ? (
                  <p>Impact: The deleted record will be resurrected and re-inserted with its historical attributes.</p>
                ) : rollbackModal.log.action.startsWith('UPDATE_') ? (
                  <p>Impact: Modified fields will be reverted back to their values prior to this update.</p>
                ) : (
                  <p>Impact: Security state will be restored to its previous operational standing.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRollbackModal({ isOpen: false, log: null })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={() => handleRollback(rollbackModal.log.id)}
                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
              >
                <FiRotateCcw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>Confirm & Rollback State</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
