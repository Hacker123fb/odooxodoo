import React, { useState } from 'react';
import Table from '../components/common/Table.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { FiPlus, FiSearch } from 'react-icons/fi';

/**
 * Fleet Maintenance Management Page
 */
export const Maintenance = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Ticket Code', accessor: 'code' },
    { header: 'Vehicle', accessor: 'vehicle' },
    { header: 'Service Type', accessor: 'type' },
    { header: 'Schedule Date', accessor: 'date' },
    { header: 'Service Cost', accessor: 'cost' },
    {
      header: 'Ticket Status',
      cell: (row) => {
        const isResolved = row.status === 'Resolved';
        const colorClass = isResolved
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

  const mockTickets = [
    { id: 1, code: 'MNT-190', vehicle: 'VEH-003', type: 'Oil Change & Brake Test', date: '2026-07-02', cost: '$250.00', status: 'Resolved' },
    { id: 2, code: 'MNT-191', vehicle: 'VEH-001', type: 'Alternator Replacement', date: '2026-07-10', cost: '$820.00', status: 'Scheduled' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Maintenance Logs
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Log preventative checks, repair tickets, and maintenance costs
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" /> Schedule Service
        </Button>
      </div>

      {/* Filter panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search service logs or ticket ID..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Table grid */}
      <Table columns={columns} data={mockTickets} />

      {/* Booking popup */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Preventive Service"
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            This modal will hold forms mapping repair details, target vehicle, scheduled dates, and estimated cost bounds.
          </p>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            * Note: Frontend placeholder setup. Form actions are disabled in this foundation.
          </p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Book Service
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Maintenance;
