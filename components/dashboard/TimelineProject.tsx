import { Filter, Plus, MoreVertical } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  duration: number;
  avatars: string[];
}

interface TimelineProjectProps {
  events: TimelineEvent[];
}

export default function TimelineProject({ events }: TimelineProjectProps) {
  const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">Timeline Project</h3>
          <button className="p-0.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 border border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 border border-gray-200 dark:border-gray-700">
            <Plus className="w-4 h-4" />
            Add note
          </button>
        </div>
      </div>
      
      {/* Timeline Grid */}
      <div className="relative overflow-x-hidden">
        {/* Time Headers */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
          {hours.map((hour) => (
            <div key={hour} className="flex-1 text-center text-xs text-slate-600 dark:text-slate-400">
              {hour}
            </div>
          ))}
        </div>
        
        {/* Events */}
        <div className="space-y-3">
          {events.map((event, idx) => (
            <div key={event.id} className="relative h-12">
              <div 
                className={`absolute h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 px-3 flex items-center justify-between hover:shadow-md transition-shadow ${
                  idx % 2 === 0 ? 'top-0' : 'top-0'
                }`}
                style={{
                  left: `${(((+event.time.split(':')[0]) - 7) * 100) / 6}%`,
                  width: `${Math.min(((event.duration * 100) / 6), 100 - ((((+event.time.split(':')[0]) - 7) * 100) / 6))}%`,
                  backgroundColor: idx === 2 ? '#dbeafe' : '#f9fafb'
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex -space-x-1">
                    {event.avatars.map((avatar, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white flex items-center justify-center text-xs">
                        {avatar}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{event.title}</span>
                </div>
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-gray-600 rounded">
                  <MoreVertical className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





















