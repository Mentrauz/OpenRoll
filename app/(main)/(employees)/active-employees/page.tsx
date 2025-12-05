'use client';
import { useEffect, useState } from 'react';

import { User, FileDown, Users, Loader2, Download } from 'lucide-react';
import LordIcon from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';
import { globalLoadingState } from '@/components/Layout';
import { Toaster } from 'react-hot-toast';
import { showErrorToast, showSuccessToast } from '@/lib/toast-config';
import dynamic from 'next/dynamic';
import AnimatedSelect from '@/components/AnimatedSelect';
import LoadingSpinner from '@/components/LoadingSpinner';

// Dynamically import motion components
const motion = {
  div: dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
    ssr: false,
    loading: () => <div className="min-h-screen" />
  }),
  button: dynamic(() => import('framer-motion').then(mod => mod.motion.button), {
    ssr: false,
    loading: () => <button />
  }),
  tr: dynamic(() => import('framer-motion').then(mod => mod.motion.tr), {
    ssr: false,
    loading: () => <tr />
  })
};

const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), {
  ssr: false
});

// Add jsPDF with autoTable type declaration
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Employee {
  empId: string;
  name: string;
  dob: string;
  guardianName: string;
  relation: string;
  doj: string;
  esicNumber: string;
  uanNumber: string;
  bankAccount: string;
  ifscCode: string;
  aadharNumber: string;
  unitName: string;
  basicRate: number;
  vdaRate: number;
  hraRate: number;
  convRate: number;
  washRate: number;
  othRate: number;
  totalRate: number;
  _id: string;
}

// Helper function to convert Excel serial number to date string for display
const formatExcelDate = (dateValue: any): string => {
  if (!dateValue) return '';

  try {
    // If it's already a date string in DD/MM/YYYY format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateValue;
    }

    // If it's already a date string in YYYY-MM-DD format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split('-');
      return `${day}/${month}/${year}`;
    }

    // If it's a number (Excel date)
    if (typeof dateValue === 'number' || !isNaN(Number(dateValue))) {
      const date = new Date((Number(dateValue) - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }

    // Try parsing as regular date string
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return '';
  } catch (error) {
    return '';
  }
};

