import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceService, vehicleService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { FiSearch, FiPlus, FiEye, FiEdit, FiTrash2, FiCalendar, FiDollarSign } from 'react-icons/fi';

export const MaintenanceList = () => {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [statusVal, setStatusVal] = useState('');
  const [vehicleVal, setVehicleVal] = useState('');
  const [typeVal, setTypeVal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete Modal states
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Role permissions checks: Only SUPER_ADMIN and FLEET_MANAGER can write
  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceService.getAll({
        search: searchVal,
        status: statusVal,
        vehicleId: vehicleVal,
        maintenanceType: typeVal,
        startDate,
        endDate
      });
      if (res.success) {
        setRecords(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve maintenance logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, statusVal, vehicleVal, typeVal, startDate, endDate]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await vehicleService.getAll();
        if (res.success) {
          setVehicles(res.data || []);
        }
      } catch (err) {
        console.warn('Failed to load filter vehicles:', err.message);
      }
    };
    fetchVehicles();
  }, []);

  const handleDeleteRecord = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await maintenanceService.delete(deleteId);
      if (res.success) {
        showToast('Maintenance record deleted successfully.', 'success');
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete record.', 'error');
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
    { header: 'Maintenance Type', accessor: 'maintenanceType', cell: (row) => <span className="font-semibold text-slate-750 dark:text-slate-250">{row.maintenanceType}</span> },
    {
      header: 'Maintenance Date',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {new Date(row.maintenanceDate).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Estimated Cost',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
          ₹{parseFloat(row.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { header: 'Odometer (km)', accessor: 'odometerReading', cell: (row) => `${parseInt(row.odometerReading || 0).toLocaleString()} km` },
    {
      header: 'Status',
      cell: (row) => {
        let style = 'bg-slate-50 text-slate-650 dark:bg-slate-950/20';
        if (row.status === 'Scheduled') style = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
        else if (row.status === 'In Progress') style = 'bg-amber-50 text-amber-605 dark:bg-amber-950/20 dark:text-amber-400';
        else if (row.status === 'Completed') style = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
        else if (row.status === 'Cancelled') style = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';

        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/maintenance/${row.id}`)}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          
          {canModify && (
            <>
              <button
                onClick={() => navigate(`/maintenance/edit/${row.id}`)}
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
            Vehicle Maintenance Work Orders
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-550">
            Log maintenance tasks, check repair statuses, schedule inspections and audit cost metrics
          </p>
        </div>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate('/maintenance/new')}
            className="flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Log Maintenance
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
              placeholder="Search vehicle registration, service type, or remarks..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Filter by Status */}
          <div className="w-full md:w-48">
            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-sm py-2 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
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

          {/* Filter by Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Service Type
            </label>
            <select
              value={typeVal}
              onChange={(e) => setTypeVal(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-xs py-1.5 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Types</option>
              <option value="Routine Service">Routine Service</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Tyre Replacement">Tyre Replacement</option>
              <option value="Brake Service">Brake Service</option>
              <option value="Engine Repair">Engine Repair</option>
              <option value="Accident Repair">Accident Repair</option>
              <option value="Inspection">Inspection</option>
              <option value="Other">Other</option>
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
        emptyMessage="No vehicle maintenance records found."
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Maintenance Log"
      >
        <div className="space-y-4 text-sm text-slate-650 dark:text-slate-400">
          <p>Are you sure you want to permanently delete this maintenance log record? This action is irreversible.</p>
          
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

export default MaintenanceList;
