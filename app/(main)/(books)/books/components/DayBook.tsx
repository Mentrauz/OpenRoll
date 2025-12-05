'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileDown, Filter, ArrowLeft, BookMarked } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AnimatedSelect from '@/components/AnimatedSelect';
import ModernDateRangePicker from '@/components/ModernDateRangePicker';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import motion components
const motion = {
  div: dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
    ssr: false,
    loading: () => <div />
  })
};

interface DayBookProps {
  onBack?: () => void;
}

interface DayBookEntry {
  _id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  entries: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    narration: string;
  }[];
  narration: string;
  totalDebit: number;
  totalCredit: number;
  referenceNumber?: string;
  chequeNumber?: string;
}

export default function DayBook({ onBack }: DayBookProps = {}) {
  const [dayBookEntries, setDayBookEntries] = useState<DayBookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('All');

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today);
  const [summary, setSummary] = useState({ totalVouchers: 0, totalDebit: 0, totalCredit: 0 });

  useEffect(() => {
    fetchDayBook();
  }, []);

  const fetchDayBook = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      if (selectedType !== 'All') {
        params.append('type', selectedType);
      }

      const res = await fetch(`/api/books/reports/daybook?${params}`);
      const data = await res.json();

      if (data.success) {
        setDayBookEntries(data.dayBookEntries);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch day book');
      }
    } catch (error) {
      toast.error('Failed to fetch day book');
    } finally {
      setLoading(false);
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

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 flex items-center">
        <BookMarked className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Day Book
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Complete record of all daily transactions</p>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ModernDateRangePicker
            label="Date Range"
            startValue={startDate}
            endValue={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            className="md:col-span-2"
          />

          <div>
            <AnimatedSelect
              id="voucher-type"
              label="Voucher Type"
              value={selectedType}
              onChange={(value) => setSelectedType(value)}
              options={[
                { value: 'All', label: 'All Types' },
                { value: 'Payment', label: 'Payment' },
                { value: 'Receipt', label: 'Receipt' },
                { value: 'Journal', label: 'Journal' },
                { value: 'Contra', label: 'Contra' },
                { value: 'Sales', label: 'Sales' },
                { value: 'Purchase', label: 'Purchase' }
              ]}
              placeholder="Select Voucher Type"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchDayBook}
              disabled={loading}
              className="w-full px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? 'Loading...' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Vouchers</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalVouchers}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Debit</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">₹{summary.totalDebit.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Credit</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">₹{summary.totalCredit.toFixed(2)}</div>
        </div>
      </div>

      {/* Day Book Entries */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {dayBookEntries.map((voucher, vIndex) => (
            <div key={voucher._id} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
              {/* Voucher Header */}
              <div className="bg-slate-50 dark:bg-gray-800/50 px-6 py-3 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900 dark:text-white">{voucher.voucherNumber}</span>
                  <span className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-slate-600 dark:text-slate-300 text-xs rounded font-medium">
                    {voucher.voucherType}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(voucher.date).toLocaleDateString('en-IN')}
                  </span>
                  {voucher.referenceNumber && (
                    <span className="text-sm text-slate-600 dark:text-slate-400">Ref: {voucher.referenceNumber}</span>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Amount: <span className="text-slate-900 dark:text-white">₹{voucher.totalDebit.toFixed(2)}</span>
                </div>
              </div>

              {/* Voucher Entries */}
              <table className="w-full">
                <tbody>
                  {voucher.entries.map((entry, eIndex) => (
                    <tr key={eIndex} className="hover:bg-slate-50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-2 text-sm w-1/3">
                        <div className="font-medium text-slate-900 dark:text-white">{entry.accountName}</div>
                        {entry.narration && (
                          <div className="text-xs text-slate-500 dark:text-slate-500 italic">{entry.narration}</div>
                        )}
                      </td>
                      <td className="px-6 py-2 text-sm text-slate-600 dark:text-slate-400">{entry.accountCode}</td>
                      <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300">
                        {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300">
                        {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {voucher.narration && (
                <div className="px-6 py-2 text-sm text-slate-500 dark:text-slate-500 italic bg-slate-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-medium">Narration:</span> {voucher.narration}
                </div>
              )}
            </div>
          ))}
        </div>

        {dayBookEntries.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No transactions found for the selected period</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}





















