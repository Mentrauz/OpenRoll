'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, FileDown, Printer, Calendar, ArrowLeft } from 'lucide-react';
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

interface ProfitLossProps {
  onBack?: () => void;
}

interface AccountEntry {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
  balanceType: string;
}

interface GroupedAccounts {
  [key: string]: AccountEntry[];
}

export default function ProfitLoss({ onBack }: ProfitLossProps = {}) {
  const [incomeAccounts, setIncomeAccounts] = useState<GroupedAccounts>({});
  const [expenseAccounts, setExpenseAccounts] = useState<GroupedAccounts>({});
  const [incomeTypeTotals, setIncomeTypeTotals] = useState<any>({});
  const [expenseTypeTotals, setExpenseTypeTotals] = useState<any>({});
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netResult: 0,
    isProfit: true,
    profitPercentage: 0,
  });
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    fetchProfitLoss();
  }, []);

  const fetchProfitLoss = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        fromDate,
        toDate,
      });

      const res = await fetch(`/api/books/reports/profit-loss?${params}`);
      const data = await res.json();

      if (data.success) {
        setIncomeAccounts(data.incomeAccounts);
        setExpenseAccounts(data.expenseAccounts);
        setIncomeTypeTotals(data.incomeTypeTotals);
        setExpenseTypeTotals(data.expenseTypeTotals);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch profit & loss');
      }
    } catch (error) {
      toast.error('Failed to fetch profit & loss');
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
        {summary.isProfit ? (
          <TrendingUp className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown className="w-6 h-6 mr-2 text-red-600 dark:text-red-400" />
        )}
        Profit & Loss Statement
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Income vs Expenses analysis</p>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModernDateRangePicker
            label="Period"
            startValue={fromDate}
            endValue={toDate}
            onStartChange={setFromDate}
            onEndChange={setToDate}
            className="md:col-span-2"
          />

          <div className="flex items-end">
            <button
              onClick={fetchProfitLoss}
              disabled={loading}
              className="w-full px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className={`rounded-xl p-6 mb-6 border ${summary.isProfit
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
        }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Income</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              ₹{summary.totalIncome.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              ₹{summary.totalExpenses.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {summary.isProfit ? 'Net Profit' : 'Net Loss'}
            </div>
            <div className={`text-3xl font-bold ${summary.isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
              ₹{summary.netResult.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Profit Margin</div>
            <div className={`text-2xl font-bold ${summary.isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
              {summary.profitPercentage.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              Income
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {Object.keys(incomeAccounts).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">No income accounts found</p>
              </div>
            ) : (
              Object.keys(incomeAccounts).map(type => (
                <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    {type}
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {incomeAccounts[type].map(acc => {
                      const amount = acc.balanceType === 'Cr' ? acc.balance : -acc.balance;
                      return (
                        <div key={acc._id} className="px-4 py-2 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-800/50">
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.accountName}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{acc.accountCode}</div>
                          </div>
                          <div className="text-sm font-bold text-green-700 dark:text-green-400">
                            ₹{Math.abs(amount).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 flex justify-between items-center font-bold border-t border-gray-200 dark:border-gray-700">
                    <span className="text-slate-900 dark:text-white">Subtotal</span>
                    <span className="text-green-700 dark:text-green-400">₹{incomeTypeTotals[type]?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white px-4 py-3 flex justify-between items-center font-bold text-lg border-t border-gray-200 dark:border-gray-700">
            <span>Total Income</span>
            <span className="text-green-700 dark:text-green-400">₹{summary.totalIncome.toFixed(2)}</span>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              Expenses
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {Object.keys(expenseAccounts).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">No expense accounts found</p>
              </div>
            ) : (
              Object.keys(expenseAccounts).map(type => (
                <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    {type}
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {expenseAccounts[type].map(acc => {
                      const amount = acc.balanceType === 'Dr' ? acc.balance : -acc.balance;
                      return (
                        <div key={acc._id} className="px-4 py-2 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-800/50">
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.accountName}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{acc.accountCode}</div>
                          </div>
                          <div className="text-sm font-bold text-red-700 dark:text-red-400">
                            ₹{Math.abs(amount).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 flex justify-between items-center font-bold border-t border-gray-200 dark:border-gray-700">
                    <span className="text-slate-900 dark:text-white">Subtotal</span>
                    <span className="text-red-700 dark:text-red-400">₹{expenseTypeTotals[type]?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white px-4 py-3 flex justify-between items-center font-bold text-lg border-t border-gray-200 dark:border-gray-700">
            <span>Total Expenses</span>
            <span className="text-red-700 dark:text-red-400">₹{summary.totalExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Net Result Footer */}
      <div className={`rounded-xl p-6 mt-6 border ${summary.isProfit
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
        }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {summary.isProfit ? (
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
            <div>
              <div className="text-sm opacity-90 font-medium">
                For the period {new Date(fromDate).toLocaleDateString('en-IN')} to {new Date(toDate).toLocaleDateString('en-IN')}
              </div>
              <div className="text-2xl font-bold">
                {summary.isProfit ? 'Net Profit' : 'Net Loss'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              ₹{summary.netResult.toFixed(2)}
            </div>
            <div className="text-sm opacity-90 font-medium">
              {summary.profitPercentage.toFixed(2)}% of Income
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}





















