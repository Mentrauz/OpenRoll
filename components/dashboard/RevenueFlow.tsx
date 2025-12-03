'use client';
import React from 'react';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RevenueFlowProps {
  data: { date: string; value: number }[];
  totalRevenue: string;
  change: string;
  changeLabel: string;
  currentDate: string;
  currentValue: string;
  currentChange: string;
}

export default function RevenueFlow({
  data,
  totalRevenue,
  change,
  changeLabel,
  currentDate,
  currentValue,
  currentChange,
}: RevenueFlowProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm">
      {/* header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-md">
            <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Revenue Flow</h3>
        </div>

        <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* two-column compact layout */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* LEFT - compact text block */}
        <div className="md:w-2/5 flex flex-col justify-start gap-3">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-none">
                {totalRevenue}
              </span>
              <span className="inline-flex items-center text-sm font-semibold px-2 py-1 rounded-md bg-green-100 text-green-700">
                <span className="mr-1">↗</span>
                {change}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-sm text-slate-400">• {changeLabel}</p>
            </div>
          </div>

          {/* smaller achievement box */}
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
            <h4 className="text-xs font-semibold text-slate-900">New Record Achieved!</h4>
            <p className="text-sm text-slate-600 mt-0.5">
              November is the highest revenue since the start with {totalRevenue}.
            </p>
          </div>

          {/* compact footer / timeline label */}
          <div className="mt-auto">
            <p className="text-sm text-slate-400">18 Oct, 2025 - 18 Nov, 2025</p>
          </div>
        </div>

        {/* RIGHT - chart area (compact height) */}
        <div className="md:w-3/5">
          <div className="relative h-40 sm:h-48">
            {/* Top-right current indicator (small, non-expanding) */}
            <div className="absolute top-2 right-2 z-20 bg-white border border-gray-200 rounded-md p-2 shadow-sm text-right">
              <p className="text-xs text-slate-600 mb-0.5">{currentDate}</p>
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-sm font-bold text-slate-900">{currentValue}</span>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">{currentChange}</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%" suppressHydrationWarning>
              <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 16 }}>
                <defs>
                  <linearGradient id="compactRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* subtle horizontal grid, no vertical */}
                <CartesianGrid strokeDasharray="4 6" stroke="#F1F1F9" vertical={false} />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af', dy:14 }}
                  axisLine={false}
                  tickLine={false}
                  interval={'preserveStartEnd'}
                  minTickGap={20}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(value) => {
                    if (typeof value === 'number') {
                      if (value >= 1000) return `$${Math.round(value / 1000)}k`;
                      return `$${value}`;
                    }
                    return String(value);
                  }}
                />

                <Tooltip
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    boxShadow: '0 6px 18px rgba(20,20,50,0.06)',
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ stroke: '#7c3aed', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4 }}
                  fill="url(#compactRevenue)"
                  strokeLinecap="round"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* compact nav / progress */}
          <div className="flex items-center gap-3 mt-3">
            <button className="p-1 hover:bg-slate-50 rounded transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            <div className="flex items-center gap-1">
              <div className="w-8 h-1 rounded-full bg-indigo-700" />
              <div className="w-8 h-1 rounded-full bg-slate-100" />
              <div className="w-8 h-1 rounded-full bg-slate-100" />
            </div>

            <button className="p-1 hover:bg-slate-50 rounded transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <div className="ml-auto text-sm text-slate-400">—</div>
          </div>
        </div>
      </div>
    </div>
  );
}





















