import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';
import { FiArrowLeft, FiEdit, FiInfo, FiMapPin, FiCalendar, FiUser, FiTruck, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

/**
 * Detailed profile overview screen for a single operations trip
 */
export const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Role permissions checks
  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER' || user?.role === 'DISPATCHER';

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await tripService.getById(id);
        if (res.success) {
          setTrip(res.data);
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve trip details.', 'error');
        navigate('/trips');
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

  if (!trip) return null;

  // Status Badge styles mapping
  let badgeStyle = 'bg-slate-50 text-slate-655 dark:bg-slate-950/20 dark:text-slate-450';
  if (trip.status === 'SCHEDULED') badgeStyle = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
  else if (trip.status === 'IN_PROGRESS') badgeStyle = 'bg-amber-50 text-amber-605 dark:bg-amber-950/20 dark:text-amber-400';
  else if (trip.status === 'COMPLETED') badgeStyle = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-455';
  else if (trip.status === 'CANCELLED') badgeStyle = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';
  else if (trip.status === 'DELAYED') badgeStyle = 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400';

  const isEnded = trip.status === 'COMPLETED' || trip.status === 'CANCELLED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/trips')}
          className="flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        {canModify && !isEnded && (
          <Button
            variant="primary"
            onClick={() => navigate(`/trips/edit/${trip.id}`)}
            className="flex items-center gap-2"
          >
            <FiEdit className="w-4 h-4" /> Edit Details
          </Button>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Card Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
              Trip Number: {trip.trip_number}
            </h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-405 mt-2 font-semibold">
              <span className="flex items-center gap-0.5"><FiMapPin className="text-emerald-500" /> {trip.source_location}</span>
              <span>➔</span>
              <span className="flex items-center gap-0.5"><FiMapPin className="text-rose-500" /> {trip.destination_location}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeStyle}`}>
              {trip.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Cancellation Reason alert block */}
        {trip.status === 'CANCELLED' && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-105 dark:border-rose-900/50 text-rose-650 dark:text-rose-400 text-xs rounded-xl flex gap-2 items-start">
            <FiAlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Trip Operations Cancelled</p>
              <p className="mt-0.5 font-medium">{trip.cancellation_reason || 'No cancellation remarks recorded.'}</p>
            </div>
          </div>
        )}

        {/* Dynamic dispatch time cards block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dispatch schedule */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-3.5">
            <h4 className="text-xs font-bold text-slate-405 uppercase tracking-wider flex items-center gap-1.5">
              <FiCalendar className="w-4 h-4 text-primary-500" /> Schedule Parameters
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Scheduled Departure</span>
                <span className="font-semibold text-slate-750 dark:text-slate-205">{new Date(trip.scheduled_departure).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Expected Arrival</span>
                <span className="font-semibold text-slate-750 dark:text-slate-205">{new Date(trip.scheduled_arrival).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actual Logs */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-3.5">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <FiCheckCircle className="w-4 h-4 text-emerald-500" /> Actual Operations Logs
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Actual Departure</span>
                <span className="font-semibold text-slate-750 dark:text-slate-205">{trip.actual_departure ? new Date(trip.actual_departure).toLocaleString() : 'Pending Start'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Actual Arrival</span>
                <span className="font-semibold text-slate-750 dark:text-slate-205">{trip.actual_arrival ? new Date(trip.actual_arrival).toLocaleString() : 'In Transit / Pending'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Assigned resources matrices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Vehicle card */}
          <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <FiTruck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Vehicle</span>
              <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200 leading-tight">
                {trip.vehicle_plate}
              </h4>
              <p className="text-xs text-slate-450">
                {trip.vehicle_make} {trip.vehicle_model}
              </p>
            </div>
          </div>

          {/* Driver card */}
          <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <FiUser className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Driver</span>
              <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200 leading-tight">
                {trip.driver_name}
              </h4>
              <p className="text-xs text-slate-450">
                Employee Code: {trip.driver_code}
              </p>
            </div>
          </div>

        </div>

        {/* Cargo parameters matrix details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Planned Distance
            </span>
            <span className="text-sm font-semibold text-slate-805 dark:text-slate-200">
              {parseFloat(trip.distance_km).toLocaleString()} km
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Est. Fuel Consumption
            </span>
            <span className="text-sm font-semibold text-slate-805 dark:text-slate-200">
              {trip.estimated_fuel ? `${parseFloat(trip.estimated_fuel).toLocaleString()} L` : 'Not Specified'}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cargo / Passenger Load
            </span>
            <span className="text-sm font-semibold text-slate-855 dark:text-slate-200 truncate" title={trip.cargo_passenger_desc}>
              {trip.cargo_passenger_desc || 'General transport route'}
            </span>
          </div>

        </div>

        {/* Remarks logs */}
        <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Operational Remarks
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 italic">
            {trip.user_remarks ? `"${trip.user_remarks}"` : 'No custom remarks recorded for this dispatch.'}
          </p>
        </div>

        {/* Audit Metadata */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-550">
          <FiInfo className="w-3.5 h-3.5 shrink-0" />
          <span>
            Scheduled by {trip.creator_name || 'System'} on {new Date(trip.created_at).toLocaleDateString()}.
            Last modified on {new Date(trip.updated_at).toLocaleString()}.
          </span>
        </div>

      </div>

    </div>
  );
};

export default TripDetails;
