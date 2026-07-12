import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiNavigation, 
  FiDroplet, 
  FiActivity, 
  FiTool, 
  FiDollarSign,
  FiFilter,
  FiDownload,
  FiCalendar,
  FiInfo,
  FiBarChart2,
  FiTable
} from 'react-icons/fi';
import { 
  reportService, 
  vehicleService, 
  driverService, 
  fuelService 
} from '../api/apiService.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/common/Button.jsx';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Reports configurations
const REPORT_TYPES = [
  { id: 'vehicle-utilization', name: 'Vehicle Utilization', icon: FiActivity, desc: 'Tracks trip count, distance, cargo, and passenger loads per vehicle.' },
  { id: 'driver-performance', name: 'Driver Performance', icon: FiUsers, desc: 'Evaluates driver delivery volumes, distance, and completion rates.' },
  { id: 'trip-summary', name: 'Trip Summary', icon: FiNavigation, desc: 'Comprehensive log of dispatch details, durations, and routes.' },
  { id: 'fuel-consumption', name: 'Fuel Consumption', icon: FiDroplet, desc: 'Aggregates liters consumed and overall fueling costs.' },
  { id: 'fuel-efficiency', name: 'Fuel Efficiency', icon: FiTrendingUp, desc: 'Correlates distance vs fuel quantity (Km per Litre).' },
  { id: 'maintenance-cost', name: 'Maintenance Cost', icon: FiTool, desc: 'Summarizes maintenance logs, repair expenses, and types.' },
  { id: 'expense-summary', name: 'Expense Summary', icon: FiDollarSign, desc: 'Monitors operational expenses, payment statuses, and categories.' }
];

const TRIP_STATUSES = [
  { code: 'SCHEDULED', label: 'Scheduled' },
  { code: 'IN_PROGRESS', label: 'In Progress' },
  { code: 'COMPLETED', label: 'Completed' },
  { code: 'CANCELLED', label: 'Cancelled' },
  { code: 'DELAYED', label: 'Delayed' }
];

const EXPENSE_CATEGORIES = [
  { code: 'FUEL', label: 'Fuel' },
  { code: 'MAINTENANCE', label: 'Maintenance' },
  { code: 'TOLL', label: 'Tolls' },
  { code: 'INSURANCE', label: 'Insurance' },
  { code: 'REGISTRATION', label: 'Registration' },
  { code: 'SALARY', label: 'Salary' },
  { code: 'PENALTY', label: 'Penalty' },
  { code: 'OTHER', label: 'Other' }
];

