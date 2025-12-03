'use client';
import { useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

import Link from 'next/link';
import { ClipboardList, Upload, Download, Users, Building2, CheckCircle, FileSpreadsheet } from 'lucide-react';
import LordIcon, { LordIconRef } from '../../../components/ui/LordIcon';
import searchIcon from '../../../public/icons/search.json';
import { toast } from 'react-hot-toast';
import React from 'react';
import dynamic from 'next/dynamic';
import AnimatedSelect from '@/components/AnimatedSelect';
import TempoMetricCard from '@/components/dashboard/TempoMetricCard';

// Dynamically import motion components
const motion = {
  div: dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
    ssr: false,
    loading: () => <div />
  }),
  button: dynamic(() => import('framer-motion').then(mod => mod.motion.button), {
    ssr: false,
    loading: () => <button />
  }),
  main: dynamic(() => import('framer-motion').then(mod => mod.motion.main), {
    ssr: false,
    loading: () => <main />
  })
};

const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), {
  ssr: false
});


interface Unit {
  name: string;
  code: number;
}

// Generate array of years from 2020 to 2030
const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

// Add animation variants for subtle section switching
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const sectionVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.08
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.25
    }
  }
};

const elementVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

const dropzoneVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.1
    }
  },
  exit: { opacity: 0, scale: 0.97 }
};

