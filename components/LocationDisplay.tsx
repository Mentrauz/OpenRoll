'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface LocationDisplayProps {
  latitude: number;
  longitude: number;
}

export default function LocationDisplay({ latitude, longitude }: LocationDisplayProps) {
  const [locationName, setLocationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLocationName();

    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [latitude, longitude]);

  const fetchLocationName = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      setLocationName(data.display_name);
    } catch (error) {
      // Silently handle location fetch errors
    } finally {
      setIsLoading(false);
    }
  };

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      '_blank'
    );
  };

  // Get short version of location (first part before comma)
  const shortLocation = locationName.split(',')[0];

  if (isLoading) {
    return <div className="text-sm text-slate-600">Loading...</div>;
  }

  return (
    <div className="relative" ref={tooltipRef}>
      <div 
        className="flex items-center space-x-1 cursor-pointer"
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <MapPin className="w-4 h-4 text-slate-600" />
        <span className="text-sm text-slate-600">{shortLocation}</span>
      </div>

      {showTooltip && (
        <div className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64">
          <div className="text-sm text-slate-600 break-words mb-2">
            {locationName}
          </div>
          <button
            onClick={openInGoogleMaps}
            className="text-xs text-purple-700 hover:text-purple-700 underline"
          >
            View in Google Maps
          </button>
        </div>
      )}
    </div>
  );
} 





















