import { TrendingUp, TrendingDown } from 'lucide-react';

interface TempoMetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change: string;
  changeLabel: string;
  isPositive: boolean;
}

export default function TempoMetricCard({ 
  icon, 
  title, 
  value, 
  change, 
  changeLabel, 
  isPositive 
}: TempoMetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="p-1.5 bg-slate-50 dark:bg-gray-700 rounded-md">
          {icon}
        </div>
      </div>
      
      <h3 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{title}</h3>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
      </div>
      
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs font-semibold ${
          isPositive 
            ? 'text-green-700 dark:text-green-400' 
            : 'text-red-700 dark:text-red-400'
        }`}>
          {isPositive ? '↗' : '↘'} {change}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-600">• {changeLabel}</span>
      </div>
    </div>
  );
}





















