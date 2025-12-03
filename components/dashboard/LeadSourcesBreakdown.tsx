'use client';
import { MoreHorizontal, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface LeadSource {
  name: string;
  value: number;
  color: string;
}

interface LeadSourcesBreakdownProps {
  totalLeads: number;
  sources: LeadSource[];
}

export default function LeadSourcesBreakdown({ totalLeads, sources }: LeadSourcesBreakdownProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 dark:bg-gray-700 rounded-md">
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Lead Sources Breakdown</h3>
        </div>
        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-slate-400 dark:text-slate-400" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-6">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={160} height={172} suppressHydrationWarning>
            <PieChart>
              <Pie
                data={sources}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {sources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalLeads}</span>
            <span className="text-xs text-slate-400 dark:text-slate-400">Total Leads</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {sources.map((source) => (
            <div key={source.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{source.name}</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{source.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="mt-5 w-full py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5">
        <span>More details</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}





















