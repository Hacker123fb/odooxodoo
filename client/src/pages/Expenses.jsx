import React, { useState } from 'react';
import Table from '../components/common/Table.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { FiPlus, FiSearch } from 'react-icons/fi';

/**
 * Operational Expenses Audits Page
 */
export const Expenses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Expense ID', accessor: 'code' },
    { header: 'Trip Code', accessor: 'trip' },
    { header: 'Category', accessor: 'category' },
    { header: 'Cost Charge', accessor: 'amount' },
    { header: 'Billing Date', accessor: 'date' },
    { header: 'Description', accessor: 'description' }
  ];

  const mockExpenses = [
    { id: 1, code: 'EXP-401', trip: 'TRP-1092', category: 'Highway Tolls', amount: '$45.00', date: '2026-07-09', description: 'Tolls for Interstate route' },
    { id: 2, code: 'EXP-402', trip: 'TRP-1091', category: 'Driver Meals', amount: '$110.00', date: '2026-07-11', description: 'Driver allowance reimbursement' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Fleet Expenses
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Log auxiliary logistics fees, road tolls, and operator allowances
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" /> Log Expense
        </Button>
      </div>

      {/* Filters bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search expense category or trip ID..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Table view */}
      <Table columns={columns} data={mockExpenses} />

      {/* Expense Logging Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Logistics Expense"
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            This modal will support selecting active trips, defining expense categories, inserting decimal costs, and attaching receipts.
          </p>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            * Note: Frontend placeholder setup. Form actions are disabled in this foundation.
          </p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm Expense
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Expenses;
