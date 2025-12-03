import { TrendingDown, MoreVertical } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PayrollData {
  month: string;
  value: number;
}

interface PayrollRecapProps {
  data: PayrollData[];
  currentValue: number;
  trend: number;
}

export default function PayrollRecap({ data, currentValue, trend }: PayrollRecapProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">Payroll Recap</h3>
          <button className="p-0.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <button className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-400">More view</button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            ${currentValue.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-red-700 text-sm font-medium">
            <TrendingDown className="w-4 h-4" />
            {Math.abs(trend)}%
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Current year on-year payroll</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">Salary</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[12rem]">
        <ResponsiveContainer width="100%" height="100%" suppressHydrationWarning>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Payroll']}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}





















