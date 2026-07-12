import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService, vehicleService, driverService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { FiSearch, FiPlus, FiEye, FiEdit, FiMapPin, FiCalendar, FiXCircle } from 'react-icons/fi';

/**
 * Lists all trips with options to filter, search, cancel, and edit
 */
export const TripList = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [statusVal, setStatusVal] = useState('');
  const [vehicleVal, setVehicleVal] = useState('');
  const [driverVal, setDriverVal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Cancel Modal states
  const [cancelTripId, setCancelTripId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Role permissions: SUPER_ADMIN, FLEET_MANAGER, and DISPATCHER can modify
  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER' || user?.role === 'DISPATCHER';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await tripService.getAll({
        search: searchVal,
        status: statusVal,
        vehicleId: vehicleVal,
        driverId: driverVal,
        startDate,
        endDate
      });
      if (res.success) {
        setTrips(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve trips list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, statusVal, vehicleVal, driverVal, startDate, endDate]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const resVehicles = await vehicleService.getAll();
        const resDrivers = await driverService.getAll();
        if (resVehicles.success) setVehicles(resVehicles.data || []);
        if (resDrivers.success) setDrivers(resDrivers.data || []);
      } catch (err) {
        console.warn('Failed to load filter parameters:', err.message);
      }
    };
    fetchDropdowns();
  }, []);

  const handleCancelTrip = async () => {
    if (!cancelTripId) return;
    setIsCancelling(true);
    try {
      const tripRes = await tripService.getById(cancelTripId);
      if (tripRes.success) {
        const updatedPayload = {
          ...tripRes.data,
          status: 'CANCELLED',
          cancellation_reason: cancellationReason || 'Cancelled by dispatcher.'
        };
        const res = await tripService.update(cancelTripId, updatedPayload);
        if (res.success) {
          showToast('Trip cancelled successfully.', 'success');
          setCancelTripId(null);
          setCancellationReason('');
          loadData();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel trip.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const columns = [
    { header: 'Trip Number', accessor: 'trip_number', cell: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.trip_number}</span> },
    {
      header: 'Route Details',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-250">
            <FiMapPin className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold">{row.source_location}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <FiMapPin className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="text-xs font-semibold">{row.destination_location}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Vehicle',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.vehicle_plate}</span>
          <span className="text-[10px] text-slate-400 block">{row.vehicle_make} {row.vehicle_model}</span>
        </div>
      )
    },
    {
      header: 'Assigned Driver',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.driver_name}</span>
          <span className="text-[10px] text-slate-400 block">Code: {row.driver_code}</span>
        </div>
      )
    },
    {
      header: 'Scheduled Departure',
      cell: (row) => (
        <div className="text-xs flex flex-col">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {new Date(row.scheduled_departure).toLocaleDateString()}
          </span>
          <span className="text-[10px] text-slate-450">
            {new Date(row.scheduled_departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    { header: 'Distance', accessor: 'distance_km', cell: (row) => `${parseFloat(row.distance_km).toLocaleString()} km` },
    {
      header: 'Status',
      cell: (row) => {
        let style = 'bg-slate-50 text-slate-650 dark:bg-slate-950/20';
        if (row.status === 'SCHEDULED') style = 'bg-blue-50 text-blue-605 dark:bg-blue-950/20 dark:text-blue-400';
        else if (row.status === 'IN_PROGRESS') style = 'bg-amber-50 text-amber-605 dark:bg-amber-950/20 dark:text-amber-400';
        else if (row.status === 'COMPLETED') style = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
        else if (row.status === 'CANCELLED') style = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';
        else if (row.status === 'DELAYED') style = 'bg-purple-50 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400';

        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${style}`}>
            {row.status.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/trips/${row.id}`)}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-605 dark:text-slate-300 transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          
          {canModify && (
            <>
              {row.status !== 'COMPLETED' && row.status !== 'CANCELLED' && (
                <>
                  <button
                    onClick={() => navigate(`/trips/edit/${row.id}`)}
                    className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                    title="Edit Trip"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setCancelTripId(row.id)}
                    className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-650 dark:text-rose-400 transition-colors"
                    title="Cancel Trip"
                  >
                    <FiXCircle className="w-4 h-4" />
                  </button>
                </>
              )}
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
            Operations Dispatches
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-550">
            Schedule route operations, assign vehicles/drivers, monitor progress and check logs
          </p>
        </div>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate('/trips/new')}
            className="flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Schedule Trip
          </Button>
        )}
      </div>

      {/* Filter Matrix panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search trip number, driver, vehicle plate, or locations..."
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
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-855 dark:text-slate-250 text-sm py-2 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Filter by Vehicle */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Assigned Vehicle
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

          {/* Filter by Driver */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Assigned Driver
            </label>
            <select
              value={driverVal}
              onChange={(e) => setDriverVal(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-250 text-xs py-1.5 px-3 rounded-lg outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>

          {/* Filter Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Departure Start
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
              Departure End
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

      {/* Trips list grid */}
      <Table
        columns={columns}
        data={trips}
        isLoading={isLoading}
        emptyMessage="No operations dispatches matching search criteria."
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelTripId !== null}
        onClose={() => setCancelTripId(null)}
        title="Cancel Trip Operations"
      >
        <div className="space-y-4 text-sm text-slate-650 dark:text-slate-400">
          <p>Are you sure you want to cancel this scheduled transport operation? This will release the vehicle and driver back to Available status.</p>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">
              Reason for Cancellation *
            </label>
            <textarea
              rows="3"
              required
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Provide cancellation details..."
              className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-rose-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setCancelTripId(null)}
              disabled={isCancelling}
            >
              Close
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelTrip}
              isLoading={isCancelling}
              disabled={!cancellationReason.trim()}
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default TripList;
