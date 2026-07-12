import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { FiSearch, FiPlus, FiEye, FiEdit, FiTrash2, FiAward, FiAlertTriangle } from 'react-icons/fi';

/**
 * Page displaying the responsive list of operators / drivers
 */
export const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and status filters
  const [searchVal, setSearchVal] = useState('');
  const [statusVal, setStatusVal] = useState('');

  // Delete modal confirmation
  const [deleteDriverId, setDeleteDriverId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Check if role is authorized to perform CRUD writes
  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER';

  // Load driver data from backend
  const loadDrivers = async () => {
    setIsLoading(true);
    try {
      const res = await driverService.getAll({
        search: searchVal,
        status: statusVal
      });
      if (res.success) {
        setDrivers(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve drivers roster.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrivers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, statusVal]);

  const handleDelete = async () => {
    if (!deleteDriverId) return;
    setIsDeleting(true);
    try {
      const res = await driverService.delete(deleteDriverId);
      if (res.success) {
        showToast('Driver profile deleted successfully.', 'success');
        setDeleteDriverId(null);
        loadDrivers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete driver.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Operator Name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.full_name}</span>
          <span className="text-[10px] text-slate-450 block font-mono">Emp ID: {row.employee_id}</span>
        </div>
      )
    },
    { header: 'License Number', accessor: 'license_number' },
    { header: 'Category', accessor: 'license_class' },
    {
      header: 'Expiry Date',
      cell: (row) => {
        const isExpired = new Date(row.license_expiry) < new Date();
        return (
          <span className={`inline-flex items-center gap-1 text-xs ${isExpired ? 'text-rose-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
            {isExpired && <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />}
            {new Date(row.license_expiry).toLocaleDateString()}
          </span>
        );
      }
    },
    { header: 'Phone Number', accessor: 'phone' },
    {
      header: 'Safety Score',
      cell: (row) => {
        const score = row.safety_score;
        let color = 'text-slate-450';
        if (score >= 90) color = 'text-emerald-500 font-semibold';
        else if (score >= 75) color = 'text-blue-500 font-semibold';
        else if (score >= 60) color = 'text-amber-500 font-semibold';
        else if (score < 60) color = 'text-rose-500 font-bold';

        return (
          <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
            <FiAward className="w-3.5 h-3.5 shrink-0" />
            {score !== undefined && score !== null ? `${score}/100` : 'N/A'}
          </span>
        );
      }
    },
    {
      header: 'Status',
      cell: (row) => {
        let style = 'bg-slate-50 text-slate-600 dark:bg-slate-950/20';
        if (row.ui_status === 'Available') style = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
        else if (row.ui_status === 'On Trip') style = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
        else if (row.ui_status === 'Off Duty') style = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350';
        else if (row.ui_status === 'Suspended') style = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';

        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style}`}>
            {row.ui_status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/drivers/${row.id}`)}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
            title="View Profile"
          >
            <FiEye className="w-4 h-4" />
          </button>
          
          {canModify && (
            <>
              <button
                onClick={() => navigate(`/drivers/edit/${row.id}`)}
                className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                title="Edit Profile"
              >
                <FiEdit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setDeleteDriverId(row.id)}
                className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-650 dark:text-rose-400 transition-colors"
                title="Delete Profile"
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
            Driver Roster
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-550">
            Manage operator details, licenses, performance safety metrics, and status configurations
          </p>
        </div>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate('/drivers/new')}
            className="flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Add Driver
          </Button>
        )}
      </div>

      {/* Filter and Search controls */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search driver name, employee ID, or license number..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Filter by Status */}
        <div className="w-full sm:w-48">
          <select
            value={statusVal}
            onChange={(e) => setStatusVal(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-sm py-2 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

      </div>

      {/* Driver Grid Table */}
      <Table
        columns={columns}
        data={drivers}
        isLoading={isLoading}
        emptyMessage="No drivers found matching search criteria."
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteDriverId !== null}
        onClose={() => setDeleteDriverId(null)}
        title="Confirm Driver Deletion"
      >
        <div className="space-y-4 text-sm text-slate-650 dark:text-slate-400">
          <p>Are you sure you want to delete this driver profile from the roster? This action is permanent.</p>
          <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-2.5 rounded-lg">
            * Deleting will fail if the driver is associated with active or scheduled trips.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setDeleteDriverId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default DriverList;
