'use client';
import { useState, useRef } from 'react';
import {
  DollarSign, Users, UserPlus, TrendingDown, Download, Grid3x3
} from 'lucide-react';
import LordIcon, { LordIconRef } from '../../../components/ui/LordIcon';
import searchIcon from '../../../public/icons/search.json';
import TempoMetricCard from '@/components/dashboard/TempoMetricCard';
import RevenueFlow from '@/components/dashboard/RevenueFlow';
import LeadSourcesBreakdown from '@/components/dashboard/LeadSourcesBreakdown';
import ActiveSubscribersTable from '@/components/dashboard/ActiveSubscribersTable';

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30Days');
  const searchIconRef = useRef<LordIconRef>(null);

  // Mock Data for different periods
  const dashboardData = {
    '30Days': {
      metrics: [
        {
          icon: <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Daily Revenue",
          value: "$612.10",
          change: "+20%($223)",
          changeLabel: "Last 30 Days",
          isPositive: true
        },
        {
          icon: <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Active Subscribers",
          value: "42,243",
          change: "+12%(1,456)",
          changeLabel: "Last 30 Days",
          isPositive: true
        },
        {
          icon: <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "New Subscribers",
          value: "1605",
          change: "+20%(201)",
          changeLabel: "Last 30 Days",
          isPositive: true
        },
        {
          icon: <TrendingDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Churn Rate",
          value: "3.2%",
          change: "-8%(0.4%)",
          changeLabel: "Last 30 Days",
          isPositive: false
        }
      ],
      revenueData: [
        { date: '18 Oct, 2025', value: 1000 },
        { date: '22 Oct', value: 3000 },
        { date: '26 Oct', value: 2500 },
        { date: '30 Oct', value: 3500 },
        { date: '3 Nov', value: 4000 },
        { date: '7 Nov', value: 3800 },
        { date: '11 Nov', value: 4200 },
        { date: '15 Nov', value: 4500 },
        { date: '18 Nov, 2025', value: 4845550 },
      ],
      revenueStats: {
        totalRevenue: "$6,745,500",
        change: "+20%($2,423)",
        changeLabel: "Last 30 Days",
        currentDate: "8 Nov, 2025",
        currentValue: "$4,845,550",
        currentChange: "+20%"
      },
      leadSources: [
        { name: 'Website', value: 1240, color: '#6366f1' },
        { name: 'Paid Ads', value: 504, color: '#8b5cf6' },
        { name: 'Organic Ads', value: 403, color: '#ec4899' },
        { name: 'Referral', value: 204, color: '#f59e0b' },
      ],
      leadStats: {
        totalLeads: 2351
      },
      subscribers: [
        { id: '001', name: 'John Lake', email: 'john.li@example.com', status: 'Unsubscribed' as const, signupDate: '2025-01-15', source: 'Website' },
        { id: '002', name: 'Kate Williams', email: 'kate.williams@example.com', status: 'Subscribed' as const, signupDate: '2025-02-19', source: 'Organic Ads' },
        { id: '003', name: 'Ahmed Hamdi', email: 'ahmed.h@example.com', status: 'Unsubscribed' as const, signupDate: '2025-03-12', source: 'Referral' },
        { id: '004', name: 'Sarah Johnson', email: 'sarah.j@example.com', status: 'Subscribed' as const, signupDate: '2025-11-02', source: 'Referral' },
        { id: '005', name: 'Mark Wilson', email: 'mark.w@example.com', status: 'Inactive' as const, signupDate: '2025-03-08', source: 'Organic Ads' },
        { id: '006', name: 'Sarah Luis', email: 'sarah.luis@example.com', status: 'Subscribed' as const, signupDate: '2024-12-19', source: 'Website' },
      ]
    },
    '3Months': {
      metrics: [
        {
          icon: <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Daily Revenue",
          value: "$1,845.50",
          change: "+15%($540)",
          changeLabel: "Last 3 Months",
          isPositive: true
        },
        {
          icon: <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Active Subscribers",
          value: "125,430",
          change: "+25%(5,230)",
          changeLabel: "Last 3 Months",
          isPositive: true
        },
        {
          icon: <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "New Subscribers",
          value: "4,850",
          change: "+10%(450)",
          changeLabel: "Last 3 Months",
          isPositive: true
        },
        {
          icon: <TrendingDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Churn Rate",
          value: "2.8%",
          change: "-12%(0.5%)",
          changeLabel: "Last 3 Months",
          isPositive: false
        }
      ],
      revenueData: [
        { date: 'Aug', value: 15000 },
        { date: 'Sep', value: 22000 },
        { date: 'Oct', value: 18000 },
        { date: 'Nov', value: 25000 },
        { date: 'Dec', value: 28000 },
        { date: 'Jan', value: 32000 },
      ],
      revenueStats: {
        totalRevenue: "$18,450,200",
        change: "+35%($4,500)",
        changeLabel: "Last 3 Months",
        currentDate: "Jan 2026",
        currentValue: "$12,500,000",
        currentChange: "+35%"
      },
      leadSources: [
        { name: 'Website', value: 3500, color: '#6366f1' },
        { name: 'Paid Ads', value: 1200, color: '#8b5cf6' },
        { name: 'Organic Ads', value: 950, color: '#ec4899' },
        { name: 'Referral', value: 600, color: '#f59e0b' },
      ],
      leadStats: {
        totalLeads: 6250
      },
      subscribers: [
        { id: '007', name: 'Michael Brown', email: 'm.brown@example.com', status: 'Subscribed' as const, signupDate: '2025-09-10', source: 'Paid Ads' },
        { id: '008', name: 'Emily Davis', email: 'emily.d@example.com', status: 'Subscribed' as const, signupDate: '2025-10-05', source: 'Website' },
        { id: '009', name: 'Chris Wilson', email: 'chris.w@example.com', status: 'Inactive' as const, signupDate: '2025-08-22', source: 'Referral' },
        { id: '010', name: 'Jessica Taylor', email: 'j.taylor@example.com', status: 'Subscribed' as const, signupDate: '2025-11-15', source: 'Organic Ads' },
        { id: '011', name: 'David Anderson', email: 'd.anderson@example.com', status: 'Unsubscribed' as const, signupDate: '2025-09-30', source: 'Website' },
        { id: '012', name: 'Laura Martinez', email: 'laura.m@example.com', status: 'Subscribed' as const, signupDate: '2025-10-18', source: 'Paid Ads' },
      ]
    },
    '1year': {
      metrics: [
        {
          icon: <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Daily Revenue",
          value: "$5,240.80",
          change: "+45%($1,200)",
          changeLabel: "Last 1 Year",
          isPositive: true
        },
        {
          icon: <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Active Subscribers",
          value: "450,120",
          change: "+60%(120,000)",
          changeLabel: "Last 1 Year",
          isPositive: true
        },
        {
          icon: <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "New Subscribers",
          value: "18,500",
          change: "+30%(4,200)",
          changeLabel: "Last 1 Year",
          isPositive: true
        },
        {
          icon: <TrendingDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: "Churn Rate",
          value: "1.5%",
          change: "-20%(0.8%)",
          changeLabel: "Last 1 Year",
          isPositive: false
        }
      ],
      revenueData: [
        { date: 'Q1', value: 45000 },
        { date: 'Q2', value: 52000 },
        { date: 'Q3', value: 48000 },
        { date: 'Q4', value: 65000 },
      ],
      revenueStats: {
        totalRevenue: "$65,200,000",
        change: "+55%($20,000)",
        changeLabel: "Last 1 Year",
        currentDate: "2025",
        currentValue: "$45,000,000",
        currentChange: "+55%"
      },
      leadSources: [
        { name: 'Website', value: 15000, color: '#6366f1' },
        { name: 'Paid Ads', value: 8500, color: '#8b5cf6' },
        { name: 'Organic Ads', value: 6200, color: '#ec4899' },
        { name: 'Referral', value: 4100, color: '#f59e0b' },
      ],
      leadStats: {
        totalLeads: 33800
      },
      subscribers: [
        { id: '013', name: 'Robert Thomas', email: 'r.thomas@example.com', status: 'Subscribed' as const, signupDate: '2025-02-10', source: 'Website' },
        { id: '014', name: 'Jennifer Jackson', email: 'j.jackson@example.com', status: 'Inactive' as const, signupDate: '2025-04-25', source: 'Paid Ads' },
        { id: '015', name: 'William White', email: 'w.white@example.com', status: 'Subscribed' as const, signupDate: '2025-06-15', source: 'Referral' },
        { id: '016', name: 'Linda Harris', email: 'l.harris@example.com', status: 'Unsubscribed' as const, signupDate: '2025-01-30', source: 'Organic Ads' },
        { id: '017', name: 'Elizabeth Martin', email: 'e.martin@example.com', status: 'Subscribed' as const, signupDate: '2025-08-05', source: 'Website' },
        { id: '018', name: 'James Thompson', email: 'j.thompson@example.com', status: 'Subscribed' as const, signupDate: '2025-11-20', source: 'Paid Ads' },
      ]
    }
  };

  // Get current data based on selection
  // @ts-ignore
  const currentData = dashboardData[selectedPeriod];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-full">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Dashboard Title - Left Side */}
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          </div>

          {/* Search Box - Right Side */}
          <div
            className="relative w-64"
            onMouseEnter={() => searchIconRef.current?.playAnimation()}
            onMouseLeave={() => searchIconRef.current?.goToFirstFrame()}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LordIcon
                ref={searchIconRef}
                icon={searchIcon}
                size={16}
                className="text-gray-400"
                trigger="manual"
              />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Header with Period Tabs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-5">
          {/* Left Side - Period Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedPeriod('30Days')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${selectedPeriod === '30Days'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('3Months')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${selectedPeriod === '3Months'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setSelectedPeriod('1year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${selectedPeriod === '1year'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              1 years
            </button>
          </div>

          {/* Right Side - Export and New Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
              <span>New</span>
              <span className="text-base">+</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {currentData.metrics.map((metric: any, index: number) => (
            <TempoMetricCard
              key={index}
              icon={metric.icon}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeLabel={metric.changeLabel}
              isPositive={metric.isPositive}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="lg:col-span-2">
            <RevenueFlow
              data={currentData.revenueData}
              totalRevenue={currentData.revenueStats.totalRevenue}
              change={currentData.revenueStats.change}
              changeLabel={currentData.revenueStats.changeLabel}
              currentDate={currentData.revenueStats.currentDate}
              currentValue={currentData.revenueStats.currentValue}
              currentChange={currentData.revenueStats.currentChange}
            />
          </div>

          <div className="lg:col-span-1">
            <LeadSourcesBreakdown
              totalLeads={currentData.leadStats.totalLeads}
              sources={currentData.leadSources}
            />
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="mb-5">
          <ActiveSubscribersTable
            subscribers={currentData.subscribers}
            totalCount={42243}
          />
        </div>
      </main>
    </div>
  );
}
