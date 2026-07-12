import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expenseService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';
import { FiArrowLeft, FiEdit, FiInfo, FiTruck, FiDollarSign, FiFileText, FiCheckCircle } from 'react-icons/fi';

export const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCIAL_ANALYST' || user?.role === 'FLEET_MANAGER';

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await expenseService.getById(id);
        if (res.success) {
          setRecord(res.data);
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve expense details.', 'error');
        navigate('/expenses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600" />
      </div>
    );
  }

  if (!record) return null;

  const getStatusStyle = (status) => {
    if (status === 'Pending') return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    if (status === 'Approved') return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
    if (status === 'Rejected') return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    if (status === 'Paid') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    return 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/expenses')} className="flex items-center gap-2">
          <FiArrowLeft className="w-4 h-4" /> Back to List
        </Button>
        {canModify && (
          <Button variant="primary" onClick={() => navigate(`/expenses/edit/${record.id}`)} className="flex items-center gap-2">
            <FiEdit className="w-4 h-4" /> Edit Details
          </Button>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">

        {/* Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-primary-500 rounded-xl shrink-0">
              <FiFileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {record.expenseNumber}
              </h2>
              <p className="text-xs text-slate-400 mt-2 font-semibold">
                {record.category}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusStyle(record.status)}`}>
              {record.status}
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              ₹{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Expense Date</span>
            <span className="font-semibold text-sm text-slate-750 dark:text-slate-205">{new Date(record.expenseDate).toLocaleDateString()}</span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Payment Method</span>
            <span className="font-semibold text-sm text-slate-750 dark:text-slate-205">{record.paymentMethod}</span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Invoice / Receipt</span>
            <span className="font-semibold font-mono text-sm text-slate-750 dark:text-slate-205">{record.invoiceNumber || '—'}</span>
          </div>
        </div>

        {/* Vehicle, Trip, Vendor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <FiTruck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vehicle</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {record.vehicle_plate ? `${record.vehicle_plate} (${record.vehicle_make} ${record.vehicle_model})` : 'Not Linked'}
              </h4>
            </div>
          </div>

          <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trip</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {record.trip_code || 'Not Linked'}
            </span>
          </div>

          <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {record.vendorName || 'Not Specified'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
          <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed">
            {record.description}
          </p>
        </div>

        {/* Remarks */}
        <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks</h4>
          <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed italic">
            {record.remarks ? `"${record.remarks}"` : 'No remarks recorded for this expense.'}
          </p>
        </div>

        {/* Approval Info */}
        {record.approver_name && (
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-3">
            <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {record.status === 'Rejected' ? 'Rejected' : 'Approved'} by {record.approver_name}
              </span>
              {record.approvedAt && (
                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 ml-2">
                  on {new Date(record.approvedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Audit Metadata */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-550">
          <FiInfo className="w-3.5 h-3.5 shrink-0" />
          <span>
            Created by {record.creator_name || 'System'} on {new Date(record.created_at).toLocaleDateString()}.
            Last modified on {new Date(record.updated_at).toLocaleString()}.
          </span>
        </div>

      </div>
    </div>
  );
};

export default ExpenseDetails;
