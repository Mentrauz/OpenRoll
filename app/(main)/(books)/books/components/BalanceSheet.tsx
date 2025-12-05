'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, TrendingUp, TrendingDown, Check, X, ArrowLeft } from 'lucide-react';
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

interface BalanceSheetProps {
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

export default function BalanceSheet({ onBack }: BalanceSheetProps = {}) {
  const [assets, setAssets] = useState<GroupedAccounts>({});
  const [liabilities, setLiabilities] = useState<GroupedAccounts>({});
  const [capital, setCapital] = useState<AccountEntry[]>([]);
  const [assetTypeTotals, setAssetTypeTotals] = useState<any>({});
  const [liabilityTypeTotals, setLiabilityTypeTotals] = useState<any>({});
  const [profitLoss, setProfitLoss] = useState({ amount: 0, isProfit: true });
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalCapital: 0,
    netProfitLoss: 0,
    isProfit: true,
    totalLiabilitiesAndCapital: 0,
    isBalanced: false,
    difference: 0,
  });
  const [loading, setLoading] = useState(false);
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ asOnDate });

      const res = await fetch(`/api/books/reports/balance-sheet?${params}`);
      const data = await res.json();

      if (data.success) {
        setAssets(data.assets);
        setLiabilities(data.liabilities);
        setCapital(data.capital);
        setAssetTypeTotals(data.assetTypeTotals);
        setLiabilityTypeTotals(data.liabilityTypeTotals);
        setProfitLoss(data.profitLoss);
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to fetch balance sheet');
      }
    } catch (error) {
      toast.error('Failed to fetch balance sheet');
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
        <FileSpreadsheet className="w-6 h-6 mr-2 text-slate-700 dark:text-slate-300" />
        Balance Sheet
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 ml-8">Statement of assets and liabilities</p>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-end gap-4">
          <ModernDatePicker
            label="As On Date"
            value={asOnDate}
            onChange={setAsOnDate}
            className="w-64"
          />
          <button
            onClick={fetchBalanceSheet}
            disabled={loading}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Balance Status */}
      <div className={`rounded-xl p-5 mb-6 flex items-center justify-between shadow-sm ${summary.isBalanced
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
              {summary.isBalanced ? 'Balance Sheet is Balanced' : 'Balance Sheet is NOT Balanced'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              As on {new Date(asOnDate).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>
        {!summary.isBalanced && (
          <div className="text-right bg-white dark:bg-red-900/10 rounded-lg p-3 border border-red-100 dark:border-red-800/50">
            <div className="text-sm text-red-700 dark:text-red-400 font-medium">Difference:</div>
            <div className="text-xl font-bold text-red-700 dark:text-red-400">
              ₹{summary.difference.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liabilities & Capital Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold">Liabilities & Capital</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Capital Section */}
            {capital.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Capital
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {capital.map(acc => {
                    const amount = acc.balanceType === 'Cr' ? acc.balance : -acc.balance;
                    return (
                      <div key={acc._id} className="px-4 py-2 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.accountName}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{acc.accountCode}</div>
                        </div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          ₹{Math.abs(amount).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 flex justify-between items-center font-bold border-t border-gray-200 dark:border-gray-700">
                  <span className="text-slate-900 dark:text-white">Capital Total</span>
                  <span className="text-slate-700 dark:text-slate-300">₹{summary.totalCapital.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Profit/Loss */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className={`px-4 py-2 font-semibold border-b border-gray-200 dark:border-gray-700 ${profitLoss.isProfit
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                }`}>
                {profitLoss.isProfit ? 'Net Profit' : 'Net Loss'}
              </div>
              <div className="px-4 py-3 flex justify-between items-center bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  {profitLoss.isProfit ? (
                    <TrendingUp className="w-5 h-5 text-green-700 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-700 dark:text-red-400" />
                  )}
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Period</span>
                </div>
                <div className={`text-sm font-bold ${profitLoss.isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                  ₹{profitLoss.amount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Liabilities */}
            {Object.keys(liabilities).length > 0 && Object.keys(liabilities).map(type => (
              <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  {type}
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {liabilities[type].map(acc => {
                    const amount = acc.balanceType === 'Cr' ? acc.balance : -acc.balance;
                    return (
                      <div key={acc._id} className="px-4 py-2 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.accountName}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{acc.accountCode}</div>
                        </div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          ₹{Math.abs(amount).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 flex justify-between items-center font-bold border-t border-gray-200 dark:border-gray-700">
                  <span className="text-slate-900 dark:text-white">Subtotal</span>
                  <span className="text-slate-700 dark:text-slate-300">₹{liabilityTypeTotals[type]?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            ))}

            {Object.keys(liabilities).length === 0 && capital.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">No liabilities or capital found</p>
              </div>
            )}
          </div>

          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white px-4 py-3 flex justify-between items-center font-bold text-lg border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span>₹{summary.totalLiabilitiesAndCapital.toFixed(2)}</span>
          </div>
        </div>

        {/* Assets Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold">Assets</h3>
          </div>

          <div className="p-4 space-y-4">
            {Object.keys(assets).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">No assets found</p>
              </div>
            ) : (
              Object.keys(assets).map(type => (
                <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    {type}
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assets[type].map(acc => {
                      const amount = acc.balanceType === 'Dr' ? acc.balance : -acc.balance;
                      return (
                        <div key={acc._id} className="px-4 py-2 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-800/50">
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.accountName}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{acc.accountCode}</div>
                          </div>
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            ₹{Math.abs(amount).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-2 flex justify-between items-center font-bold border-t border-gray-200 dark:border-gray-700">
                    <span className="text-slate-900 dark:text-white">Subtotal</span>
                    <span className="text-slate-700 dark:text-slate-300">₹{assetTypeTotals[type]?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white px-4 py-3 flex justify-between items-center font-bold text-lg border-t border-gray-200 dark:border-gray-700">
            <span>Total Assets</span>
            <span>₹{summary.totalAssets.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}





















