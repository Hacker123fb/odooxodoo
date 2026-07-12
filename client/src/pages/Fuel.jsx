import React, { useState } from 'react';
import Table from '../components/common/Table.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { FiPlus, FiSearch } from 'react-icons/fi';

/**
 * Fuel Log Audits Page
 */
export const Fuel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Log Code', accessor: 'code' },
    { header: 'Vehicle', accessor: 'vehicle' },
    { header: 'Fuel Quantity', accessor: 'quantity' },
    { header: 'Invoice Cost', accessor: 'cost' },
    { header: 'Odometer (km)', accessor: 'odometer' },
    { header: 'Receipt Date', accessor: 'date' }
  ];

  const mockLogs = [
    { id: 1, code: 'FUL-801', vehicle: 'VEH-001', quantity: '140 Liters', cost: '$210.00', odometer: '105,430 km', date: '2026-07-09' },
    { id: 2, code: 'FUL-802', vehicle: 'VEH-002', quantity: '45 Liters', cost: '$75.00', odometer: '49,200 km', date: '2026-07-11' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Fuel Refueling Logs
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Log diesel fill-ups, odometer details, and cost metrics
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" /> Log Refuel
        </Button>
      </div>

      {/* Filter panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search refuel log code or vehicle..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Table grid */}
      <Table columns={columns} data={mockLogs} />

      {/* Logging popup */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Fuel Receipt Record"
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            This modal will present input fields to record target vehicles, quantity in liters, unit costs, and current odometer mileage.
          </p>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            * Note: Frontend placeholder setup. Form actions are disabled in this foundation.
          </p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Submit Receipt
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Fuel;
