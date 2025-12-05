'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, CheckCircle, XCircle, Lock, LockOpen, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ModernInput from '@/components/ModernInput';
import ModernDatePicker from '@/components/ModernDatePicker';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import motion components
const motion = {
  div: dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
    ssr: false,
    loading: () => <div />
  })
};

interface FinancialYearProps {
  onBack?: () => void;
}

interface FinancialYearItem {
  _id: string;
  yearCode: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  closingDate?: string;
  description: string;
  createdAt: string;
}

export default function FinancialYear({ onBack }: FinancialYearProps = {}) {
  const [financialYears, setFinancialYears] = useState<FinancialYearItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [yearCode, setYearCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchFinancialYears();
  }, []);

  const fetchFinancialYears = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/books/financial-year');
      const data = await res.json();

      if (data.success) {
        setFinancialYears(data.financialYears);
      } else {
        toast.error(data.message || 'Failed to fetch financial years');
      }
    } catch (error) {
      toast.error('Failed to fetch financial years');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!yearCode || !startDate || !endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/books/financial-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearCode,
          startDate,
          endDate,
          description,
          createdBy: 'system', // Replace with actual user
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Financial year created successfully');
        resetForm();
        fetchFinancialYears();
      } else {
        toast.error(data.message || 'Failed to create financial year');
      }
    } catch (error) {
      toast.error('Failed to create financial year');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setYearCode('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setShowForm(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/books/financial-year', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: id,
          isActive: !currentStatus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Financial year ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchFinancialYears();
      } else {
        toast.error(data.message || 'Failed to update financial year');
      }
    } catch (error) {
      toast.error('Failed to update financial year');
    }
  };

  const handleToggleClosed = async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      toast.error('Cannot reopen a closed financial year');
      return;
    }

    if (!confirm('Are you sure you want to close this financial year? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/books/financial-year', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: id,
          isClosed: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Financial year closed successfully');
        fetchFinancialYears();
      } else {
        toast.error(data.message || 'Failed to close financial year');
      }
    } catch (error) {
      toast.error('Failed to close financial year');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financial year?')) {
      return;
    }

    try {
      const res = await fetch(`/api/books/financial-year?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Financial year deleted successfully');
        fetchFinancialYears();
      } else {
        toast.error(data.message || 'Failed to delete financial year');
      }
    } catch (error) {
      toast.error('Failed to delete financial year');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 flex items-center">
            <Calendar className="w-6 h-6 mr-2" />
            Financial Year Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 ml-8">Manage financial periods and year-end closing</p>
        </div>
        <table className="w-full">
          <tbody>
            {financialYears.map((year) => (
              <tr key={year._id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{year.yearCode}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(year.startDate).toLocaleDateString('en-IN')} - {new Date(year.endDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowForm(!showForm)}
                        title={year.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {year.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleClosed(year._id, year.isClosed)}
                        className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-lg"
                        title="Close Year"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(year._id)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {financialYears.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No financial years found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Financial Year
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}





















