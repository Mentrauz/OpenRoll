'use client';

import { useState, useEffect } from 'react';
import { Wallet, FileDown, ArrowLeft, Calendar } from 'lucide-react';
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

interface CashBookProps {
  onBack?: () => void;
}

interface CashBookEntry {
  _id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  particulars: string;
  referenceNumber?: string;
  chequeNumber?: string;
  narration: string;
  receipt: number;
  payment: number;
}

interface CashAccount {
  _id: string;
  accountCode: string;
  accountName: string;
  currentBalance: number;
  balanceType: string;
}

export default function CashBook({ onBack }: CashBookProps = {}) {
  const [cashBookEntries, setCashBookEntries] = useState<CashBookEntry[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today);
  const [summary, setSummary] = useState({
    totalVouchers: 0,
    totalReceipts: 0,
    totalPayments: 0,
    openingBalance: 0,
    closingBalance: 0,
  });

  useEffect(() => {
    fetchCashBook();
  }, []);

  const fetchCashBook = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const res = await fetch(`/api/books/reports/cashbook?${params}`);
      const data = await res.json();

      if (data.success) {
        setCashBookEntries(data.cashBookEntries);
        setCashAccounts(data.cashAccounts || []);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch cash book');
      }
    } catch (error) {
      toast.error('Failed to fetch cash book');
    } finally {
      setLoading(false);
    }
  };

  let runningBalance = summary.openingBalance;

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
        <Wallet className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Cash Book
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Complete record of all cash transactions</p>

      {/* Cash Accounts Summary */}
      {cashAccounts.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cash Accounts:</h3>
          <div className="flex flex-wrap gap-3">
            {cashAccounts.map(acc => (
              <div key={acc._id} className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{acc.accountName}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                  ({acc.accountCode})
                </span>
                <span className={`text-sm font-bold ml-2 ${acc.balanceType === 'Dr' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  ₹{acc.currentBalance.toFixed(2)} {acc.balanceType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              onClick={fetchCashBook}
              disabled={loading}
              className="w-full px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? 'Loading...' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Opening Balance</div>
          <div className={`text-2xl font-bold ${summary.openingBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
            ₹{Math.abs(summary.openingBalance).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Receipts</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">₹{summary.totalReceipts.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Payments</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">₹{summary.totalPayments.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Closing Balance</div>
          <div className={`text-2xl font-bold ${summary.closingBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
            ₹{Math.abs(summary.closingBalance).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Cash Book Entries */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Voucher No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Particulars</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Reference</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Receipt (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Payment (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Opening Balance Row */}
              <tr className="bg-slate-50/50 dark:bg-gray-800/30 font-semibold">
                <td colSpan={4} className="px-6 py-3 text-sm text-slate-900 dark:text-white">Opening Balance</td>
                <td className="px-6 py-3 text-sm text-right">-</td>
                <td className="px-6 py-3 text-sm text-right">-</td>
                <td className={`px-6 py-3 text-sm text-right font-bold ${summary.openingBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {Math.abs(summary.openingBalance).toFixed(2)}
                </td>
              </tr>

              {/* Transaction Rows */}
              {cashBookEntries.map((entry) => {
                runningBalance = runningBalance + entry.receipt - entry.payment;
                return (
                  <tr key={entry._id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono text-slate-900 dark:text-white">{entry.voucherNumber}</td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-white">
                      <div>{entry.particulars}</div>
                      {entry.narration && (
                        <div className="text-xs text-slate-500 dark:text-slate-500 italic">{entry.narration}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {entry.referenceNumber || entry.chequeNumber || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                      {entry.receipt > 0 ? entry.receipt.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                      {entry.payment > 0 ? entry.payment.toFixed(2) : '-'}
                    </td>
                    <td className={`px-6 py-3 text-sm text-right font-medium ${runningBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {Math.abs(runningBalance).toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Closing Balance Row */}
              <tr className="bg-slate-50 dark:bg-gray-800/50 font-bold border-t border-gray-200 dark:border-gray-700">
                <td colSpan={4} className="px-6 py-4 text-sm text-slate-900 dark:text-white">Closing Balance</td>
                <td className="px-6 py-4 text-sm text-right text-slate-700 dark:text-slate-300">
                  ₹{summary.totalReceipts.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-700 dark:text-slate-300">
                  ₹{summary.totalPayments.toFixed(2)}
                </td>
                <td className={`px-6 py-4 text-sm text-right ${summary.closingBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  ₹{Math.abs(summary.closingBalance).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {cashBookEntries.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No cash transactions found for the selected period</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}





















