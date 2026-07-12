import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fuelService, vehicleService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { FiSearch, FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

export const FuelLogList = () => {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [vehicleVal, setVehicleVal] = useState('');
  const [typeVal, setTypeVal] = useState('');
  const [paymentVal, setPaymentVal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete Modal states
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Role permissions checks: Writes are restricted to SUPER_ADMIN, FLEET_MANAGER, and FINANCIAL_ANALYST
  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER' || user?.role === 'FINANCIAL_ANALYST';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fuelService.getAll({
        search: searchVal,
        vehicleId: vehicleVal,
        fuelTypeId: typeVal,
        paymentMethod: paymentVal,
        startDate,
        endDate
      });
      if (res.success) {
        setRecords(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve fuel logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, vehicleVal, typeVal, paymentVal, startDate, endDate]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const resVehicles = await vehicleService.getAll();
        const resOptions = await fuelService.getOptions();
        if (resVehicles.success) setVehicles(resVehicles.data || []);
        if (resOptions.success && resOptions.data) {
          setFuelTypes(resOptions.data.fuelTypes || []);
        }
      } catch (err) {
        console.warn('Failed to load filter metadata:', err.message);
      }
    };
    fetchMetadata();
  }, []);

  const handleDeleteRecord = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fuelService.delete(deleteId);
      if (res.success) {
        showToast('Fuel log deleted successfully.', 'success');
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete fuel log.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Vehicle',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.vehicle_plate}</span>
          <span className="text-[10px] text-slate-400 block">{row.vehicle_make} {row.vehicle_model}</span>
        </div>
      )
    },
    {
      header: 'Fueling Date',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {new Date(row.fuelDate).toLocaleDateString()}
        </span>
      )
    },
    { header: 'Fuel Type', accessor: 'fuel_type_label', cell: (row) => <span className="font-semibold text-slate-750 dark:text-slate-250">{row.fuel_type_label}</span> },
    {
      header: 'Cost Metrics',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div>
            <span className="font-semibold text-slate-705 dark:text-slate-300">{row.fuelQuantity.toLocaleString()} L</span>
            <span className="text-[10px] text-slate-400 ml-1">@ ₹{row.costPerLitre.toFixed(2)}/L</span>
          </div>
          <div className="font-mono font-bold text-slate-850 dark:text-slate-200">
            Total: ₹{row.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      )
    },
    { header: 'Odometer (km)', accessor: 'odometerReading', cell: (row) => `${parseInt(row.odometerReading || 0).toLocaleString()} km` },
    { header: 'Invoice Number', accessor: 'invoiceNumber', cell: (row) => <span className="font-mono text-xs text-slate-600 dark:text-slate-350">{row.invoiceNumber || '—'}</span> },
    {
      header: 'Payment Method',
      cell: (row) => {
        let style = 'bg-slate-50 text-slate-650 dark:bg-slate-950/20';
        if (row.paymentMethod === 'UPI') style = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
        else if (row.paymentMethod === 'Company Account') style = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
        else if (row.paymentMethod === 'Card') style = 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400';

        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${style}`}>
            {row.paymentMethod}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/fuel/${row.id}`)}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-605 dark:text-slate-300 transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          
          {canModify && (
            <>
              <button
                onClick={() => navigate(`/fuel/edit/${row.id}`)}
                className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                title="Edit Log"
              >
                <FiEdit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setDeleteId(row.id)}
                className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-650 dark:text-rose-400 transition-colors"
                title="Delete Log"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </>
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
            Fuel Logs & Consumption Metrics
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-550">
            Log vehicle fueling transactions, monitor fuel efficiency, verify invoice receipts, and track payment transactions
          </p>
        </div>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate('/fuel/new')}
            className="flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Log Fueling
          </Button>
        )}
      </div>

      {/* Filter Matrix Panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search vehicle plate, trip, invoice receipt number..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Filter by Payment Method */}
          <div className="w-full md:w-48">
            <select
              value={paymentVal}
              onChange={(e) => setPaymentVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-sm py-2 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Company Account">Company Account</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Filter by Vehicle */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Filter Vehicle
            </label>
            <select
              value={vehicleVal}
              onChange={(e) => setVehicleVal(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-xs py-1.5 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_number} ({v.model_name})</option>
              ))}
            </select>
          </div>

          {/* Filter by Fuel Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Fuel Type
            </label>
            <select
              value={typeVal}
              onChange={(e) => setTypeVal(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-xs py-1.5 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Fuel Types</option>
              {fuelTypes.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Filter Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Logged Start
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs py-1 px-3 rounded-lg outline-none focus:border-primary-500"
            />
          </div>

          {/* Filter End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Logged End
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs py-1 px-3 rounded-lg outline-none focus:border-primary-500"
            />
          </div>

        </div>

      </div>

      {/* Grid Table */}
      <Table
        columns={columns}
        data={records}
        isLoading={isLoading}
        emptyMessage="No fueling log records found."
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Fuel Log"
      >
        <div className="space-y-4 text-sm text-slate-655 dark:text-slate-400">
          <p>Are you sure you want to permanently delete this fueling log record? This action is irreversible.</p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteRecord}
              isLoading={isDeleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default FuelLogList;
