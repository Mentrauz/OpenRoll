'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, isWithinInterval } from 'date-fns';
import AnimatedSelect, { SelectOption } from './AnimatedSelect';

interface ModernDateRangePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function ModernDateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  placeholder = 'Select date range',
  label,
  required = false,
  className = '',
  disabled = false
}: ModernDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const startDate = startValue ? new Date(startValue + 'T00:00:00') : null;
  const endDate = endValue ? new Date(endValue + 'T00:00:00') : null;

  // Month and year options for dropdowns
  const monthOptions: SelectOption[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].map((month, index) => ({ value: index.toString(), label: month }));

  const currentYear = new Date().getFullYear();
  const yearOptions: SelectOption[] = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingStart(true);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    if (selectingStart) {
      onStartChange(formattedDate);
      if (endDate && date > endDate) {
        onEndChange('');
      }
      setSelectingStart(false);
    } else {
      if (startDate && date < startDate) {
        // User selected an end date before the start date
        // So move this date to start and reset end date, stay in end selection mode
        onStartChange(formattedDate);
        onEndChange('');
        // Keep selectingStart as false to stay in end selection mode
      } else {
        onEndChange(formattedDate);
        setIsOpen(false);
        setSelectingStart(true);
      }
    }
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDateOfCalendar = startOfWeek(monthStart);
    const endDateOfCalendar = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDateOfCalendar;

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    while (day <= endDateOfCalendar) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isStartDate = startDate && isSameDay(day, startDate);
        const isEndDate = endDate && isSameDay(day, endDate);
        const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
        const isTodayDate = isToday(day);

        days.push(
          <button
            key={day.toString()}
            type="button"
            onClick={() => handleDateSelect(currentDay)}
            disabled={!isCurrentMonth}
            className={`
              relative w-8 h-8 flex items-center justify-center text-xs rounded-md
              transition-all duration-200 font-medium
              ${!isCurrentMonth ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-gray-200'}
              ${isStartDate || isEndDate ? 'bg-blue-700 text-white font-semibold hover:bg-blue-800 shadow-md hover:shadow-lg' : ''}
              ${isInRange && !isStartDate && !isEndDate ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200' : ''}
              ${!isStartDate && !isEndDate && !isInRange && isCurrentMonth ? 'hover:bg-slate-100 dark:hover:bg-gray-700 hover:shadow-sm' : ''}
              ${isTodayDate && !isStartDate && !isEndDate ? 'font-bold text-blue-700 dark:text-blue-400 ring-2 ring-blue-300 dark:ring-blue-600' : ''}
            `}
          >
            {format(day, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1.5">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="flex-1 min-w-[140px]">
        {/* Month header */}
        <div className="text-center mb-2">
          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            {format(monthDate, 'MMMM yyyy')}
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {weekDays.map(day => (
            <div key={day} className="w-8 h-6 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1.5">
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200 text-sm font-medium text-left
            flex items-center justify-between
            ${disabled ? 'bg-slate-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm'}
          `}
        >
          <span className={startDate || endDate ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-600'}>
            {startDate && endDate
              ? `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`
              : startDate
              ? `${format(startDate, 'dd MMM yyyy')} - ...`
              : placeholder
            }
          </span>
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-600" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 animate-in fade-in slide-in-from-top-2 duration-200 w-[560px] ring-1 ring-gray-900/10 dark:ring-white/10">
            <div className="p-3">
              {/* Navigation */}
              <div className="flex items-center justify-between mb-3">
                {/* Month and Year Selectors */}
                <div className="flex items-center gap-2">
                  <AnimatedSelect
                    id="month-select"
                    value={currentMonth.getMonth().toString()}
                    onChange={(value) => {
                      const newMonth = parseInt(value);
                      const newDate = new Date(currentMonth.getFullYear(), newMonth, 1);
                      setCurrentMonth(newDate);
                    }}
                    options={monthOptions}
                    className="!w-32 !text-xs"
                    dropdownClassName="!w-40"
                  />
                  <AnimatedSelect
                    id="year-select"
                    value={currentMonth.getFullYear().toString()}
                    onChange={(value) => {
                      const newYear = parseInt(value);
                      const newDate = new Date(newYear, currentMonth.getMonth(), 1);
                      setCurrentMonth(newDate);
                    }}
                    options={yearOptions}
                    className="!w-24 !text-xs"
                    dropdownClassName="!w-24"
                  />
                </div>

                {/* Selection Status */}
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 px-1.5">
                  {selectingStart ? 'Select start date' : 'Select end date'}
                </div>

                {/* Quick Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    title="Next month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dual month view */}
              <div className="flex gap-4">
                {renderMonth(currentMonth)}
                {renderMonth(addMonths(currentMonth, 1))}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onStartChange('');
                    onEndChange('');
                    setSelectingStart(true);
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  font-medium"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    onStartChange(format(today, 'yyyy-MM-dd'));
                    onEndChange(format(today, 'yyyy-MM-dd'));
                    setIsOpen(false);
                    setSelectingStart(true);
                  }}
                  className="px-2 py-1 text-xs text-blue-700 dark:text-blue-700 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md "
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





















