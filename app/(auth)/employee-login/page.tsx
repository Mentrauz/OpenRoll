'use client'
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, ChevronRight, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AnimatedSelect from '@/components/AnimatedSelect';

interface Employee {
  empId: string;
  name: string;
  guardianName?: string;
  unit: string;
  unitName: string;
}

export default function EmployeeLoginPage() {
  const [empId, setEmpId] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showSalaryOptions, setShowSalaryOptions] = useState(false);

  // Generate array of last 2 years including current year
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];

  // Array of months
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!empId.trim()) {
      setError('Employee ID is required');
      return;
    }

    setLoading(true);
    try {
      // Now the API will search across all unit collections
      const response = await fetch(`/api/employee-search?empId=${empId}`);
      const data = await response.json();

      if (data && data.length > 0) {
        setEmployeeDetails(data[0]);
        setShowOptions(true);
      } else {
        setError('Employee not found');
        setEmployeeDetails(null);
      }
    } catch (err) {
      setError('Failed to fetch employee details');
      setEmployeeDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleESICDownload = async () => {
    if (!employeeDetails) return;
    
    try {
      toast.loading('Fetching ESIC Certificate...');
      
      const response = await fetch(`/api/esic-certificate/${employeeDetails.empId}`);
      
      if (!response.ok) {
        throw new Error('Certificate not found');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `ESIC_Certificate_${employeeDetails.empId}.pdf`; // Set filename
      
      // Append link to body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('ESIC Certificate downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('ESIC Certificate not found');
    }
  };

  const handleSalarySlipDownload = async () => {
    if (!employeeDetails || !selectedMonth || !selectedYear) {
      toast.error('Please select month and year');
      return;
    }
    
    try {
      toast.loading('Fetching Salary Slip...');
      
      const response = await fetch(
        `/api/employee-salary-slip/${employeeDetails.empId}?month=${selectedMonth}&year=${selectedYear}`
      );
      
      if (!response.ok) {
        throw new Error('Salary slip not found');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary_Slip_${employeeDetails.empId}_${selectedMonth}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Salary Slip downloaded successfully');
      setShowSalaryOptions(false); // Hide the options after successful download
    } catch (error) {
      toast.dismiss();
      toast.error('Salary Slip not found for selected month and year');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div 
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back to Admin Login */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/login">
            <motion.div
              className="inline-flex items-center text-slate-600 hover:text-slate-900"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Login
            </motion.div>
          </Link>
        </motion.div>

        <div className="mb-8">
          <Image 
            src="/images/tms-logo.svg"
            alt="TMS Logo"
            width={80}
            height={24}
            priority
            className="mb-6"
          />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Employee Portal
          </h1>
          <p className="text-slate-600">
            Access your documents and information
          </p>
        </div>

        {!showOptions ? (
          <motion.form 
            onSubmit={handleContinue}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                placeholder="Enter your Employee ID"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-5 rounded-lg hover:bg-slate-900 transition-all duration-200 font-semibold disabled:opacity-60"
              whileHover={{ y: -1 }}
              whileTap={{ y: 1 }}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Employee Details Card */}
            <motion.div 
              className="bg-slate-50 p-6 rounded-xl space-y-4 border border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-medium text-slate-900">Employee Details</h2>
                  <div className="space-y-0.5 text-sm text-slate-600">
                    <p>ID: {employeeDetails?.empId}</p>
                    <p className="font-medium text-slate-900">Name: {employeeDetails?.name}</p>
                    {employeeDetails?.guardianName && (
                      <p>Guardian: {employeeDetails.guardianName}</p>
                    )}
                    <p>Unit: {employeeDetails?.unitName}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Options */}
            <motion.button
              onClick={handleESICDownload}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-slate-400 hover:shadow-sm transition-all duration-200"
              whileHover={{ x: 5 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Download className="w-5 h-5 text-slate-900" />
                </div>
                <span className="font-medium text-slate-900">ESIC Certificate</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.button>

            <div className="space-y-4">
              <motion.button
                onClick={() => setShowSalaryOptions(!showSalaryOptions)}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-slate-400 hover:shadow-sm transition-all duration-200"
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Download className="w-5 h-5 text-slate-900" />
                  </div>
                  <span className="font-medium text-slate-900">Salary Slip</span>
                </div>
                <ChevronRight 
                  className={`w-5 h-5 text-slate-400 transform transition-transform duration-200 ${
                    showSalaryOptions ? 'rotate-90' : ''
                  }`} 
                />
              </motion.button>

              {showSalaryOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-50 rounded-xl space-y-4 border border-gray-200"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedSelect
                      id="salary-month"
                      label="Month"
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                      options={months.map((month) => ({
                        value: month.value,
                        label: month.label
                      }))}
                      placeholder="Select Month"
                    />
                    <AnimatedSelect
                      id="salary-year"
                      label="Year"
                      value={selectedYear}
                      onChange={setSelectedYear}
                      options={years.map((year) => ({
                        value: year.toString(),
                        label: year.toString()
                      }))}
                      placeholder="Select Year"
                    />
                  </div>
                  <motion.button
                    onClick={handleSalarySlipDownload}
                    className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-slate-900 transition-all duration-200 font-medium"
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 1 }}
                    disabled={!selectedMonth || !selectedYear}
                  >
                    Download Salary Slip
                  </motion.button>
                </motion.div>
              )}
            </div>

            {/* More options can be added here */}
          </motion.div>
        )}

        {error && (
          <motion.div 
            className="mt-4 text-sm bg-slate-100 text-slate-900 px-4 py-3 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}





