// Helper function to convert Excel date to HTML date input format (YYYY-MM-DD)
const formatDateForInput = (serialNumber: number): string => {
  if (!serialNumber) return '';
  const date = new Date((serialNumber - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Add animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const tableVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const rowVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export default function ActiveEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<Employee[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(25);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [units, setUnits] = useState<string[]>([]);

  // Single fetch function for both initial load and searches
  const fetchEmployees = async (search?: string) => {
    if (!selectedUnit) return;

    try {
      if (!globalLoadingState.isLoading) {
        globalLoadingState.setDataLoading(true);
      }

      let url = `/api/employees?unit=${encodeURIComponent(selectedUnit)}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const timestamp = Date.now();
      url += `&t=${timestamp}`;

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        setSearchResult(data);
        setNotFound(false);
      } else {
        setSearchResult([]);
        setNotFound(true);
        showErrorToast('No employees found');
      }
    } catch (error) {
      setSearchResult([]);
      setNotFound(true);
      showErrorToast('Error fetching employees');
    } finally {
      globalLoadingState.setDataLoading(false);
    }
  };

  // Fetch units only once on component mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/units?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          cache: 'no-store'
        });
        const data = await response.json();
        setUnits(data.units);
        // Remove automatic selection of first unit
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  // Only fetch employees when selectedUnit changes
  useEffect(() => {
    if (selectedUnit) {
      fetchEmployees();
    }
  }, [selectedUnit]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchEmployees(searchTerm);
  };

  const exportToExcel = async () => {
    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx-js-style');

      const worksheet = XLSX.utils.json_to_sheet(searchResult.map(emp => ({
        'Employee ID': emp.empId,
        'Name': emp.name,
        'DOB': new Date(emp.dob).toLocaleDateString(),
        "Guardian's Name": emp.guardianName,
        'Relation': emp.relation,
        'DOJ': new Date(emp.doj).toLocaleDateString(),
        'ESIC Number': emp.esicNumber,
        'UAN Number': emp.uanNumber,
        'Bank Account': emp.bankAccount,
        'IFSC Code': emp.ifscCode,
        'Aadhar Number': emp.aadharNumber,
        'Unit Name': emp.unitName
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
      XLSX.writeFile(workbook, 'employees.xlsx');

      showSuccessToast('Excel file exported successfully!');
    } catch (error) {
      showErrorToast('Failed to export Excel file');
    }
  };

  const exportToPDF = async () => {
    try {
      // Dynamically import jsPDF and jspdf-autotable
      const jsPDFModule = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDFModule.default('landscape');

      // Add title
      doc.setFontSize(16);
      doc.text('Active Employees', 14, 15);

      // Create the table
      const tableData = searchResult.map(emp => [
        emp.empId,
        emp.name,
        new Date(emp.dob).toLocaleDateString(),
        emp.guardianName,
        emp.relation,
        new Date(emp.doj).toLocaleDateString(),
        emp.esicNumber,
        emp.uanNumber,
        `${emp.bankAccount}\n${emp.ifscCode}`,
        emp.aadharNumber,
        emp.unitName
      ]);

      doc.autoTable({
        startY: 25,
        head: [[
          'Emp ID',
          'Name',
          'DOB',
          "Guardian's Name",
          'Relation',
          'DOJ',
          'ESIC Number',
          'UAN Number',
          'Bank Details',
          'Aadhar Number',
          'Unit Name'
        ]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 0] }
      });

      doc.save('employees.pdf');

      showSuccessToast('PDF file exported successfully!');
    } catch (error) {
      showErrorToast('Failed to export PDF file');
    }
  };

  useEffect(() => {
    const closeDropdown = (e: MouseEvent) => {
      if (isExportOpen) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [isExportOpen]);

  // Calculate pagination values
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = searchResult.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(searchResult.length / entriesPerPage);

  // Handle page changes
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Show inline loading when data is loading for selected unit

  return (
    <div className="bg-white dark:bg-gray-900 min-h-full">
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title - Left Side */}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Active Employees</h1>
          </div>

          {/* Search Box - Right Side */}
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <LordIcon
                icon={searchIcon}
                size={16}
                className="text-gray-400"
                trigger="hover"
              />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-full mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {!selectedUnit ? (
              <motion.div
                key="unit-selector"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Select Unit</h2>
                  </div>
                  <div className="w-full max-w-sm">
                    <AnimatedSelect
                      id="active-employees-unit-selector"
                      value={selectedUnit}
                      onChange={setSelectedUnit}
                      options={units.map((unit) => ({
                        value: unit,
                        label: unit
                      }))}
                      placeholder="Choose a unit..."
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="employee-table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Unit and Export Controls */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  {/* Left Side - Unit Display */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Unit: <span className="text-blue-600 dark:text-blue-400 font-semibold">{selectedUnit}</span>
                    </span>
                  </div>

                  {/* Right Side - Export and Change Unit Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUnit('')}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Change Unit
                    </button>

                    <button
                      onClick={exportToExcel}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {/* Employees Table */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative"
                  variants={tableVariants}
                  transition={{ delay: 0.3 }}
                >
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"></div>
                          <div className="w-8 h-8 rounded-full border-2 border-t-gray-800 dark:border-t-white border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0 animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading employees...</p>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 min-w-[1400px]">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-32">
                            Employee ID
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-40">
                            Name
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-28">
                            DOB
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-40">
                            Guardian's Name
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-24">
                            Relation
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-28">
                            DOJ
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-32">
                            ESIC Number
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-32">
                            UAN Number
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-48">
                            Bank Details
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-36">
                            Aadhar Number
                          </th>
                          <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-48">
                            Unit Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <AnimatePresence>
                          {currentEntries.map((employee, index) => (
                            <motion.tr
                              key={`${employee.empId}-${index}`}
                              variants={rowVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={{ delay: index * 0.05 }}
                              className={`hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-gray-750'}`}
                            >
                              <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap w-32">
                                {employee.empId}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-900 dark:text-white whitespace-nowrap w-40">
                                {employee.name}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap w-28">
                                {formatExcelDate(employee.dob)}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-900 dark:text-white whitespace-nowrap w-40">
                                {employee.guardianName}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap w-24">
                                {employee.relation}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap w-28">
                                {formatExcelDate(employee.doj)}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-900 dark:text-white whitespace-nowrap w-32">
                                {employee.esicNumber}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-900 dark:text-white whitespace-nowrap w-32">
                                {employee.uanNumber}
                              </td>
                              <td className="px-4 py-4 text-sm whitespace-nowrap w-48">
                                <div className="flex flex-col">
                                  <span className="text-slate-900 dark:text-white font-medium">{employee.bankAccount}</span>
                                  <span className="text-slate-600 dark:text-slate-400 text-xs mt-1">{employee.ifscCode}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-900 dark:text-white whitespace-nowrap w-36">
                                {employee.aadharNumber}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap w-48">
                                {employee.unitName}
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                {/* Pagination */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                  variants={pageVariants}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Showing <span className="text-[#1a365d] dark:text-blue-400 font-semibold">{indexOfFirstEntry + 1}</span> to{' '}
                      <span className="text-[#1a365d] dark:text-blue-400 font-semibold">{Math.min(indexOfLastEntry, searchResult.length)}</span> of{' '}
                      <span className="text-[#1a365d] dark:text-blue-400 font-semibold">{searchResult.length}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => paginate(i + 1)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${currentPage === i + 1
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                              : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700'
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}





















