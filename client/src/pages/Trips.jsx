import React, { useState } from 'react';
import Table from '../components/common/Table.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { FiPlus, FiSearch } from 'react-icons/fi';

/**
 * Trips Management Page
 */
export const Trips = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Trip Code', accessor: 'code' },
    { header: 'Assigned Rig', accessor: 'vehicle' },
    { header: 'Assigned Driver', accessor: 'driver' },
    { header: 'Route Path', accessor: 'route' },
    { header: 'Cargo Load', accessor: 'weight' },
    {
      header: 'Trip Status',
      cell: (row) => {
        let styleClass = 'bg-slate-50 text-slate-600 dark:bg-slate-950/20 dark:text-slate-450';
        if (row.status === 'Dispatched') {
          styleClass = 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
        } else if (row.status === 'Completed') {
          styleClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
        } else if (row.status === 'Cancelled') {
          styleClass = 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
        }
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styleClass}`}>
            {row.status}
          </span>
        );
      }
    }
  ];

  const mockTrips = [
    { id: 1, code: 'TRP-1092', vehicle: 'VEH-001', driver: 'Arthur Dent', route: 'Oakland, CA → Seattle, WA', weight: '11,400 kg', status: 'Dispatched' },
    { id: 2, code: 'TRP-1091', vehicle: 'VEH-002', driver: 'Sarah Connor', route: 'Los Angeles, CA → San Diego, CA', weight: '2,500 kg', status: 'Completed' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Trips Dispatch
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Dispatch routes, manage load weights, and audit delivery schedules
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" /> Dispatch Route
        </Button>
      </div>

      {/* Filter Options */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search trip ID, driver, route..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Table view */}
      <Table columns={columns} data={mockTrips} />

      {/* Dispatch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule & Dispatch Route"
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            This modal will support selecting a vehicle and driver, inputting origin/destination values, and verifying that cargo weight bounds are maintained.
          </p>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            * Note: Frontend placeholder setup. Form actions are disabled in this foundation.
          </p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Dispatch Trip
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Trips;
