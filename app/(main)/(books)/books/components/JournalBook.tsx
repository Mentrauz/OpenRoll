'use client';

import { useState, useEffect } from 'react';
import { FileText, FileDown, ArrowLeft, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
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

interface JournalBookProps {
  onBack?: () => void;
}

interface JournalBookEntry {
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
}

export default function JournalBook({ onBack }: JournalBookProps = {}) {
  const [journalBookEntries, setJournalBookEntries] = useState<JournalBookEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today);
  const [summary, setSummary] = useState({ totalJournals: 0, totalDebit: 0, totalCredit: 0 });

  useEffect(() => {
    fetchJournalBook();
  }, []);

  const fetchJournalBook = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const res = await fetch(`/api/books/reports/journalbook?${params}`);
      const data = await res.json();

      if (data.success) {
        setJournalBookEntries(data.journalBookEntries);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch journal book');
      }
    } catch (error) {
      toast.error('Failed to fetch journal book');
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
        <FileText className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Journal Book
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Record of all journal entries</p>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModernDateRangePicker
            label="Date Range"
            startValue={startDate}
            endValue={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            className="md:col-span-2"
          />

          <div className="flex items-end">
            <button
              onClick={fetchJournalBook}
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
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Journals</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalJournals}</div>
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

      {/* Journal Book Entries */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {journalBookEntries.map((voucher, vIndex) => (
            <div key={voucher._id} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
              {/* Voucher Header */}
              <div className="bg-slate-50 dark:bg-gray-800/50 px-6 py-3 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900 dark:text-white">{voucher.voucherNumber}</span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded font-medium">
                    Journal Entry
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
                <thead className="bg-slate-100 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Account</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Code</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Narration</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Debit</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {voucher.entries.map((entry, eIndex) => (
                    <tr key={eIndex} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-2 text-sm font-medium text-slate-900 dark:text-white">{entry.accountName}</td>
                      <td className="px-6 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">{entry.accountCode}</td>
                      <td className="px-6 py-2 text-sm text-slate-600 dark:text-slate-400 italic">{entry.narration || '-'}</td>
                      <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                        {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                        {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Journal Totals */}
                  <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-gray-200 dark:border-gray-600">
                    <td colSpan={3} className="px-6 py-2 text-sm text-slate-900 dark:text-white">Total:</td>
                    <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300">
                      ₹{voucher.totalDebit.toFixed(2)}
                    </td>
                    <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300">
                      ₹{voucher.totalCredit.toFixed(2)}
                    </td>
                  </tr>
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

        {journalBookEntries.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No journal entries found for the selected period</p>
          </div>
        )}
      </div>

      {/* Grand Total */}
      {journalBookEntries.length > 0 && (
        <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-lg p-4 mt-6 border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Grand Total:</span>
            <div className="flex gap-8">
              <div>
                <span className="text-sm opacity-75">Total Debit: </span>
                <span className="text-xl font-bold">₹{summary.totalDebit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-sm opacity-75">Total Credit: </span>
                <span className="text-xl font-bold">₹{summary.totalCredit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
