'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Receipt,
  BarChart3,
  PlusCircle,
  Search,
  ArrowRightLeft,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  BookMarked,
  Activity,
  CheckCircle,
  Grid3x3,
  Download,
  TrendingDown,
  Users
} from 'lucide-react';
import React from 'react';
import dynamic from 'next/dynamic';
import TempoMetricCard from '@/components/dashboard/TempoMetricCard';

// Dynamically import motion components
const motion = {
  div: dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
    ssr: false,
    loading: () => <div />
  }),
  main: dynamic(() => import('framer-motion').then(mod => mod.motion.main), {
    ssr: false,
    loading: () => <main />
  })
};

const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), {
  ssr: false
});

// Import components
import AccountMaster from './components/AccountMaster';
import VoucherEntry from './components/VoucherEntry';
import LedgerView from './components/LedgerView';
import DayBook from './components/DayBook';
import TrialBalance from './components/TrialBalance';
import CashBook from './components/CashBook';
import BankBook from './components/BankBook';
import JournalBook from './components/JournalBook';
import ProfitLoss from './components/ProfitLoss';
import BalanceSheet from './components/BalanceSheet';
import FinancialYear from './components/FinancialYear';

type ViewType =
  | 'dashboard'
  | 'accounts'
  | 'voucher-payment'
  | 'voucher-receipt'
  | 'voucher-journal'
  | 'voucher-contra'
  | 'ledger'
  | 'daybook'
  | 'cashbook'
  | 'bankbook'
  | 'journalbook'
  | 'trial-balance'
  | 'profit-loss'
  | 'balance-sheet'
  | 'financial-year';

interface BooksStats {
  totalAccounts: number;
  activeVouchers: number;
  totalTransactions: number;
  accuracyRate: number;
}

export default function BooksPage() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [stats, setStats] = useState<BooksStats>({
    totalAccounts: 0,
    activeVouchers: 0,
    totalTransactions: 0,
    accuracyRate: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/books/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching books stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'accounts':
        return <AccountMaster onBack={() => setCurrentView('dashboard')} />;
      case 'voucher-payment':
        return <VoucherEntry voucherType="Payment" onBack={() => setCurrentView('dashboard')} />;
      case 'voucher-receipt':
        return <VoucherEntry voucherType="Receipt" onBack={() => setCurrentView('dashboard')} />;
      case 'voucher-journal':
        return <VoucherEntry voucherType="Journal" onBack={() => setCurrentView('dashboard')} />;
      case 'voucher-contra':
        return <VoucherEntry voucherType="Contra" onBack={() => setCurrentView('dashboard')} />;
      case 'ledger':
        return <LedgerView onBack={() => setCurrentView('dashboard')} />;
      case 'daybook':
        return <DayBook onBack={() => setCurrentView('dashboard')} />;
      case 'cashbook':
        return <CashBook onBack={() => setCurrentView('dashboard')} />;
      case 'bankbook':
        return <BankBook onBack={() => setCurrentView('dashboard')} />;
      case 'journalbook':
        return <JournalBook onBack={() => setCurrentView('dashboard')} />;
      case 'trial-balance':
        return <TrialBalance onBack={() => setCurrentView('dashboard')} />;
      case 'profit-loss':
        return <ProfitLoss onBack={() => setCurrentView('dashboard')} />;
      case 'balance-sheet':
        return <BalanceSheet onBack={() => setCurrentView('dashboard')} />;
      case 'financial-year':
        return <FinancialYear onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard onNavigate={setCurrentView} stats={stats} statsLoading={statsLoading} />;
    }
  };

  const isVoucherView = currentView.startsWith('voucher-');
  const isReportView = ['trial-balance', 'profit-loss', 'balance-sheet'].includes(currentView);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-full">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Title - Left Side */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Books of Accounts</h1>
          </div>

          {/* Search Box - Right Side */}
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search accounts..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Header with Tabs and Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-5">
          {/* Left Side - Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentView === 'dashboard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('accounts')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentView === 'accounts'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
              Accounts
            </button>
            <button
              onClick={() => setCurrentView('voucher-payment')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isVoucherView
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
              Vouchers
            </button>
            <button
              onClick={() => setCurrentView('ledger')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentView === 'ledger'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
              Ledger
            </button>
            <button
              onClick={() => setCurrentView('trial-balance')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isReportView
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
              Reports
            </button>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setCurrentView('voucher-payment')}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>New Voucher</span>
              <span className="text-base">+</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Dashboard Component
function Dashboard({ onNavigate, stats, statsLoading }: { onNavigate: (view: ViewType) => void, stats: BooksStats, statsLoading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <TempoMetricCard
          icon={<Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
          title="Total Accounts"
          value={statsLoading ? '...' : stats.totalAccounts.toLocaleString()}
          change="+5"
          changeLabel="This Month"
          isPositive={true}
        />

        <TempoMetricCard
          icon={<Receipt className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
          title="Active Vouchers"
          value={statsLoading ? '...' : stats.activeVouchers.toLocaleString()}
          change="+12"
          changeLabel="This Month"
          isPositive={true}
        />

        <TempoMetricCard
          icon={<Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
          title="Transactions"
          value={statsLoading ? '...' : stats.totalTransactions.toLocaleString()}
          change="+20%"
          changeLabel="Last 30 Days"
          isPositive={true}
        />

        <TempoMetricCard
          icon={<CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
          title="Accuracy Rate"
          value={statsLoading ? '...' : `${stats.accuracyRate}%`}
          change="+1%"
          changeLabel="Last Month"
          isPositive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  Recent Transactions
                </h3>
                <button
                  onClick={() => onNavigate('daybook')}
                  className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                >
                  View All →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No transactions yet</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Start by creating your first voucher entry
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => onNavigate('voucher-payment')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                  >
                    <PlusCircle className="w-4 h-4 inline mr-2" />
                    Payment Voucher
                  </button>
                  <button
                    onClick={() => onNavigate('voucher-receipt')}
                    className="px-4 py-2 bg-white border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium dark:bg-slate-800 dark:border-gray-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <PlusCircle className="w-4 h-4 inline mr-2" />
                    Receipt Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Accounts */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    Top Accounts
                  </h3>
                  <button
                    onClick={() => onNavigate('accounts')}
                    className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                  >
                    Manage →
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    No accounts created yet
                  </p>
                  <button
                    onClick={() => onNavigate('accounts')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                  >
                    Create First Account
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Reports Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  Financial Reports
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => onNavigate('trial-balance')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">Trial Balance</h4>
                    </div>
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate('profit-loss')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">Profit & Loss</h4>
                    </div>
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate('balance-sheet')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <FileSpreadsheet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">Balance Sheet</h4>
                    </div>
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('voucher-payment')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <Receipt className="w-4 h-4" />
                New Payment Voucher
              </button>
              <button
                onClick={() => onNavigate('voucher-receipt')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <Receipt className="w-4 h-4" />
                New Receipt Voucher
              </button>
              <button
                onClick={() => onNavigate('accounts')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <Building2 className="w-4 h-4" />
                Create Account
              </button>
              <button
                onClick={() => onNavigate('ledger')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <Search className="w-4 h-4" />
                View Ledger
              </button>
            </div>
          </div>

          {/* Tips & Best Practices */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              💡 Pro Tips
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Maintain double-entry bookkeeping</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Regular reconciliation prevents errors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Use descriptive account names</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Review trial balance monthly</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