export const Reports = () => {
  const { showToast } = useToast();

  const [activeReport, setActiveReport] = useState('vehicle-utilization');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Selectors Metadata
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);

  // Active Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('');

  // Fetch Metadata for drop downs
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [resVehicles, resDrivers, resFuelOptions] = await Promise.all([
          vehicleService.getAll(),
          driverService.getAll(),
          fuelService.getOptions()
        ]);
        if (resVehicles.success) setVehicles(resVehicles.data || []);
        if (resDrivers.success) setDrivers(resDrivers.data || []);
        if (resFuelOptions.success && resFuelOptions.data) {
          setFuelTypes(resFuelOptions.data.fuelTypes || []);
        }
      } catch (err) {
        console.warn('Metadata loading warning:', err.message);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Report Data callback
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: activeReport,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        vehicleId: selectedVehicle || undefined,
        driverId: selectedDriver || undefined,
        status: selectedStatus || undefined,
        category: selectedCategory || undefined,
        fuelTypeId: selectedFuelType || undefined
      };
      
      const res = await reportService.getReport(params);
      if (res.success) {
        setData(res.data || []);
      } else {
        showToast(res.message || 'Failed to load report data.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'An error occurred fetching the report.', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    activeReport, 
    startDate, 
    endDate, 
    selectedVehicle, 
    selectedDriver, 
    selectedStatus, 
    selectedCategory, 
    selectedFuelType, 
    showToast
  ]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedVehicle('');
    setSelectedDriver('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedFuelType('');
  };

  // ----------------------------------------------------
  // Dynamic summary calculations
  // ----------------------------------------------------
  const getSummaryMetrics = () => {
    if (!data || data.length === 0) return [];
    
    switch (activeReport) {
      case 'vehicle-utilization': {
        const totalTrips = data.reduce((acc, curr) => acc + Number(curr.totalTrips), 0);
        const totalDistance = data.reduce((acc, curr) => acc + Number(curr.totalDistanceKm), 0);
        const avgDistance = (totalDistance / (data.length || 1)).toFixed(1);
        return [
          { label: 'Utilized Vehicles', value: data.length },
          { label: 'Completed Trips', value: totalTrips },
          { label: 'Total Distance', value: `${totalDistance.toLocaleString()} Km` },
          { label: 'Avg Distance / Rig', value: `${avgDistance} Km` }
        ];
      }
      case 'driver-performance': {
        const completedTrips = data.reduce((acc, curr) => acc + Number(curr.completedTrips), 0);
        const totalDistance = data.reduce((acc, curr) => acc + Number(curr.totalDistanceKm), 0);
        return [
          { label: 'Drivers Tracked', value: data.length },
          { label: 'Completed Trips', value: completedTrips },
          { label: 'Total Distance Driven', value: `${totalDistance.toLocaleString()} Km` }
        ];
      }
      case 'trip-summary': {
        const completed = data.filter(t => t.status === 'COMPLETED').length;
        const cancelled = data.filter(t => t.status === 'CANCELLED').length;
        return [
          { label: 'Total Trips Logged', value: data.length },
          { label: 'Trips Completed', value: completed },
          { label: 'Trips Cancelled', value: cancelled }
        ];
      }
      case 'fuel-consumption': {
        const totalLitres = data.reduce((acc, curr) => acc + Number(curr.totalQuantity), 0);
        const totalCost = data.reduce((acc, curr) => acc + Number(curr.totalCost), 0);
        return [
          { label: 'Refuel Events', value: data.reduce((a, b) => a + Number(b.fuelingCount), 0) },
          { label: 'Total Fuel Consumed', value: `${totalLitres.toLocaleString()} L` },
          { label: 'Total Fuel Cost', value: `₹${totalCost.toLocaleString()}` }
        ];
      }
      case 'fuel-efficiency': {
        const activeEff = data.filter(item => Number(item.totalFuelLitres) > 0);
        const totalDist = activeEff.reduce((acc, curr) => acc + Number(curr.totalDistanceKm), 0);
        const totalFuel = activeEff.reduce((acc, curr) => acc + Number(curr.totalFuelLitres), 0);
        const avgEfficiency = totalFuel > 0 ? (totalDist / totalFuel).toFixed(2) : '0';
        return [
          { label: 'Evaluated Vehicles', value: data.length },
          { label: 'Fleet Average Efficiency', value: `${avgEfficiency} Km/L` }
        ];
      }
      case 'maintenance-cost': {
        const totalJobs = data.reduce((acc, curr) => acc + Number(curr.totalJobs), 0);
        const totalCost = data.reduce((acc, curr) => acc + Number(curr.totalCost), 0);
        return [
          { label: 'Vehicles Repaired', value: data.length },
          { label: 'Completed Jobs', value: totalJobs },
          { label: 'Aggregate Repair Cost', value: `₹${totalCost.toLocaleString()}` }
        ];
      }
      case 'expense-summary': {
        const totalExpenses = data.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
        const paidAmount = data.reduce((acc, curr) => acc + Number(curr.paidAmount), 0);
        const pendingAmount = data.reduce((acc, curr) => acc + Number(curr.pendingAmount), 0);
        return [
          { label: 'Expense Categories', value: data.length },
          { label: 'Total Logged Expenses', value: `₹${totalExpenses.toLocaleString()}` },
          { label: 'Paid Amount', value: `₹${paidAmount.toLocaleString()}` },
          { label: 'Pending Settlement', value: `₹${pendingAmount.toLocaleString()}` }
        ];
      }
      default:
        return [];
    }
  };

  // ----------------------------------------------------
  // Dynamic Chart Rendering
  // ----------------------------------------------------
  const renderChart = () => {
    if (!data || data.length === 0) return null;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';

    switch (activeReport) {
      case 'vehicle-utilization': {
        const topVehicles = data.slice(0, 7);
        const chartData = {
          labels: topVehicles.map(v => v.vehiclePlate),
          datasets: [{
            label: 'Distance (Km)',
            data: topVehicles.map(v => v.totalDistanceKm),
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 4
          }]
        };
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } }
          }
        };
        return <Bar data={chartData} options={options} />;
      }

      case 'driver-performance': {
        const topDrivers = data.slice(0, 7);
        const chartData = {
          labels: topDrivers.map(d => d.driverName),
          datasets: [{
            label: 'Completed Trips',
            data: topDrivers.map(d => d.completedTrips),
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 4
          }]
        };
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } }
          }
        };
        return <Bar data={chartData} options={options} />;
      }

      case 'trip-summary': {
        const statuses = {};
        data.forEach(t => {
          statuses[t.status] = (statuses[t.status] || 0) + 1;
        });
        const chartData = {
          labels: Object.keys(statuses),
          datasets: [{
            data: Object.values(statuses),
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1'],
            borderWidth: 1,
            borderColor: isDark ? '#0f172a' : '#ffffff'
          }]
        };
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: textColor, font: { size: 9 } } }
          }
        };
        return <Doughnut data={chartData} options={options} />;
      }

      case 'fuel-consumption': {
        const topCost = data.slice(0, 7);
        const chartData = {
          labels: topCost.map(f => f.vehiclePlate),
          datasets: [{
            label: 'Fuel Cost (INR)',
            data: topCost.map(f => f.totalCost),
            backgroundColor: 'rgba(245, 158, 11, 0.75)',
            borderColor: '#f59e0b',
            borderWidth: 1,
            borderRadius: 4
          }]
        };
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } }
          }
        };
        return <Bar data={chartData} options={options} />;
      }

      case 'fuel-efficiency': {
        const activeEff = data.filter(item => item.kmPerLitre > 0).slice(0, 7);
        const chartData = {
          labels: activeEff.map(e => e.vehiclePlate),
          datasets: [{
            label: 'Efficiency (Km/L)',
            data: activeEff.map(e => e.kmPerLitre),
            backgroundColor: 'rgba(99, 102, 241, 0.75)',
            borderColor: '#6366f1',
            borderWidth: 1,
            borderRadius: 4
          }]
        };
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } }
          }
        };
        return <Bar data={chartData} options={options} />;
      }

      case 'maintenance-cost': {
        const topMaint = data.slice(0, 7);
        const chartData = {
          labels: topMaint.map(m => m.vehiclePlate),
          datasets: [{
            label: 'Maintenance Cost (INR)',
            data: topMaint.map(m => m.totalCost),
            backgroundColor: 'rgba(217, 119, 6, 0.75)',
            borderColor: '#d97706',
            borderWidth: 1,
            borderRadius: 4
          }]
        };
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 9 } } }
          }
        };
        return <Bar data={chartData} options={options} />;
      }

      case 'expense-summary': {
        const chartData = {
          labels: data.map(e => e.category),
          datasets: [{
            data: data.map(e => e.totalAmount),
            backgroundColor: ['#f59e0b', '#d97706', '#64748b', '#06b6d4', '#8b5cf6', '#10b981', '#ef4444', '#6366f1'],
            borderWidth: 1,
            borderColor: isDark ? '#0f172a' : '#ffffff'
          }]
        };
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: textColor, font: { size: 9 } } }
          }
        };
        return <Doughnut data={chartData} options={options} />;
      }

      default:
        return null;
    }
  };

  // ----------------------------------------------------
  // Columns definition for Tables
  // ----------------------------------------------------
  const getTableColumns = () => {
    switch (activeReport) {
      case 'vehicle-utilization':
        return [
          { header: 'Vehicle Plate', accessor: 'vehiclePlate' },
          { header: 'Vehicle Model', accessor: 'modelName' },
          { header: 'Status', accessor: 'status', cell: (row) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-slate-50 text-slate-500'}`}>{row.status}</span> },
          { header: 'Completed Trips', accessor: 'totalTrips', cell: (row) => Number(row.totalTrips).toLocaleString() },
          { header: 'Distance Traveled', accessor: 'totalDistanceKm', cell: (row) => `${Number(row.totalDistanceKm).toLocaleString()} Km` },
          { header: 'Cargo Handled', accessor: 'totalCargoWeightKg', cell: (row) => `${Number(row.totalCargoWeightKg).toLocaleString()} Kg` },
          { header: 'Passengers Handled', accessor: 'totalPassengerCount', cell: (row) => Number(row.totalPassengerCount).toLocaleString() }
        ];

      case 'driver-performance':
        return [
          { header: 'Employee ID', accessor: 'employeeId' },
          { header: 'Driver Name', accessor: 'driverName' },
          { header: 'Roster Status', accessor: 'status', cell: (row) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-blue-50 text-blue-600'}`}>{row.status}</span> },
          { header: 'Completed Trips', accessor: 'completedTrips' },
          { header: 'Cancelled Trips', accessor: 'cancelledTrips' },
          { header: 'Distance Driven', accessor: 'totalDistanceKm', cell: (row) => `${Number(row.totalDistanceKm).toLocaleString()} Km` },
          { header: 'Avg Cargo Load', accessor: 'avgCargoWeightKg', cell: (row) => `${Math.round(Number(row.avgCargoWeightKg)).toLocaleString()} Kg` },
          { header: 'Avg Passenger Load', accessor: 'avgPassengerCount', cell: (row) => Math.round(Number(row.avgPassengerCount)) }
        ];

      case 'trip-summary':
        return [
          { header: 'Trip #', accessor: 'tripNumber' },
          { header: 'Vehicle Rig', accessor: 'vehiclePlate' },
          { header: 'Driver', accessor: 'driverName' },
          { header: 'Route', cell: (row) => `${row.sourceLocation} → ${row.destinationLocation}` },
          { header: 'Departure Date', cell: (row) => new Date(row.scheduledDeparture).toLocaleString() },
          { header: 'Status', accessor: 'status', cell: (row) => <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : row.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>{row.status}</span> },
          { header: 'Dist (Km)', accessor: 'distanceKm' },
          { header: 'Cargo (Kg)', accessor: 'cargoWeightKg' },
          { header: 'Pax', accessor: 'passengerCount' }
        ];

      case 'fuel-consumption':
        return [
          { header: 'Vehicle Plate', accessor: 'vehiclePlate' },
          { header: 'Primary Fuel Used', accessor: 'fuelType' },
          { header: 'Refuel Cycles', accessor: 'fuelingCount' },
          { header: 'Fuel Consumed', accessor: 'totalQuantity', cell: (row) => `${Number(row.totalQuantity).toLocaleString()} Litres` },
          { header: 'Total Expenditures', accessor: 'totalCost', cell: (row) => `₹${Number(row.totalCost).toLocaleString()}` }
        ];

      case 'fuel-efficiency':
        return [
          { header: 'Vehicle Plate', accessor: 'vehiclePlate' },
          { header: 'Trip Distance (Km)', accessor: 'totalDistanceKm', cell: (row) => `${Number(row.totalDistanceKm).toLocaleString()} Km` },
          { header: 'Refuel Quantity (L)', accessor: 'totalFuelLitres', cell: (row) => `${Number(row.totalFuelLitres).toLocaleString()} L` },
          { header: 'Fuel Efficiency', accessor: 'kmPerLitre', cell: (row) => <span className="font-extrabold text-slate-800 dark:text-slate-200">{row.kmPerLitre} Km/L</span> }
        ];

      case 'maintenance-cost':
        return [
          { header: 'Vehicle Plate', accessor: 'vehiclePlate' },
          { header: 'Completed Jobs', accessor: 'totalJobs' },
          { header: 'Aggregate Repair Cost', accessor: 'totalCost', cell: (row) => `₹${Number(row.totalCost).toLocaleString()}` },
          { header: 'Routine cost', accessor: 'routineCost', cell: (row) => `₹${Number(row.routineCost).toLocaleString()}` },
          { header: 'Repair cost', accessor: 'repairCost', cell: (row) => `₹${Number(row.repairCost).toLocaleString()}` },
          { header: 'Emergency cost', accessor: 'emergencyCost', cell: (row) => `₹${Number(row.emergencyCost).toLocaleString()}` }
        ];

      case 'expense-summary':
        return [
          { header: 'Expense Category', accessor: 'category' },
          { header: 'Voucher Count', accessor: 'count' },
          { header: 'Total expenditures', accessor: 'totalAmount', cell: (row) => `₹${Number(row.totalAmount).toLocaleString()}` },
          { header: 'Paid Amount', accessor: 'paidAmount', cell: (row) => `₹${Number(row.paidAmount).toLocaleString()}` },
          { header: 'Pending Settlement', accessor: 'pendingAmount', cell: (row) => `₹${Number(row.pendingAmount).toLocaleString()}` }
        ];

      default:
        return [];
    }
  };

  // ----------------------------------------------------
  // Export Data Utilities
  // ----------------------------------------------------
  
  // 1. CSV Downloader
  const handleExportCSV = () => {
    if (data.length === 0) return showToast('No data available for export.', 'error');
    
    const cols = getTableColumns();
    const headers = cols.map(c => `"${c.header}"`).join(',');
    
    const rows = data.map(row => {
      return cols.map(col => {
        let val = '';
        if (col.accessor) {
          val = row[col.accessor] ?? '';
        } else if (col.cell) {
          // Flatten simple cell layouts (extract text out of strings/components)
          const renderedVal = col.cell(row);
          val = typeof renderedVal === 'object' ? row.status || '' : renderedVal;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeReport}-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report downloaded successfully.', 'success');
  };

  // 2. Excel (Tab separated spreadsheet) Downloader
  const handleExportExcel = () => {
    if (data.length === 0) return showToast('No data available for export.', 'error');

    const cols = getTableColumns();
    const headers = cols.map(c => c.header).join('\t');
    
    const rows = data.map(row => {
      return cols.map(col => {
        let val = '';
        if (col.accessor) {
          val = row[col.accessor] ?? '';
        } else if (col.cell) {
          const renderedVal = col.cell(row);
          val = typeof renderedVal === 'object' ? row.status || '' : renderedVal;
        }
        return String(val).replace(/\t/g, ' ');
      }).join('\t');
    });

    const xlsContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeReport}-report-${new Date().toISOString().slice(0,10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Excel report downloaded successfully.', 'success');
  };

  // 3. PDF/Print Trigger
  const handlePrintPDF = () => {
    window.print();
  };

  const columns = getTableColumns();

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      
      {/* Printable Report Header */}
      <div className="hidden print:flex flex-col gap-1 border-b pb-4 mb-4">
        <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
          TransitOps Smart Fleet Analytics Report
        </h1>
        <p className="text-xs text-slate-500">
          Report Category: {REPORT_TYPES.find(r => r.id === activeReport)?.name}
        </p>
        <p className="text-[10px] text-slate-400">
          Generated on: {new Date().toLocaleString()} | Period: {startDate || 'All Time'} to {endDate || 'All Time'}
        </p>
      </div>

      {/* Main Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
            Reports &amp; Analytics
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Generate fleet efficiency, vehicle utilizations, driver delivery scorecards, and operations budgets.
          </p>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Sidebar list of reports */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2 print:hidden">
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider px-2 font-sans">
            Analytical Catalogs
          </span>
          <div className="flex flex-col gap-1 mt-2">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveReport(type.id);
                    clearFilters();
                  }}
                  className={`w-full p-3 text-left rounded-xl transition-all duration-150 flex items-center gap-3 ${
                    activeReport === type.id
                      ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-bold border-l-4 border-primary-500'
                      : 'text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs truncate leading-none">{type.name}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-1 font-medium font-sans">
                      {type.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Filters, Charts and Logs Tables */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section 1: Dynamic Context-aware Filter Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
            <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
              <FiFilter className="w-4 h-4 text-primary-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase font-sans">
                Dynamic Filters
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Date Filters */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  End Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Contextual Filters: Vehicle Dropdown (applicable to almost all except driver scorecards) */}
              {activeReport !== 'driver-performance' && activeReport !== 'expense-summary' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Select Vehicle Rig
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">All Vehicles</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contextual Filters: Driver Dropdown */}
              {(activeReport === 'driver-performance' || activeReport === 'trip-summary' || activeReport === 'expense-summary') && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Select Driver
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">All Drivers</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contextual Filters: Trip Status Dropdown */}
              {activeReport === 'trip-summary' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Trip Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">All Statuses</option>
                    {TRIP_STATUSES.map(s => (
                      <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contextual Filters: Expense Category Dropdown */}
              {activeReport === 'expense-summary' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Expense Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contextual Filters: Fuel Type Dropdown */}
              {activeReport === 'fuel-consumption' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={selectedFuelType}
                    onChange={(e) => setSelectedFuelType(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map(ft => (
                      <option key={ft.id} value={ft.id}>{ft.label}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-50 dark:border-slate-850">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-[11px] font-bold"
              >
                Reset Filters
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={loadReport}
                className="text-[11px] font-bold"
              >
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Section 2: Summary KPI Cards Row */}
          {data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getSummaryMetrics().map((metric, i) => (
                <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/80 rounded-2xl shadow-sm">
                  <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-sans">
                    {metric.label}
                  </p>
                  <p className="text-xl font-extrabold text-slate-850 dark:text-slate-100 leading-none mt-2">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Visualization Chart & Table Grid */}
          {loading ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 animate-pulse">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div>
              <div className="h-40 w-full bg-slate-100 dark:bg-slate-950 rounded"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center">
              <FiInfo className="w-8 h-8 text-slate-350 dark:text-slate-650 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching analytical logs found
              </h4>
              <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mt-1 leading-relaxed">
                Try modifying your start/end dates or choosing alternative filters to compile report statistics.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Dynamic Chart Widget */}
              {renderChart() && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm print:hidden">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-850 pb-2">
                    <FiBarChart2 className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider font-sans">
                      Visual Chart Analysis
                    </span>
                  </div>
                  <div className="h-64 relative w-full">
                    {renderChart()}
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm print:border-none print:p-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-50 dark:border-slate-850 print:hidden">
                  <div className="flex items-center gap-2">
                    <FiTable className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider font-sans">
                      Report Ledger Details
                    </span>
                  </div>

                  {/* Export Trigger Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold font-sans transition-colors"
                      title="Export comma separated file"
                    >
                      <FiDownload className="w-3 h-3" /> CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold font-sans transition-colors"
                      title="Export Excel spreadsheet"
                    >
                      <FiDownload className="w-3 h-3" /> Excel
                    </button>
                    <button
                      onClick={handlePrintPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-650 border border-primary-200 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-800 rounded-lg text-[10px] font-bold font-sans transition-colors"
                      title="Generate printable PDF"
                    >
                      <FiDownload className="w-3 h-3" /> Print PDF
                    </button>
                  </div>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto w-full border border-slate-100 dark:border-slate-850 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-500 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-850">
                        {columns.map((col, i) => (
                          <th key={i} className="p-3 font-sans font-extrabold">{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {data.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300">
                          {columns.map((col, colIndex) => {
                            let cellVal = '';
                            if (col.accessor) {
                              cellVal = row[col.accessor] ?? '';
                            }
                            return (
                              <td key={colIndex} className="p-3">
                                {col.cell ? col.cell(row) : cellVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Reports;
