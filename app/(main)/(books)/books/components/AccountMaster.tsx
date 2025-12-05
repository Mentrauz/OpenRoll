'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Check, Building2, ArrowLeft } from 'lucide-react';
import LordIcon, { LordIconRef } from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../../public/icons/search.json';
import { toast } from 'react-hot-toast';
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

interface AccountMasterProps {
  onBack?: () => void;
}

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountGroup: string;
  accountType: string;
  openingBalance: number;
  openingBalanceType: 'Dr' | 'Cr';
  currentBalance: number;
  balanceType: 'Dr' | 'Cr';
  isActive: boolean;
  description?: string;
}

const ACCOUNT_GROUPS = ['Assets', 'Liabilities', 'Income', 'Expenses', 'Capital'];

const ACCOUNT_TYPES: Record<string, string[]> = {
  Assets: ['Bank Account', 'Cash', 'Sundry Debtors', 'Fixed Assets', 'Current Assets'],
  Liabilities: ['Sundry Creditors', 'Current Liabilities', 'Loans', 'Provisions'],
  Income: ['Direct Income', 'Indirect Income'],
  Expenses: ['Direct Expenses', 'Indirect Expenses'],
  Capital: ['Capital Account'],
};

export default function AccountMaster({ onBack }: AccountMasterProps = {}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const searchIconRef = useRef<LordIconRef>(null);

  // Form state
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountGroup: 'Assets',
    accountType: 'Bank Account',
    openingBalance: 0,
    openingBalanceType: 'Dr' as 'Dr' | 'Cr',
    description: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedGroup]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/books/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      toast.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (selectedGroup !== 'All') {
      filtered = filtered.filter(acc => acc.accountGroup === selectedGroup);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        acc =>
          acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          acc.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAccounts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const url = editingAccount ? '/api/books/accounts' : '/api/books/accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const body = editingAccount
        ? { _id: editingAccount._id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingAccount ? 'Account updated successfully' : 'Account created successfully');
        setShowForm(false);
        setEditingAccount(null);
        resetForm();
        fetchAccounts();
      } else {
        toast.error(data.message || 'Failed to save account');
      }
    } catch (error) {
      toast.error('Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountGroup: account.accountGroup,
      accountType: account.accountType,
      openingBalance: account.openingBalance,
      openingBalanceType: account.openingBalanceType,
      description: account.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this account?')) return;

    try {
      const res = await fetch(`/api/books/accounts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Account deactivated successfully');
        fetchAccounts();
      } else {
        toast.error(data.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const resetForm = () => {
    setFormData({
      accountCode: '',
      accountName: '',
      accountGroup: 'Assets',
      accountType: 'Bank Account',
      openingBalance: 0,
      openingBalanceType: 'Dr',
      description: '',
    });
  };

  if (showForm) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingAccount ? 'Edit Account' : 'Create New Account'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-slate-600 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Account Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountCode}
                    onChange={e => setFormData({ ...formData, accountCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    placeholder="e.g., 1001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountName}
                    onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    placeholder="e.g., HDFC Bank"
                  />
                </div>

                <div>
                  <AnimatedSelect
                    id="account-group"
                    label="Account Group"
                    value={formData.accountGroup}
                    onChange={(value) => {
                      setFormData({
                        ...formData,
                        accountGroup: value,
                        accountType: ACCOUNT_TYPES[value][0],
                      });
                    }}
                    options={ACCOUNT_GROUPS.map(group => ({
                      value: group,
                      label: group
                    }))}
                    placeholder="Select Account Group"
                    required
                  />
                </div>

                <div>
                  <AnimatedSelect
                    id="account-type"
                    label="Account Type"
                    value={formData.accountType}
                    onChange={(value) => setFormData({ ...formData, accountType: value })}
                    options={ACCOUNT_TYPES[formData.accountGroup].map(type => ({
                      value: type,
                      label: type
                    }))}
                    placeholder="Select Account Type"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.openingBalance}
                    onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>

                <div>
                  <AnimatedSelect
                    id="balance-type"
                    label="Balance Type"
                    value={formData.openingBalanceType}
                    onChange={(value) => setFormData({ ...formData, openingBalanceType: value as 'Dr' | 'Cr' })}
                    options={[
                      { value: 'Dr', label: 'Debit (Dr)' },
                      { value: 'Cr', label: 'Credit (Cr)' }
                    ]}
                    placeholder="Select Balance Type"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  rows={3}
                  placeholder="Additional notes about this account..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
        <Building2 className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Account Master
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Create and manage ledger accounts</p>

      <div className="flex items-center justify-between mb-6">
        <div></div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="relative"
            onMouseEnter={() => searchIconRef.current?.playAnimation()}
            onMouseLeave={() => searchIconRef.current?.goToFirstFrame()}
          >
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <LordIcon
                ref={searchIconRef}
                icon={searchIcon}
                size={16}
                className="text-slate-400 dark:text-slate-600"
                trigger="manual"
              />
            </div>
            <input
              type="text"
              placeholder="Search by account name or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <AnimatedSelect
              id="filter-group"
              label=""
              value={selectedGroup}
              onChange={(value) => setSelectedGroup(value)}
              options={[
                { value: 'All', label: 'All Groups' },
                ...ACCOUNT_GROUPS.map(group => ({
                  value: group,
                  label: group
                }))
              ]}
              placeholder="Filter by Group"
            />
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Current Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAccounts.map(account => (
                <tr key={account._id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    {account.accountCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                    {account.accountName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {account.accountGroup}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {account.accountType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={account.balanceType === 'Dr' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}>
                      ₹{account.currentBalance.toFixed(2)} {account.balanceType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleEdit(account)}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mr-3"
                    >
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(account._id)}
                      className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No accounts found</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredAccounts.length} of {accounts.length} accounts
      </div>
    </motion.div>
  );
}





















