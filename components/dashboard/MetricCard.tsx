import { MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend: number;
  trendLabel: string;
  chartData: { value: number }[];
  chartColor: string;
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendLabel, 
  chartData, 
  chartColor 
}: MetricCardProps) {
  const isPositive = trend > 0;
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-900 dark:text-white text-sm">{title}</h3>
          <button className="p-0.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <button className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded">
          <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-600" />
        </button>
      </div>
      
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
            {subtitle && <span className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</span>}
          </div>
          <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="font-medium">{Math.abs(trend)}%</span>
          </div>
        </div>
        
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%" suppressHydrationWarning>
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={chartColor} 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <p className="text-xs text-slate-600 dark:text-slate-400">{trendLabel}</p>
    </div>
  );
}





















