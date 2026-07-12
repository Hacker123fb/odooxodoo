import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';
import { FiArrowLeft, FiEdit, FiInfo, FiTruck, FiAlertTriangle } from 'react-icons/fi';

/**
 * Page displaying detailed profile info for a single vehicle rig
 */
export const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER';

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await vehicleService.getById(id);
        if (res.success) {
          setVehicle(res.data);
        }
      } catch (err) {
        showToast(err.message || 'Failed to fetch details.', 'error');
        navigate('/vehicles');
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

  if (!vehicle) return null;

  // Status Badge styles mapping
  let badgeStyle = 'bg-slate-50 text-slate-600 dark:bg-slate-950/20 dark:text-slate-450';
  if (vehicle.ui_status === 'Available') badgeStyle = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
  else if (vehicle.ui_status === 'On Trip') badgeStyle = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
  else if (vehicle.ui_status === 'In Shop') badgeStyle = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
  else if (vehicle.ui_status === 'Retired') badgeStyle = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/vehicles')}
          className="flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
            className="flex items-center gap-2"
          >
            <FiEdit className="w-4 h-4" /> Edit Profile
          </Button>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        
        {/* Card Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary-50 dark:bg-primary-950/30 text-primary-650 dark:text-primary-400 rounded-2xl">
              <FiTruck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {vehicle.make_name} {vehicle.model_name}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Plate: <span className="font-semibold tracking-wider text-slate-600 dark:text-slate-350">{vehicle.registration_number}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStyle}`}>
              {vehicle.ui_status}
            </span>
            {vehicle.ui_status === 'On Trip' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                <FiAlertTriangle className="w-3.5 h-3.5" /> Awaiting trip completion
              </span>
            )}
          </div>
        </div>

        {/* Detailed Parameter Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Vehicle Type
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {vehicle.type_name}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Maximum Payload Capacity
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {vehicle.capacity.toLocaleString()} kg
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Current Mileage / Odometer
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {vehicle.current_odometer.toLocaleString()} km
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Acquisition Value
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              ${parseFloat(vehicle.purchase_price).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Fuel Engine Group
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {vehicle.fuel_label}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Year of Manufacture
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {vehicle.year}
            </span>
          </div>

        </div>

        {/* Audit Footer Metadata */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-550">
          <FiInfo className="w-3.5 h-3.5 shrink-0" />
          <span>
            Created by {vehicle.creator_name || 'System'} on {new Date(vehicle.created_at).toLocaleDateString()}.
            Last modified on {new Date(vehicle.updated_at).toLocaleString()}.
          </span>
        </div>

      </div>

    </div>
  );
};

export default VehicleDetails;
