'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Receipt } from 'lucide-react';
import LordIcon from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';
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

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountGroup: string;
}

interface VoucherEntryLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  narration: string;
}

interface VoucherEntryProps {
  voucherType: 'Payment' | 'Receipt' | 'Journal' | 'Contra';
  onBack: () => void;
}

export default function VoucherEntry({ voucherType, onBack }: VoucherEntryProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<VoucherEntryLine[]>([
    { id: '1', accountId: '', accountName: '', debit: 0, credit: 0, narration: '' },
    { id: '2', accountId: '', accountName: '', debit: 0, credit: 0, narration: '' },
  ]);
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Click outside handler to close account picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowAccountPicker(null);
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

  const addEntry = () => {
    setEntries([
      ...entries,
      { id: Date.now().toString(), accountId: '', accountName: '', debit: 0, credit: 0, narration: '' },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 2) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof VoucherEntryLine, value: any) => {
    setEntries(
      entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const selectAccount = (entryId: string, account: Account) => {
    updateEntry(entryId, 'accountId', account._id);
    updateEntry(entryId, 'accountName', account.accountName);
    setShowAccountPicker(null);
    setSearchTerm('');
  };

  const calculateTotals = () => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { totalDebit, totalCredit, difference } = calculateTotals();

    if (Math.abs(difference) > 0.01) {
      toast.error('Debit and Credit must be equal!');
      return;
    }

    if (totalDebit === 0 || totalCredit === 0) {
      toast.error('Please enter valid amounts');
      return;
    }

    const validEntries = entries.filter(e => e.accountId && (e.debit > 0 || e.credit > 0));

    if (validEntries.length < 2) {
      toast.error('At least 2 entries are required');
      return;
    }

    try {
      setLoading(true);

      // Get user info from session
      let createdBy = 'System';
      try {
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('sessionUser='));
        if (sessionCookie) {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          createdBy = sessionData.id || 'System';
        }
      } catch (error) {
        console.error('Error getting user session:', error);
      }

      const res = await fetch('/api/books/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherType,
          voucherDate,
          entries: validEntries.map(e => ({
            accountId: e.accountId,
            debit: e.debit,
            credit: e.credit,
            narration: e.narration,
          })),
          narration,
          referenceNumber,
          chequeNumber: voucherType === 'Payment' ? chequeNumber : '',
          chequeDate: voucherType === 'Payment' && chequeDate ? chequeDate : null,
          createdBy,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${voucherType} voucher created successfully! Voucher No: ${data.voucher.voucherNumber}`);
        resetForm();
      } else {
        toast.error(data.message || 'Failed to create voucher');
      }
    } catch (error) {
      toast.error('Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEntries([
      { id: '1', accountId: '', accountName: '', debit: 0, credit: 0, narration: '' },
      { id: '2', accountId: '', accountName: '', debit: 0, credit: 0, narration: '' },
    ]);
    setNarration('');
    setReferenceNumber('');
    setChequeNumber('');
    setChequeDate('');
  };

  const { totalDebit, totalCredit, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

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
        <Receipt className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        {voucherType} Voucher Entry
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Record financial transactions using double-entry bookkeeping</p>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ModernDatePicker
              label="Voucher Date"
              value={voucherDate}
              onChange={setVoucherDate}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Optional"
              />
            </div>

            {voucherType === 'Payment' && (
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Cheque Number
                </label>
                <input
                  type="text"
                  value={chequeNumber}
                  onChange={e => setChequeNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          {/* Entries Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                    Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                    Narration
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase w-32">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase w-32">
                    Credit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase w-16">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">
                      <div className="relative" ref={showAccountPicker === entry.id ? pickerRef : null}>
                        <input
                          type="text"
                          value={entry.accountName}
                          onFocus={() => setShowAccountPicker(entry.id)}
                          onChange={e => updateEntry(entry.id, 'accountName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                          placeholder="Select account..."
                          required
                        />
                        {showAccountPicker === entry.id && (
                          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-slate-900">
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search accounts..."
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                                autoFocus
                              />
                            </div>
                            {filteredAccounts.length > 0 ? (
                              filteredAccounts.map(account => (
                                <button
                                  key={account._id}
                                  type="button"
                                  onClick={() => selectAccount(entry.id, account)}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-gray-700 text-sm text-slate-900 dark:text-white"
                                >
                                  <div className="font-medium">{account.accountName}</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400">
                                    {account.accountCode} - {account.accountGroup}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                                No accounts found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={entry.narration}
                        onChange={e => updateEntry(entry.id, 'narration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        placeholder="Description..."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.debit || ''}
                        onChange={e => updateEntry(entry.id, 'debit', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.credit || ''}
                        onChange={e => updateEntry(entry.id, 'credit', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        disabled={entries.length <= 2}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-gray-800 font-medium border-t border-gray-200 dark:border-gray-700">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>
                    <button
                      type="button"
                      onClick={addEntry}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Line
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-900 dark:text-white">₹{totalDebit.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-900 dark:text-white">₹{totalCredit.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
                <tr>
                  <td className="px-4 py-3" colSpan={2}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Balance Check:</span>
                      {isBalanced ? (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Balanced</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                          ✗ Difference: ₹{Math.abs(difference).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white" colSpan={3}>
                    Total: ₹{Math.max(totalDebit, totalCredit).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Overall Narration
            </label>
            <textarea
              value={narration}
              onChange={e => setNarration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              rows={2}
              placeholder="General description for this voucher..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-400"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading || !isBalanced}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Voucher'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}





















