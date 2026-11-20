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
  FiGlobe,
  FiUser,
  FiClock,
  FiActivity,
  FiInfo,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { auditLogService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';

export const AuditLogs = () => {
  const { showToast } = useToast();
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

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleDownloadFile = () => {
    const downloadUrl = auditLogService.getDownloadUrl();
    window.open(downloadUrl, '_blank');
    showToast('Initiating audit log file download...', 'info');
  };

  const getActionBadgeColor = (action, status) => {
    if (status === 'FAILED' || action?.includes('FAIL') || action?.includes('BLOCKED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
    }
    if (action?.includes('LOGIN')) {
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
              System Audit & Login Activity Logs
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
            onClick={() => fetchLogs(pagination.page, true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

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
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Action Types</option>
            <option value="LOGIN">Authentication (Login/Logout)</option>
            <option value="DRIVER">Driver Actions</option>
            <option value="VEHICLE">Vehicle Actions</option>
            <option value="TRIP">Trip Actions</option>
            <option value="MAINTENANCE">Maintenance Actions</option>
            <option value="FUEL">Fuel Log Actions</option>
            <option value="EXPENSE">Expense Actions</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Client IP & Route</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                      <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No activity logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const dateStr = new Date(log.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr
                      key={log.id || idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* User Identity */}
                      <td className="py-3.5 px-4">
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
                      </td>

                      {/* Client IP & Route */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <FiGlobe className="w-3 h-3 text-slate-400" />
                          <span>{log.ip_address}</span>
                        </div>
                        {log.path && (
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                            <span className="font-bold text-slate-500">{log.method}</span> {log.path}
                          </div>
                        )}
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

                      {/* Details View */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLogDetail(log)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
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

      {/* Log Detail Modal */}
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

            <div className="flex justify-end pt-2">
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
    </div>
  );
};

export default AuditLogs;
