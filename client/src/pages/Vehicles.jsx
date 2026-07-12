import React, { useState } from 'react';
import Table from '../components/common/Table.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { FiPlus, FiSearch, FiTruck } from 'react-icons/fi';

/**
 * Vehicles Inventory Page
 */
export const Vehicles = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Vehicle ID', accessor: 'code' },
    { header: 'License Plate', accessor: 'plate' },
    { header: 'Classification', accessor: 'type' },
    { header: 'Load Capacity', accessor: 'capacity' },
    {
      header: 'Duty Status',
      cell: (row) => {
        const isAvail = row.status === 'Available';
        const colorClass = isAvail
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

  const mockVehicles = [
    { id: 1, code: 'VEH-001', plate: 'CA-102-XY', type: 'Heavy Duty Semi', capacity: '15,000 kg', status: 'Available' },
    { id: 2, code: 'VEH-002', plate: 'TX-904-AB', type: 'Box Delivery Truck', capacity: '4,500 kg', status: 'On Trip' },
    { id: 3, code: 'VEH-003', plate: 'NY-448-CD', type: 'Refrigerated Carrier', capacity: '12,000 kg', status: 'Available' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Fleet Vehicles
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Monitor load capacities and real-time transit status
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>

      {/* Search filters panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search vehicle plate or status..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2 pl-9 pr-4 rounded-lg outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Table view */}
      <Table columns={columns} data={mockVehicles} />

      {/* Registration popup */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Fleet Vehicle"
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            This modal will hold fields for registration details like license plates, fuel categories, and model details.
          </p>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            * Note: Frontend placeholder setup. Form actions are disabled in this foundation.
          </p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm Register
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Vehicles;
