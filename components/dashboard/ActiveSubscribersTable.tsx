'use client';
import { Calendar, Filter, Download } from 'lucide-react';
import LordIcon from '../ui/LordIcon';
import searchIcon from '../../public/icons/search.json';

interface Subscriber {
  id: string;
  name: string;
  email: string;
  status: 'Subscribed' | 'Unsubscribed' | 'Inactive';
  signupDate: string;
  source: string;
  avatar?: string;
}

interface ActiveSubscribersTableProps {
  subscribers: Subscriber[];
  totalCount: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Subscribed':
      return 'bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-700';
    case 'Unsubscribed':
      return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-700';
    case 'Inactive':
      return 'bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-slate-400';
    default:
      return 'bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-slate-400';
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'Website':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-700';
    case 'Organic Ads':
      return 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-700';
    case 'Referral':
      return 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-700';
    default:
      return 'bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-slate-400';
  }
};

export default function ActiveSubscribersTable({ subscribers, totalCount }: ActiveSubscribersTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          {totalCount.toLocaleString()} Active Subscribers
        </h3>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
              <LordIcon
                icon={searchIcon}
                size={14}
                className="text-slate-400"
                trigger="hover"
              />
            </div>
            <input
              type="text"
              placeholder="Search for a subscriber"
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-slate-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-slate-600 dark:text-gray-200">
              ⌘K
            </kbd>
          </div>
          
          <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-1.5 transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Signup Date</span>
          </button>
          
          <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="hidden sm:inline">Source</span>
          </button>
          
          <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="hidden sm:inline">Status</span>
          </button>
          
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            
            <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Subscriber ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Signup Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {subscribers.map((subscriber) => (
              <tr 
                key={subscriber.id}
                className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-slate-900 dark:text-gray-100 font-medium">
                    {subscriber.id}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-semibold">
                      {subscriber.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs font-medium text-slate-900 dark:text-gray-100">
                      {subscriber.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {subscriber.email}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscriber.status)}`}>
                    {subscriber.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {subscriber.signupDate}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSourceColor(subscriber.source)}`}>
                    {subscriber.source}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}





















