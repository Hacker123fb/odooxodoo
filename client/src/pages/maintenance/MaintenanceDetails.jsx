import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';
import { FiArrowLeft, FiEdit, FiInfo, FiCalendar, FiTruck, FiSettings, FiUser, FiDollarSign } from 'react-icons/fi';

export const MaintenanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Role permissions checks
  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER';

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await maintenanceService.getById(id);
        if (res.success) {
          setRecord(res.data);
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve maintenance details.', 'error');
        navigate('/maintenance');
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

  // Status Badge styles mapping
  let badgeStyle = 'bg-slate-50 text-slate-650 dark:bg-slate-950/20 dark:text-slate-450';
  if (record.status === 'Scheduled') badgeStyle = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
  else if (record.status === 'In Progress') badgeStyle = 'bg-amber-50 text-amber-605 dark:bg-amber-950/20 dark:text-amber-400';
  else if (record.status === 'Completed') badgeStyle = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-455';
  else if (record.status === 'Cancelled') badgeStyle = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/maintenance')}
          className="flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate(`/maintenance/edit/${record.id}`)}
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
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-primary-500 rounded-xl shrink-0">
              <FiSettings className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {record.maintenanceType}
              </h2>
              <p className="text-xs text-slate-400 mt-2 font-semibold flex items-center gap-1">
                <FiTruck className="text-slate-400 shrink-0" />
                <span>Vehicle:</span>
                <span className="text-slate-700 dark:text-slate-350">{record.vehicle_plate} ({record.vehicle_make} {record.vehicle_model})</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeStyle}`}>
              {record.status}
            </span>
          </div>
        </div>

        {/* Dynamic Log Time Cards Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Maintenance Date</span>
            <span className="font-semibold text-sm text-slate-750 dark:text-slate-205">{new Date(record.maintenanceDate).toLocaleDateString()}</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Estimated Completion</span>
            <span className="font-semibold text-sm text-slate-750 dark:text-slate-205">{record.estimatedCompletionDate ? new Date(record.estimatedCompletionDate).toLocaleDateString() : 'Not Specified'}</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Actual Completion</span>
            <span className="font-semibold text-sm text-slate-750 dark:text-slate-205">{record.actualCompletionDate ? new Date(record.actualCompletionDate).toLocaleDateString() : 'In Progress / Pending'}</span>
          </div>

        </div>

        {/* Assigned resources matrices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Service facility card */}
          <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <FiTruck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service Facility / Center</span>
              <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200 leading-tight">
                {record.serviceCenter || 'Internal Maintenance Hub'}
              </h4>
            </div>
          </div>

          {/* Technician card */}
          <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <FiUser className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Technician</span>
              <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200 leading-tight">
                {record.technicianName || 'Not Assigned'}
              </h4>
            </div>
          </div>

        </div>

        {/* Cost & Odometer Readings metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Maintenance Cost (₹)
            </span>
            <span className="text-sm font-semibold text-slate-805 dark:text-slate-200">
              ₹{parseFloat(record.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Odometer Reading
            </span>
            <span className="text-sm font-semibold text-slate-855 dark:text-slate-200">
              {parseInt(record.odometerReading || 0).toLocaleString()} km
            </span>
          </div>

        </div>

        {/* Remarks logs */}
        <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Remarks & Description
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed italic">
            {record.remarks ? `"${record.remarks}"` : 'No remarks recorded for this maintenance event.'}
          </p>
        </div>

        {/* Audit Metadata */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-550">
          <FiInfo className="w-3.5 h-3.5 shrink-0" />
          <span>
            Logged by {record.creator_name || 'System'} on {new Date(record.created_at).toLocaleDateString()}.
            Last modified on {new Date(record.updated_at).toLocaleString()}.
          </span>
        </div>

      </div>

    </div>
  );
};

export default MaintenanceDetails;
