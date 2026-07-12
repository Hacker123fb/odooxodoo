import React, { useState } from 'react';
import Table from '../components/common/Table.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { FiPlus, FiSearch } from 'react-icons/fi';

/**
 * Drivers Roster Page
 */
export const Drivers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Operator Name', accessor: 'name' },
    { header: 'License ID', accessor: 'license' },
    { header: 'Expiry Date', accessor: 'expiry' },
    { header: 'Safety Rating', accessor: 'score' },
    {
      header: 'Duty Status',
      cell: (row) => {
        const isDuty = row.status === 'On Duty';
        const colorClass = isDuty
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450';
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
            {row.status}
          </span>
        );
      }
    }
  ];

  const mockDrivers = [
    { id: 1, name: 'Arthur Dent', license: 'DL-908-112', expiry: '2028-11-20', score: '98 / 100', status: 'On Duty' },
    { id: 2, name: 'Sarah Connor', license: 'DL-448-901', expiry: '2027-05-15', score: '94 / 100', status: 'Off Duty' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Operations Drivers
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Audit driver safety records and track duty shifts
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" /> Add Driver
        </Button>
      </div>

      {/* Filter panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search driver by name or license..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Table view */}
      <Table columns={columns} data={mockDrivers} />

      {/* Driver Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Operator Profile"
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            This modal will support driver profile entries like names, license types, expirations, and initial status toggles.
          </p>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            * Note: Frontend placeholder setup. Form actions are disabled in this foundation.
          </p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Register Driver
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Drivers;
