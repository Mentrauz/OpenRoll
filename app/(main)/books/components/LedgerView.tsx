'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, FileDown, Printer, ArrowLeft, FileText } from 'lucide-react';
import LordIcon from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';
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

interface LedgerViewProps {
  onBack?: () => void;
}

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountGroup: string;
}

interface LedgerEntry {
  date: string;
  voucherNumber: string;
  voucherType: string;
  particulars: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'Dr' | 'Cr';
  voucherId: string;
}

interface LedgerSummary {
  openingBalance: number;
  openingBalanceType: 'Dr' | 'Cr';
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  closingBalanceType: 'Dr' | 'Cr';
}

export default function LedgerView({ onBack }: LedgerViewProps = {}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]); // April 1st
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Click outside handler to close account picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowAccountPicker(false);
        setSearchTerm('');
      }
    };

    if (showAccountPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountPicker]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/books/accounts?active=true');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      toast.error('Failed to fetch accounts');
    }
  };

  const fetchLedger = async () => {
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        accountId: selectedAccount._id,
        startDate,
        endDate,
      });

      const res = await fetch(`/api/books/reports/ledger?${params}`);
      const data = await res.json();

      if (data.success) {
        setLedgerEntries(data.ledgerEntries);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch ledger');
      }
    } catch (error) {
      toast.error('Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(
    acc =>
      acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <FileText className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Account Ledger
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">View detailed account statements and transaction history</p>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Select Account *
            </label>
            <div className="relative" ref={pickerRef}>
              <input
                type="text"
                value={selectedAccount?.accountName || ''}
                onFocus={() => setShowAccountPicker(true)}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 cursor-pointer"
                placeholder="Click to select account..."
              />
              {showAccountPicker && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-slate-900">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <LordIcon
                          icon={searchIcon}
                          size={16}
                          className="text-slate-400 dark:text-slate-600"
                          trigger="hover"
                        />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search accounts..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map(account => (
                        <button
                          key={account._id}
                          type="button"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowAccountPicker(false);
                            setSearchTerm('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-900 dark:text-white"
                        >
                          <div className="font-medium text-sm">{account.accountName}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {account.accountCode} - {account.accountGroup}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                        No accounts found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <ModernDateRangePicker
            label="Date Range"
            startValue={startDate}
            endValue={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            className="md:col-span-2"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchLedger}
            disabled={!selectedAccount || loading}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {loading ? 'Loading...' : 'Show Ledger'}
          </button>
        </div>
      </div>

      {/* Ledger Display */}
      {summary && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-1">{selectedAccount?.accountName}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {selectedAccount?.accountCode} - {selectedAccount?.accountGroup}
            </p>
            <div className="mt-3 flex gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-500">Period:</span>{' '}
                <span className="font-medium">
                  {new Date(startDate).toLocaleDateString('en-IN')} to{' '}
                  {new Date(endDate).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          <div className="bg-slate-50 dark:bg-gray-800/50 px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400">Opening Balance:</span>
            <span className={`font-bold ${summary.openingBalanceType === 'Dr' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
              ₹{summary.openingBalance.toFixed(2)} {summary.openingBalanceType}
            </span>
          </div>

          {/* Transactions */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Voucher No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Particulars</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Narration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Debit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Credit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ledgerEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {entry.voucherNumber}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-white">{entry.particulars}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{entry.narration}</td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300">
                      {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700 dark:text-slate-300">
                      {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-medium">
                      <span className={entry.balanceType === 'Dr' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}>
                        ₹{entry.balance.toFixed(2)} {entry.balanceType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-gray-800 font-bold border-t-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-sm text-slate-900 dark:text-white">
                    Totals:
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-slate-900 dark:text-white">
                    ₹{summary.totalDebit.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-slate-900 dark:text-white">
                    ₹{summary.totalCredit.toFixed(2)}
                  </td>
                  <td className="px-6 py-3"></td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-6 py-3 text-right text-sm text-slate-900 dark:text-white">
                    Closing Balance:
                  </td>
                  <td className="px-6 py-3 text-right text-sm">
                    <span className={summary.closingBalanceType === 'Dr' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}>
                      ₹{summary.closingBalance.toFixed(2)} {summary.closingBalanceType}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {ledgerEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No transactions found for the selected period</p>
            </div>
          )}
        </div>
      )}

      {!summary && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Select an account and date range to view ledger</p>
        </div>
      )}
    </motion.div>
  );
}





















