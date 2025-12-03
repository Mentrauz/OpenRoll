'use client';

import { useState, useEffect } from 'react';
import { Building2, FileDown, ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ModernDateRangePicker from '@/components/ModernDateRangePicker';
import AnimatedSelect from '@/components/AnimatedSelect';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import motion components
const motion = {
  div: dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
    ssr: false,
    loading: () => <div />
  })
};

interface BankBookProps {
  onBack?: () => void;
}

interface BankBookEntry {
  _id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  bankAccount: string;
  particulars: string;
  referenceNumber?: string;
  chequeNumber?: string;
  chequeDate?: string;
  narration: string;
  deposit: number;
  withdrawal: number;
  isReconciled: boolean;
}

interface BankAccount {
  _id: string;
  accountCode: string;
  accountName: string;
  currentBalance: number;
  balanceType: string;
}

export default function BankBook({ onBack }: BankBookProps = {}) {
  const [bankBookEntries, setBankBookEntries] = useState<BankBookEntry[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('All');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today);
  const [summary, setSummary] = useState({
    totalVouchers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    openingBalance: 0,
    closingBalance: 0,
  });

  useEffect(() => {
    fetchBankBook();
  }, []);

  const fetchBankBook = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      if (selectedAccount !== 'All') {
        params.append('accountId', selectedAccount);
      }

      const res = await fetch(`/api/books/reports/bankbook?${params}`);
      const data = await res.json();

      if (data.success) {
        setBankBookEntries(data.bankBookEntries);
        setBankAccounts(data.bankAccounts || []);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch bank book');
      }
    } catch (error) {
      toast.error('Failed to fetch bank book');
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
        <Building2 className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Bank Book
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Complete record of all bank transactions</p>

      {/* Bank Accounts Summary */}
      {bankAccounts.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Bank Accounts:</h3>
          <div className="flex flex-wrap gap-3">
            {bankAccounts.map(acc => (
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
              id="bank-account"
              label="Bank Account"
              value={selectedAccount}
              onChange={(value) => setSelectedAccount(value)}
              options={[
                { value: 'All', label: 'All Bank Accounts' },
                ...bankAccounts.map(acc => ({
                  value: acc._id,
                  label: `${acc.accountName} (${acc.accountCode})`
                }))
              ]}
              placeholder="Select Bank Account"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchBankBook}
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
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Deposits</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">₹{summary.totalDeposits.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Withdrawals</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">₹{summary.totalWithdrawals.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Closing Balance</div>
          <div className={`text-2xl font-bold ${summary.closingBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
            ₹{Math.abs(summary.closingBalance).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Bank Book Entries */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Voucher No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Particulars</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Cheque/Ref</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Deposit (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Withdrawal (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Balance (₹)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Status</th>
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
                <td className="px-6 py-3"></td>
              </tr>

              {/* Transaction Rows */}
              {bankBookEntries.map((entry) => {
                runningBalance = runningBalance + entry.deposit - entry.withdrawal;
                return (
                  <tr key={entry._id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono text-slate-900 dark:text-white">{entry.voucherNumber}</td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-white">
                      <div className="font-medium">{entry.particulars}</div>
                      {entry.narration && (
                        <div className="text-xs text-slate-500 dark:text-slate-500 italic">{entry.narration}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {entry.chequeNumber ? (
                        <div>
                          <div className="font-medium">{entry.chequeNumber}</div>
                          {entry.chequeDate && (
                            <div className="text-xs">{new Date(entry.chequeDate).toLocaleDateString('en-IN')}</div>
                          )}
                        </div>
                      ) : (entry.referenceNumber || '-')}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                      {entry.deposit > 0 ? entry.deposit.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300 font-medium">
                      {entry.withdrawal > 0 ? entry.withdrawal.toFixed(2) : '-'}
                    </td>
                    <td className={`px-6 py-3 text-sm text-right font-medium ${runningBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {Math.abs(runningBalance).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {entry.isReconciled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Closing Balance Row */}
              <tr className="bg-slate-50 dark:bg-gray-800/50 font-bold border-t border-gray-200 dark:border-gray-700">
                <td colSpan={4} className="px-6 py-4 text-sm text-slate-900 dark:text-white">Closing Balance</td>
                <td className="px-6 py-4 text-sm text-right text-slate-700 dark:text-slate-300">
                  ₹{summary.totalDeposits.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-700 dark:text-slate-300">
                  ₹{summary.totalWithdrawals.toFixed(2)}
                </td>
                <td className={`px-6 py-4 text-sm text-right ${summary.closingBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  ₹{Math.abs(summary.closingBalance).toFixed(2)}
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {bankBookEntries.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No bank transactions found for the selected period</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
