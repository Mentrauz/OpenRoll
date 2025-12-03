import { MoreVertical } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface WorkplaceData {
  subject: string;
  value: number;
  fullMark: number;
}

interface WorkplaceExperienceProps {
  data: WorkplaceData[];
}

export default function WorkplaceExperience({ data }: WorkplaceExperienceProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Workplace Experience</h3>
          <p className="text-sm text-slate-600">Employee view on work & perks</p>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <MoreVertical className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" suppressHydrationWarning>
          <RadarChart data={data}>
            <PolarGrid stroke="#F1F1F9" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
            <Radar 
              name="Experience" 
              dataKey="value" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}























