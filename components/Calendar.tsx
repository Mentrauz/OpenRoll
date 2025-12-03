'use client';
import { useState, useCallback, useMemo } from 'react';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Memoize calendar calculations to prevent recalculation on every render
  const { daysInMonth, firstDayOfMonth, days } = useMemo(() => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return { daysInMonth, firstDayOfMonth, days };
  }, [currentMonth]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  const navigateToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  const selectDate = useCallback((day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  }, [currentMonth]);

  const isToday = useCallback((day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  }, [currentMonth]);

  const isSelected = useCallback((day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate, currentMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg  text-slate-600 hover:bg-slate-100"
          >
            ←
          </button>
          <button
            onClick={navigateToday}
            className="px-3 py-1 text-sm rounded-lg  text-slate-600 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg  text-slate-600 hover:bg-slate-100"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
            {day}
          </div>
        ))}

        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Calendar Days */}
        {days.map(day => (
          <button
            key={day}
            onClick={() => selectDate(day)}
            className={`
              p-2 text-sm rounded-lg transition-all duration-200
              ${
                isToday(day)
                  ? 'bg-black text-white font-semibold'
                  : isSelected(day)
                  ? 'bg-slate-100 text-black font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-slate-600">
            Selected: <span className="font-medium text-slate-900">{selectedDate.toLocaleDateString()}</span>
          </p>
        </div>
      )}
    </div>
  );
} 






















