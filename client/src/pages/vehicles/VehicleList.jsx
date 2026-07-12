import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { FiSearch, FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

/**
 * Page displaying the responsive list of fleet vehicles with search and filters
 */
export const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter settings
  const [searchVal, setSearchVal] = useState('');
  const [statusVal, setStatusVal] = useState('');
  const [typeVal, setTypeVal] = useState('');

  // Delete modal confirmation
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Check if role is authorized to modify database records
  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER';

  // Load vehicles and classification lists
  const loadData = async () => {
    setIsLoading(true);
    try {
      const resVehicles = await vehicleService.getAll({
        search: searchVal,
        status: statusVal,
        type: typeVal
      });
      if (resVehicles.success) {
        setVehicles(resVehicles.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch vehicles.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce/Trigger loads when search or filters update
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, statusVal, typeVal]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const resOptions = await vehicleService.getOptions();
        if (resOptions.success) {
          setTypes(resOptions.data.types || []);
        }
      } catch (err) {
        console.warn('Failed to load type selectors:', err.message);
      }
    };
    fetchMetadata();
  }, []);

  const handleDelete = async () => {
    if (!deleteVehicleId) return;
    setIsDeleting(true);
    try {
      const res = await vehicleService.delete(deleteVehicleId);
      if (res.success) {
        showToast('Vehicle deleted successfully.', 'success');
        setDeleteVehicleId(null);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete vehicle.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'registration_number' },
    {
      header: 'Model / Make',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.model_name}</span>
          <span className="text-xs text-slate-400 block">{row.make_name}</span>
        </div>
      )
    },
    { header: 'Type', accessor: 'type_name' },
    { header: 'Max Capacity', accessor: 'capacity', cell: (row) => `${row.capacity.toLocaleString()} kg` },
    { header: 'Odometer', accessor: 'current_odometer', cell: (row) => `${row.current_odometer.toLocaleString()} km` },
    { header: 'Acquisition Cost', accessor: 'purchase_price', cell: (row) => `$${parseFloat(row.purchase_price).toLocaleString()}` },
    {
      header: 'Status',
      cell: (row) => {
        let style = 'bg-slate-50 text-slate-650 dark:bg-slate-950/20';
        if (row.ui_status === 'Available') style = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
        else if (row.ui_status === 'On Trip') style = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
        else if (row.ui_status === 'In Shop') style = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
        else if (row.ui_status === 'Retired') style = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';

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
            onClick={() => navigate(`/vehicles/${row.id}`)}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          
          {canModify && (
            <>
              <button
                onClick={() => navigate(`/vehicles/edit/${row.id}`)}
                className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                title="Edit Vehicle"
              >
                <FiEdit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setDeleteVehicleId(row.id)}
                className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-650 dark:text-rose-400 transition-colors"
                title="Delete Vehicle"
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
            Fleet Inventory
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Audit transportation assets, capacity parameters, and duty statuses
          </p>
        </div>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate('/vehicles/new')}
            className="flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Filter and Search controls */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search plate or make/model name..."
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
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        {/* Filter by Vehicle Type */}
        <div className="w-full md:w-48">
          <select
            value={typeVal}
            onChange={(e) => setTypeVal(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-sm py-2 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Vehicles Grid Table */}
      <Table
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        emptyMessage="No vehicles found matching search criteria."
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteVehicleId !== null}
        onClose={() => setDeleteVehicleId(null)}
        title="Confirm Vehicle Deletion"
      >
        <div className="space-y-4 text-sm text-slate-650 dark:text-slate-400">
          <p>Are you sure you want to delete this vehicle from the fleet inventory? This action is permanent.</p>
          <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-2.5 rounded-lg">
            * Deleting will fail if the vehicle has active or scheduled trips assigned.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setDeleteVehicleId(null)}
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

export default VehicleList;
