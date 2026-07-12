import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseService, vehicleService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { FiSearch, FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const CATEGORIES = [
  'Maintenance', 'Fuel', 'Insurance', 'Toll', 'Parking',
  'Repair', 'Driver Allowance', 'Office Expense', 'Miscellaneous'
];

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid'];

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Company Account', 'Other'];

export const ExpenseList = () => {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [categoryVal, setCategoryVal] = useState('');
  const [statusVal, setStatusVal] = useState('');
  const [paymentVal, setPaymentVal] = useState('');
  const [vehicleVal, setVehicleVal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete Modal states
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCIAL_ANALYST' || user?.role === 'FLEET_MANAGER';
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCIAL_ANALYST';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await expenseService.getAll({
        search: searchVal,
        category: categoryVal,
        status: statusVal,
        paymentMethod: paymentVal,
        vehicleId: vehicleVal,
        startDate,
        endDate
      });
      if (res.success) {
        setRecords(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve expense records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { loadData(); }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, categoryVal, statusVal, paymentVal, vehicleVal, startDate, endDate]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await vehicleService.getAll();
        if (res.success) setVehicles(res.data || []);
      } catch (err) {
        console.warn('Failed to load filter vehicles:', err.message);
      }
    };
    fetchVehicles();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await expenseService.delete(deleteId);
      if (res.success) {
        showToast('Expense deleted successfully.', 'success');
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'Pending') return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    if (status === 'Approved') return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
    if (status === 'Rejected') return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    if (status === 'Paid') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    return 'bg-slate-50 text-slate-600';
  };

  const columns = [
    {
      header: 'Expense #',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{row.expenseNumber}</span>
      )
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {new Date(row.expenseDate).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Category',
      cell: (row) => <span className="font-semibold text-xs text-slate-750 dark:text-slate-250">{row.category}</span>
    },
    {
      header: 'Vehicle',
      cell: (row) => row.vehicle_plate
        ? <span className="text-xs text-slate-700 dark:text-slate-300">{row.vehicle_plate}</span>
        : <span className="text-xs text-slate-400 italic">—</span>
    },
    {
      header: 'Amount',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-850 dark:text-slate-200">
          ₹{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Payment',
      cell: (row) => <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{row.paymentMethod}</span>
    },
    {
      header: 'Status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/expenses/${row.id}`)}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          {canCreate && (
            <button
              onClick={() => navigate(`/expenses/edit/${row.id}`)}
              className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
              title="Edit"
            >
              <FiEdit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setDeleteId(row.id)}
              className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Expense Ledger
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-550">
            Track, approve, and audit all operational expenses across your fleet
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => navigate('/expenses/new')} className="flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> New Expense
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search expense number, description, invoice..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="w-full md:w-44">
            <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-sm py-2 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <select value={categoryVal} onChange={(e) => setCategoryVal(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-xs py-1.5 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
            <select value={paymentVal} onChange={(e) => setPaymentVal(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-xs py-1.5 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors">
              <option value="">All Payments</option>
              {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle</label>
            <select value={vehicleVal} onChange={(e) => setVehicleVal(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-xs py-1.5 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors">
              <option value="">All Vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} ({v.model_name})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs py-1 px-3 rounded-lg outline-none focus:border-primary-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs py-1 px-3 rounded-lg outline-none focus:border-primary-500" />
          </div>
        </div>
      </div>

      {/* Table */}
      <Table columns={columns} data={records} isLoading={isLoading} emptyMessage="No expense records found." />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Expense">
        <div className="space-y-4 text-sm text-slate-650 dark:text-slate-400">
          <p>Are you sure you want to permanently delete this expense record? This action is irreversible.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>Confirm Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExpenseList;
