'use client';

import { useState, useEffect } from 'react';
import { BarChart3, FileDown, Printer, Check, X, ArrowLeft, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
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

interface TrialBalanceProps {
  onBack?: () => void;
}

interface TrialBalanceEntry {
  _id: string;
  accountCode: string;
  accountName: string;
  accountGroup: string;
  accountType: string;
  debit: number;
  credit: number;
  balanceType: 'Dr' | 'Cr';
  balance: number;
}

interface GroupedEntries {
  Assets: TrialBalanceEntry[];
  Liabilities: TrialBalanceEntry[];
  Capital: TrialBalanceEntry[];
  Income: TrialBalanceEntry[];
  Expenses: TrialBalanceEntry[];
}

interface GroupTotals {
  Assets: { debit: number; credit: number };
  Liabilities: { debit: number; credit: number };
  Capital: { debit: number; credit: number };
  Income: { debit: number; credit: number };
  Expenses: { debit: number; credit: number };
}

export default function TrialBalance({ onBack }: TrialBalanceProps = {}) {
  const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries | null>(null);
  const [groupTotals, setGroupTotals] = useState<GroupTotals | null>(null);
  const [summary, setSummary] = useState({
    totalAccounts: 0,
    totalDebit: 0,
    totalCredit: 0,
    difference: 0,
    isBalanced: false,
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('list');
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ asOnDate });

      const res = await fetch(`/api/books/reports/trial-balance?${params}`);
      const data = await res.json();

      if (data.success) {
        setEntries(data.trialBalanceEntries);
        setGroupedEntries(data.groupedEntries);
        setGroupTotals(data.groupTotals);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch trial balance');
      }
    } catch (error) {
      toast.error('Failed to fetch trial balance');
    } finally {
      setLoading(false);
    }
  };

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Account Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Account Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Group
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Debit (₹)
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Credit (₹)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map(entry => (
            <tr key={entry._id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
              <td className="px-6 py-3 text-sm font-mono text-slate-900 dark:text-white">{entry.accountCode}</td>
              <td className="px-6 py-3 text-sm text-slate-900 dark:text-white">{entry.accountName}</td>
              <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{entry.accountGroup}</td>
              <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                {entry.debit > 0 ? entry.debit.toFixed(2) : '-'}
              </td>
              <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                {entry.credit > 0 ? entry.credit.toFixed(2) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <tr className="font-bold">
            <td colSpan={3} className="px-6 py-4 text-sm text-slate-900 dark:text-white">
              Grand Total:
            </td>
            <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-white">
              ₹{summary.totalDebit.toFixed(2)}
            </td>
            <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-white">
              ₹{summary.totalCredit.toFixed(2)}
            </td>
          </tr>
          {!summary.isBalanced && (
            <tr>
              <td colSpan={3} className="px-6 py-2 text-sm text-red-700 dark:text-red-400">
                Difference:
              </td>
              <td colSpan={2} className="px-6 py-2 text-sm text-right text-red-700 dark:text-red-400 font-bold">
                ₹{Math.abs(summary.difference).toFixed(2)}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );

  const renderGroupedView = () => {
    if (!groupedEntries || !groupTotals) return null;

    const groups: (keyof GroupedEntries)[] = ['Assets', 'Liabilities', 'Capital', 'Income', 'Expenses'];

    return (
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white px-6 py-3 font-bold border-b border-gray-200 dark:border-gray-700">
              {group}
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Code</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Account Name</th>
                  <th className="px-6 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Debit</th>
                  <th className="px-6 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {groupedEntries[group].map(entry => (
                  <tr key={entry._id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-2 text-sm font-mono text-slate-900 dark:text-white">{entry.accountCode}</td>
                    <td className="px-6 py-2 text-sm text-slate-900 dark:text-white">{entry.accountName}</td>
                    <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300">
                      {entry.debit > 0 ? entry.debit.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-2 text-sm text-right text-slate-700 dark:text-slate-300">
                      {entry.credit > 0 ? entry.credit.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-gray-800/50 font-bold border-t border-gray-200 dark:border-gray-700">
                <tr>
                  <td colSpan={2} className="px-6 py-2 text-sm text-slate-900 dark:text-white">
                    {group} Total:
                  </td>
                  <td className="px-6 py-2 text-sm text-right text-slate-900 dark:text-white">
                    ₹{groupTotals[group].debit.toFixed(2)}
                  </td>
                  <td className="px-6 py-2 text-sm text-right text-slate-900 dark:text-white">
                    ₹{groupTotals[group].credit.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

        {/* Grand Total */}
        <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-xl p-6 shadow-sm">
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
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 max-w-5xl"
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
        <BarChart3 className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Trial Balance
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Statement of all account balances</p>

      <div className="mb-6">

        {/* Filters & Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-end gap-4 flex-1">
              <ModernDatePicker
                label="As On Date"
                value={asOnDate}
                onChange={setAsOnDate}
                className="w-48"
              />
              <button
                onClick={fetchTrialBalance}
                disabled={loading}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 font-medium transition-all duration-200 hover:shadow-md whitespace-nowrap dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button
                onClick={() => setViewMode('list')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                  }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${viewMode === 'grouped'
                  ? 'bg-slate-900 text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                  }`}
              >
                Grouped View
              </button>
            </div>
          </div>
        </div>

        {/* Balance Status */}
        <div className="mb-6">
          <div className={`rounded-xl p-5 flex items-center justify-between shadow-sm ${summary.isBalanced
            ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
            <div className="flex items-center gap-4">
              {summary.isBalanced ? (
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Check className="w-6 h-6 text-green-700 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <X className="w-6 h-6 text-red-700 dark:text-red-400" />
                </div>
              )}
              <div>
                <div className={`font-bold text-lg ${summary.isBalanced ? 'text-slate-900 dark:text-white' : 'text-red-800 dark:text-red-300'}`}>
                  {summary.isBalanced ? 'Books are Balanced' : 'Books are NOT Balanced'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {summary.totalAccounts} accounts | As on {new Date(asOnDate).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>
            {!summary.isBalanced && (
              <div className="text-right bg-white dark:bg-red-900/10 rounded-lg p-3 border border-red-100 dark:border-red-800/50">
                <div className="text-sm text-red-700 dark:text-red-400 font-medium">Difference:</div>
                <div className="text-xl font-bold text-red-700 dark:text-red-400">
                  ₹{Math.abs(summary.difference).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                <BarChart3 className="w-7 h-7 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Trial Balance Report</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">As on {new Date(asOnDate).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? renderListView() : renderGroupedView()}

          {entries.length === 0 && (
            <div className="text-center py-16">
              <div className="p-4 bg-slate-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-slate-400 dark:text-slate-600" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">No accounts found for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}





















