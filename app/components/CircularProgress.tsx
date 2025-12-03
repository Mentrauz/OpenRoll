'use client';

interface CircularProgressProps {
  size?: number;
  color?: string;
  progress?: number;
}

export default function CircularProgress({ 
  size = 40, 
  color = '#9333EA', 
  progress 
}: CircularProgressProps) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress || 0) / 100 * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r={radius}
            stroke={color}
            strokeWidth="4"
          />
          <circle
            className="transition-all duration-300"
            cx="12"
            cy="12"
            r={radius}
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        {typeof progress === 'number' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-purple-700">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 





















