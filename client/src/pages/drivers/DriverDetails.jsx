import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { driverService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';
import { FiArrowLeft, FiEdit, FiInfo, FiUser, FiAward, FiAlertTriangle, FiPhone, FiMail } from 'react-icons/fi';

/**
 * Detailed profile overview screen for a single driver
 */
export const DriverDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [driver, setDriver] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const canModify = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEET_MANAGER';

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await driverService.getById(id);
        if (res.success) {
          setDriver(res.data);
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve driver profile.', 'error');
        navigate('/drivers');
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

  if (!driver) return null;

  // Status Badge styles mapping
  let badgeStyle = 'bg-slate-50 text-slate-650 dark:bg-slate-950/20 dark:text-slate-450';
  if (driver.ui_status === 'Available') badgeStyle = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450';
  else if (driver.ui_status === 'On Trip') badgeStyle = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450';
  else if (driver.ui_status === 'Off Duty') badgeStyle = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350';
  else if (driver.ui_status === 'Suspended') badgeStyle = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455';

  const isLicenseExpired = new Date(driver.license_expiry) < new Date();
  const isSuspended = driver.ui_status === 'Suspended';

  // Safety Score details mapping
  let scoreColor = 'text-slate-600 dark:text-slate-305';
  if (driver.safety_score >= 90) scoreColor = 'text-emerald-500 font-semibold';
  else if (driver.safety_score >= 75) scoreColor = 'text-blue-500 font-semibold';
  else if (driver.safety_score >= 60) scoreColor = 'text-amber-500 font-semibold';
  else if (driver.safety_score < 60) scoreColor = 'text-rose-550 font-bold';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/drivers')}
          className="flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        {canModify && (
          <Button
            variant="primary"
            onClick={() => navigate(`/drivers/edit/${driver.id}`)}
            className="flex items-center gap-2"
          >
            <FiEdit className="w-4 h-4" /> Edit Profile
          </Button>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Card Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary-50 dark:bg-primary-950/30 text-primary-650 dark:text-primary-400 rounded-2xl">
              <FiUser className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {driver.full_name}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Employee ID: <span className="font-semibold text-slate-600 dark:text-slate-350">{driver.employee_id}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStyle}`}>
              {driver.ui_status}
            </span>
          </div>
        </div>

        {/* Action / Warning Alerts */}
        {(isLicenseExpired || isSuspended) && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-rose-650 dark:text-rose-400 text-xs rounded-xl flex gap-2 items-start">
            <FiAlertTriangle className="w-5 h-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">Trip Assignment Block Active</p>
              <ul className="list-disc pl-4 space-y-0.5 font-medium">
                {isLicenseExpired && <li>The driver's license is expired. Please update records with a valid expiry date.</li>}
                {isSuspended && <li>This operator's profile status is Suspended.</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Detailed Parameter Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FiPhone className="w-3.5 h-3.5" /> Phone Number
            </span>
            <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">
              {driver.phone}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FiMail className="w-3.5 h-3.5" /> Email Address
            </span>
            <span className="text-sm font-semibold text-slate-850 dark:text-slate-200 break-all">
              {driver.email || 'Not Provided'}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FiAward className="w-3.5 h-3.5" /> Safety performance score
            </span>
            <span className={`text-sm font-semibold ${scoreColor}`}>
              {driver.safety_score !== undefined && driver.safety_score !== null ? `${driver.safety_score} / 100` : 'N/A'}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              License Category
            </span>
            <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">
              {driver.license_class}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              License Number
            </span>
            <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">
              {driver.license_number}
            </span>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              License Expiration
            </span>
            <span className={`text-sm font-semibold ${isLicenseExpired ? 'text-rose-500' : 'text-slate-850 dark:text-slate-200'}`}>
              {new Date(driver.license_expiry).toLocaleDateString()} {isLicenseExpired && '(Expired)'}
            </span>
          </div>

        </div>

        {/* General Remarks */}
        <div className="p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Operator Remarks / Notes
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 italic">
            {driver.user_notes ? `"${driver.user_notes}"` : 'No professional logs or remarks filed for this driver.'}
          </p>
        </div>

        {/* Audit Metadata */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-550">
          <FiInfo className="w-3.5 h-3.5 shrink-0" />
          <span>
            Created by {driver.creator_name || 'System'} on {new Date(driver.created_at).toLocaleDateString()}.
            Last modified on {new Date(driver.updated_at).toLocaleString()}.
          </span>
        </div>

      </div>

    </div>
  );
};

export default DriverDetails;