export default function BulkUploadsPage() {
  // Get current year
  const currentYear = new Date().getFullYear();
  const searchIconRef = useRef<LordIconRef>(null);

  // Separate state for Process Salary section
  const [processSalaryUnit, setProcessSalaryUnit] = useState('');
  const [processSalaryMonth, setProcessSalaryMonth] = useState('');
  const [processSalaryYear, setProcessSalaryYear] = useState(currentYear.toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [salaryProcessResult, setSalaryProcessResult] = useState<'success' | 'error' | null>(null);

  // Attendance Upload states
  const [selectedAttendanceUnit, setSelectedAttendanceUnit] = useState('');
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState('');
  const [selectedAttendanceYear, setSelectedAttendanceYear] = useState(currentYear.toString());

  // Process Salary states
  const [selectedSalaryUnit, setSelectedSalaryUnit] = useState('');
  const [selectedSalaryMonth, setSelectedSalaryMonth] = useState('');
  const [selectedSalaryYear, setSelectedSalaryYear] = useState(currentYear.toString());

  // File state tracking
  const [selectedEmployeeFile, setSelectedEmployeeFile] = useState<File | null>(null);
  const [selectedAttendanceFile, setSelectedAttendanceFile] = useState<File | null>(null);

  // Drag state tracking
  const [isEmployeeDragActive, setIsEmployeeDragActive] = useState(false);
  const [isAttendanceDragActive, setIsAttendanceDragActive] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'employee' | 'attendance' | 'salary'>('employee');

  // Activity history state
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'employee' | 'attendance' | 'salary';
    action: string;
    status: 'success' | 'error' | 'pending';
    timestamp: Date;
    details: string;
  }>>([]);

  // Stats state
  const [stats, setStats] = useState({
    totalEmployees: 0,
    lastUploadDate: null as Date | null,
    pendingApprovals: 0,
    attendanceRate: 0,
    lastSalaryProcessed: null as Date | null,
  });

  // Other existing states
  const [units, setUnits] = useState<Array<{
    _id: string;
    unitName: string;
    unitCode: string | number;
    address: string;
    districtOrState: string;
    gstNumber: string;
    supervisorName: string;
    contractStartDate: string;
    contractEndDate: string;
    serviceCharge: number;
    salaryCalculations: string;
    LWF: boolean;
    phoneNumber: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{
    message: string | React.ReactNode;
    type: 'success' | 'error' | null;
  }>({ message: '', type: null });

  // Auto-clear salary process result after 5 seconds
  useEffect(() => {
    if (salaryProcessResult) {
      const timer = setTimeout(() => {
        setSalaryProcessResult(null);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [salaryProcessResult]);

  // Fetch units when component mounts
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/units/get-units');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.units)) {
          setUnits(data.units);
        } else {
          setUnits([]);
        }
      } catch (error) {
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const { getRootProps: getEmployeeDropProps, getInputProps: getEmployeeInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize: 10485760, // 10MB
    onDragEnter: () => setIsEmployeeDragActive(true),
    onDragLeave: () => setIsEmployeeDragActive(false),
    onDrop: async (acceptedFiles) => {
      setIsEmployeeDragActive(false);

      if (acceptedFiles.length === 0) return;

      setSelectedEmployeeFile(acceptedFiles[0]);

      try {
        setUploadStatus({ message: 'Uploading employees...', type: null });

        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);

        const response = await fetch('/api/bulk-uploads/employee', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          if (result.pending) {
            // Pending approval workflow
            setUploadStatus({
              message: `${result.message || 'Upload submitted for admin approval'}
                ${result.recordCount} records will be processed after approval`,
              type: 'success'
            });
            toast.success('Upload submitted for admin approval');
            addActivity('employee', 'Upload submitted', 'pending', `${result.recordCount} records pending approval`);
          } else {
            // Direct processing (admin)
            setUploadStatus({
              message: `Upload complete:
                ${result.stats.totalProcessed} records processed
                ${result.stats.newRecords} new employees added
                ${result.stats.updatedRecords} employees updated
                ${result.stats.skippedRecords} records skipped`,
              type: 'success'
            });
            toast.success('Employees uploaded successfully!');
            addActivity('employee', 'Employee upload', 'success', `${result.stats.newRecords} new, ${result.stats.updatedRecords} updated`);
          }
          // Clear file after successful upload
          setTimeout(() => setSelectedEmployeeFile(null), 3000);
        } else {
          setUploadStatus({
            message: result.error || 'Upload failed',
            type: 'error'
          });
          toast.error('Failed to upload employees');
          addActivity('employee', 'Employee upload', 'error', result.error || 'Upload failed');
          setSelectedEmployeeFile(null);
        }
      } catch (error) {
        setUploadStatus({
          message: 'Failed to upload file',
          type: 'error'
        });
        toast.error('Failed to upload employees');
        setSelectedEmployeeFile(null);
      }
    }
  });

  const { getRootProps: getAttendanceDropProps, getInputProps: getAttendanceInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize: 10485760, // 10MB
    onDragEnter: () => setIsAttendanceDragActive(true),
    onDragLeave: () => setIsAttendanceDragActive(false),
    onDrop: async (acceptedFiles) => {
      setIsAttendanceDragActive(false);

      if (acceptedFiles.length === 0) return;

      try {
        if (!selectedAttendanceUnit || !selectedAttendanceMonth || !selectedAttendanceYear) {
          setUploadStatus({
            message: 'Please select Unit, Month and Year before uploading',
            type: 'error'
          });
          return;
        }

        setSelectedAttendanceFile(acceptedFiles[0]);
        setUploadStatus({ message: 'Uploading...', type: null });

        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);
        formData.append('unit', selectedAttendanceUnit);
        formData.append('month', selectedAttendanceMonth);
        formData.append('year', selectedAttendanceYear);

        const response = await fetch('/api/attendance/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          if (result.pending) {
            // Pending approval workflow
            setUploadStatus({
              message: `${result.message || 'Attendance upload submitted for admin approval'}
                ${result.recordCount} records will be processed after approval`,
              type: 'success'
            });
            toast.success('Attendance upload submitted for admin approval');
            addActivity('attendance', 'Upload submitted', 'pending', `${result.recordCount} attendance records`);
          } else {
            // Direct processing (admin)
            setUploadStatus({
              message: 'Attendance records uploaded successfully',
              type: 'success'
            });
            toast.success('Attendance records uploaded successfully');
            addActivity('attendance', 'Attendance upload', 'success', `${selectedAttendanceUnit} - ${monthOptions.find(m => m.value === selectedAttendanceMonth)?.label} ${selectedAttendanceYear}`);
          }
          // Clear file after successful upload
          setTimeout(() => setSelectedAttendanceFile(null), 3000);
        } else {
          if (result.invalidEmployees && result.invalidEmployees.length > 0) {
            // Create formatted message with list of invalid employees
            const errorMessage = (
              <div>
                <p className="font-medium mb-2">The following employees were not found:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {result.invalidEmployees.map((empId: string) => (
                    <li key={empId}>{empId}</li>
                  ))}
                </ul>
              </div>
            );

            setUploadStatus({
              message: errorMessage,
              type: 'error'
            });
            addActivity('attendance', 'Attendance upload', 'error', `${result.invalidEmployees.length} employees not found`);
          } else {
            setUploadStatus({
              message: result.error || 'Upload failed',
              type: 'error'
            });
            addActivity('attendance', 'Attendance upload', 'error', result.error || 'Upload failed');
          }
          setSelectedAttendanceFile(null);
        }
      } catch (error) {
        setUploadStatus({
          message: 'Failed to upload file',
          type: 'error'
        });
        addActivity('attendance', 'Attendance upload', 'error', 'Failed to upload file');
        setSelectedAttendanceFile(null);
      }
    }
  });

  // Template download handlers
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/templates/employee', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setUploadStatus({
        message: 'Failed to download template',
        type: 'error'
      });
    }
  };

  const handleDownloadAttendanceTemplate = async () => {
    try {
      const response = await fetch('/api/templates/attendance', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setUploadStatus({
        message: 'Failed to download template',
        type: 'error'
      });
    }
  };

  // Separate handler for Process Salary
  const handleProcessSalary = async () => {
    if (!processSalaryUnit || !processSalaryMonth || !processSalaryYear) {
      setUploadStatus({
        message: 'Please select Unit, Month and Year before processing salary',
        type: 'error'
      });
      setSalaryProcessResult('error');
      return;
    }

    try {
      setIsProcessing(true);
      setSalaryProcessResult(null); // Clear previous result
      setUploadStatus({ message: 'Processing salary...', type: null });

      const response = await fetch('/api/process-salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unit: processSalaryUnit,
          month: processSalaryMonth,
          year: processSalaryYear
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus({
          message: 'Salary processed successfully',
          type: 'success'
        });
        setSalaryProcessResult('success');
        addActivity('salary', 'Salary processed', 'success', `${processSalaryUnit} - ${monthOptions.find(m => m.value === processSalaryMonth)?.label} ${processSalaryYear}`);
        setStats(prev => ({ ...prev, lastSalaryProcessed: new Date() }));
      } else {
        setUploadStatus({
          message: result.error || 'Failed to process salary',
          type: 'error'
        });
        setSalaryProcessResult('error');
        addActivity('salary', 'Salary processing', 'error', result.error || 'Failed to process salary');
      }
    } catch (error) {
      setUploadStatus({
        message: 'Failed to process salary',
        type: 'error'
      });
      setSalaryProcessResult('error');
      addActivity('salary', 'Salary processing', 'error', 'Failed to process salary');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format units for dropdown
  const unitOptions = units.map(unit => ({
    value: unit.unitName,
    label: unit.unitName
  }));

  // Format months for dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(0, i).toLocaleString('default', { month: 'long' })
  }));

  // Format years for dropdown
  const yearOptions = years.map(year => ({
    value: year.toString(),
    label: year.toString()
  }));

  // Add activity to history
  const addActivity = (
    type: 'employee' | 'attendance' | 'salary',
    action: string,
    status: 'success' | 'error' | 'pending',
    details: string
  ) => {
    const newActivity = {
      id: Date.now().toString(),
      type,
      action,
      status,
      timestamp: new Date(),
      details,
    };
    setRecentActivity(prev => [newActivity, ...prev].slice(0, 10)); // Keep last 10 activities
  };

  return (
    <motion.main
      className="bg-white dark:bg-gray-900 min-h-full"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Dashboard Title - Left Side */}
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Data and Processing</h1>
          </div>

          {/* Search Box - Right Side */}
          <div 
            className="relative w-64"
            onMouseEnter={() => searchIconRef.current?.playAnimation()}
            onMouseLeave={() => searchIconRef.current?.goToFirstFrame()}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LordIcon
                ref={searchIconRef}
                icon={searchIcon}
                size={16}
                className="text-gray-400"
                trigger="manual"
              />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <TempoMetricCard
            icon={<Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            title="Total Employees"
            value={units.reduce((acc, unit) => acc + 1, 0)}
            change="+12%"
            changeLabel="vs last month"
            isPositive={true}
          />

          <TempoMetricCard
            icon={<Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            title="Units"
            value={units.length}
            change="+2"
            changeLabel="New units"
            isPositive={true}
          />

          <TempoMetricCard
            icon={<ClipboardList className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            title="Recent Activity"
            value={recentActivity.length}
            change="Active"
            changeLabel="Last 24h"
            isPositive={true}
          />

          <TempoMetricCard
            icon={<CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            title="Success Rate"
            value={`${recentActivity.length > 0
              ? Math.round((recentActivity.filter(a => a.status === 'success').length / recentActivity.length) * 100)
              : 0}%`}
            change="+5%"
            changeLabel="vs last week"
            isPositive={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header with Period Tabs Style */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('employee')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${activeTab === 'employee'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Employee Upload
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${activeTab === 'attendance'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Attendance Upload
                </button>
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${activeTab === 'salary'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Process Salary
                </button>
              </div>

              {/* Template Download Button */}
              {(activeTab === 'employee' || activeTab === 'attendance') && (
                <button
                  onClick={activeTab === 'employee' ? handleDownloadTemplate : handleDownloadAttendanceTemplate}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Template</span>
                </button>
              )}
            </div>

            {/* Status Message */}
            <AnimatePresence>
              {uploadStatus.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-lg border ${uploadStatus.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                    : uploadStatus.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                      : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
                    }`}
                >
                  {uploadStatus.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Employee Upload Section */}
                {activeTab === 'employee' && (
                  <motion.div
                    className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
                  >
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Employee Upload</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Upload employee data in Excel or CSV format</p>

                    <motion.div
                      variants={dropzoneVariants}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer mb-8 transition-all duration-200 ${isEmployeeDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                        : selectedEmployeeFile
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <div {...getEmployeeDropProps()}>
                        <input {...getEmployeeInputProps()} />
                        <div className="flex flex-col items-center">
                          {selectedEmployeeFile ? (
                            <>
                              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-slate-900 dark:text-white font-medium mb-1">{selectedEmployeeFile.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{(selectedEmployeeFile.size / 1024).toFixed(2)} KB</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEmployeeFile(null);
                                }}
                                className="mt-4 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Remove file
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Upload className={`w-8 h-8 transition-colors ${isEmployeeDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                              </div>
                              <p className="text-base font-medium text-slate-900 dark:text-white mb-1">
                                {isEmployeeDragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Excel or CSV files (max 10MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Upload Requirements</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">File Format</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">.xlsx, .xls, or .csv</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Required Columns</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Employee ID, Name, Department</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Attendance Upload Section */}
                {activeTab === 'attendance' && (
                  <motion.div
                    className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
                  >
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Attendance Upload</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Upload attendance records for employees</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <AnimatedSelect
                        id="attendance-unit"
                        label="Unit"
                        value={selectedAttendanceUnit}
                        onChange={setSelectedAttendanceUnit}
                        options={unitOptions}
                        placeholder="Select Unit"
                      />
                      <AnimatedSelect
                        id="attendance-month"
                        label="Month"
                        value={selectedAttendanceMonth}
                        onChange={setSelectedAttendanceMonth}
                        options={monthOptions}
                        placeholder="Select Month"
                      />
                      <AnimatedSelect
                        id="attendance-year"
                        label="Year"
                        value={selectedAttendanceYear}
                        onChange={setSelectedAttendanceYear}
                        options={yearOptions}
                        placeholder="Select Year"
                      />
                    </div>

                    <motion.div
                      variants={dropzoneVariants}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer mb-8 transition-all duration-200 ${isAttendanceDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                        : selectedAttendanceFile
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <div {...getAttendanceDropProps()}>
                        <input {...getAttendanceInputProps()} />
                        <div className="flex flex-col items-center">
                          {selectedAttendanceFile ? (
                            <>
                              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-slate-900 dark:text-white font-medium mb-1">{selectedAttendanceFile.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{(selectedAttendanceFile.size / 1024).toFixed(2)} KB</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAttendanceFile(null);
                                }}
                                className="mt-4 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Remove file
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Upload className={`w-8 h-8 transition-colors ${isAttendanceDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                              </div>
                              <p className="text-base font-medium text-slate-900 dark:text-white mb-1">
                                {isAttendanceDragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Excel or CSV files (max 10MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Upload Requirements</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">File Format</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">.xlsx, .xls, or .csv</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Required Columns</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Emp ID, Date, Check-in, Check-out</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Process Salary Section */}
                {activeTab === 'salary' && (
                  <motion.div
                    className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm transition-all duration-500 ${salaryProcessResult === 'success'
                      ? 'shadow-[0_0_0_2px_#10b981,0_0_20px_rgba(16,185,129,0.3)]'
                      : salaryProcessResult === 'error'
                        ? 'shadow-[0_0_0_2px_#ef4444,0_0_20px_rgba(239,68,68,0.3)]'
                        : ''
                      }`}
                  >
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Process Salary</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Process salary data for the selected unit and period</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <AnimatedSelect
                        id="salary-unit"
                        label="Unit"
                        value={processSalaryUnit}
                        onChange={(value) => {
                          setProcessSalaryUnit(value);
                          setSalaryProcessResult(null);
                        }}
                        options={unitOptions}
                        placeholder="Select Unit"
                        direction="down"
                      />
                      <AnimatedSelect
                        id="salary-month"
                        label="Month"
                        value={processSalaryMonth}
                        onChange={(value) => {
                          setProcessSalaryMonth(value);
                          setSalaryProcessResult(null);
                        }}
                        options={monthOptions}
                        placeholder="Select Month"
                        direction="down"
                      />
                      <AnimatedSelect
                        id="salary-year"
                        label="Year"
                        value={processSalaryYear}
                        onChange={(value) => {
                          setProcessSalaryYear(value);
                          setSalaryProcessResult(null);
                        }}
                        options={yearOptions}
                        placeholder="Select Year"
                        direction="down"
                      />
                    </div>

                    <div className="flex justify-end">
                      <motion.button
                        onClick={handleProcessSalary}
                        disabled={isProcessing}
                        className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Process Salary</span>
                            <span className="text-lg leading-none">→</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <svg className="w-4 h-4 text-green-700 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{activity.details}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions & Tips */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <svg className="w-4 h-4 text-blue-700 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Download className="w-4 h-4 text-slate-400" />
                  Download All Templates
                </button>
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  View Upload History
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Pro Tips</h4>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-blue-500 font-bold">•</span>
                    Use templates to ensure proper formatting
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-blue-500 font-bold">•</span>
                    Validate data before uploading
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
