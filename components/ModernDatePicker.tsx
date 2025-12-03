'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parse } from 'date-fns';
import AnimatedSelect, { SelectOption } from './AnimatedSelect';

interface ModernDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  mode?: 'date' | 'month' | 'year' | 'custom' | 'calendar';
}

export default function ModernDatePicker({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  className = '',
  disabled = false,
  mode = 'date'
}: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  // State for custom picker mode
  const [customYear, setCustomYear] = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth());
  const [customDay, setCustomDay] = useState(selectedDate ? selectedDate.getDate() : new Date().getDate());

  // Set default placeholder based on mode
  const defaultPlaceholder = mode === 'year' ? 'Select year' : mode === 'month' ? 'Select month' : mode === 'custom' ? 'Select date' : mode === 'calendar' ? 'Select date' : 'Select date';
  const finalPlaceholder = placeholder || defaultPlaceholder;

  // Update custom picker state when value changes
  useEffect(() => {
    if (selectedDate) {
      setCustomYear(selectedDate.getFullYear());
      setCustomMonth(selectedDate.getMonth());
      setCustomDay(selectedDate.getDate());
    }
  }, [value]);

  // Adjust day when month/year changes to prevent invalid dates
  useEffect(() => {
    const daysInMonth = new Date(customYear, customMonth + 1, 0).getDate();
    if (customDay > daysInMonth) {
      setCustomDay(daysInMonth);
    }
  }, [customYear, customMonth, customDay]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
    let formattedValue = '';
    switch (mode) {
      case 'year':
        formattedValue = format(date, 'yyyy');
        break;
      case 'month':
        formattedValue = format(date, 'yyyy-MM');
        break;
      case 'date':
      default:
        formattedValue = format(date, 'yyyy-MM-dd');
        break;
    }
    onChange(formattedValue);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    if (mode === 'year') {
      return renderYearPicker();
    } else if (mode === 'month') {
      return renderMonthPicker();
    } else if (mode === 'custom') {
      return renderCustomPicker();
    } else if (mode === 'calendar') {
      return renderCalendarMode();
    }
    return renderDatePicker();
  };

  const renderDatePicker = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    // Weekday headers
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
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
              ${!isCurrentMonth ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 hover:shadow-sm'}
              ${isSelected ? 'bg-blue-700 text-white font-semibold hover:bg-blue-800 shadow-md hover:shadow-lg' : ''}
              ${isTodayDate && !isSelected ? 'font-bold text-blue-700 dark:text-blue-400 ring-2 ring-blue-300 dark:ring-blue-600' : ''}
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
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
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

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  font-medium"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              handleDateSelect(new Date());
            }}
            className="px-2 py-1 text-xs text-blue-700 dark:text-blue-700 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md "
          >
            Today
          </button>
        </div>
      </div>
    );
  };

  const renderMonthPicker = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const selectedMonth = selectedDate ? selectedDate.getMonth() : null;
    const selectedYear = selectedDate ? selectedDate.getFullYear() : null;

    return (
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 12))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            {format(currentMonth, 'yyyy')}
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 12))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {months.map((month, index) => {
            const isSelected = selectedMonth === index && selectedYear === currentMonth.getFullYear();
            return (
              <button
                key={month}
                type="button"
                onClick={() => handleDateSelect(new Date(currentMonth.getFullYear(), index, 1))}
                className={`
                  p-2 text-xs rounded-md transition-all duration-200 font-medium
                  ${isSelected
                    ? 'bg-blue-700 text-white font-semibold shadow-md'
                    : 'text-slate-600 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 hover:shadow-sm'
                  }
                `}
              >
                {month}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md font-medium"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              handleDateSelect(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
            className="px-2 py-1 text-xs text-blue-700 dark:text-blue-700 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
          >
            Current
          </button>
        </div>
      </div>
    );
  };

  const renderYearPicker = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = Math.floor(currentYear / 12) * 12;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    return (
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 144))} // 12 years back
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            {startYear} - {startYear + 11}
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 144))} // 12 years forward
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md  text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Year grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {years.map((year) => {
            const isSelected = selectedDate && selectedDate.getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => handleDateSelect(new Date(year, 0, 1))}
                className={`
                  p-2 text-xs rounded-md transition-all duration-200 font-medium
                  ${isSelected
                    ? 'bg-blue-700 text-white font-semibold shadow-md'
                    : 'text-slate-600 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 hover:shadow-sm'
                  }
                `}
              >
                {year}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md font-medium"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              handleDateSelect(new Date(now.getFullYear(), 0, 1));
            }}
            className="px-2 py-1 text-xs text-blue-700 dark:text-blue-700 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
          >
            Current
          </button>
        </div>
      </div>
    );
  };

  const renderCustomPicker = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i);
    const daysInMonth = new Date(customYear, customMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handleConfirm = () => {
      const date = new Date(customYear, customMonth, customDay);
      handleDateSelect(date);
    };

    return (
      <div className="p-4 space-y-4">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Select Date
        </div>

        {/* Year Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Year</label>
          <select
            value={customYear}
            onChange={(e) => setCustomYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Month</label>
          <select
            value={customMonth}
            onChange={(e) => setCustomMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>

        {/* Day Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Day</label>
          <select
            value={customDay}
            onChange={(e) => setCustomDay(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        {/* Selected Date Preview */}
        <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-md">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Selected Date:</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {format(new Date(customYear, customMonth, customDay), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md font-medium"
          >
            Clear
          </button>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCustomYear(now.getFullYear());
                setCustomMonth(now.getMonth());
                setCustomDay(now.getDate());
              }}
              className="px-3 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md font-medium"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendarMode = () => {
    // Month and year options for dropdowns (same as ModernDateRangePicker)
    const monthOptions: SelectOption[] = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].map((month, index) => ({ value: index.toString(), label: month }));

    const currentYear = new Date().getFullYear();
    const yearOptions: SelectOption[] = Array.from({ length: 10 }, (_, i) => {
      const year = currentYear - 2 + i;
      return { value: year.toString(), label: year.toString() };
    });

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
          const isSelected = selectedDate && isSameDay(day, selectedDate);
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
                ${isSelected ? 'bg-blue-700 text-white font-semibold hover:bg-blue-800 shadow-md hover:shadow-lg' : ''}
                ${!isSelected && isCurrentMonth ? 'hover:bg-slate-100 dark:hover:bg-gray-700 hover:shadow-sm' : ''}
                ${isTodayDate && !isSelected ? 'font-bold text-blue-700 dark:text-blue-400 ring-2 ring-blue-300 dark:ring-blue-600' : ''}
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
      <div className="p-3">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-3">
          {/* Month and Year Selectors */}
          <div className="flex items-center gap-2">
            <AnimatedSelect
              id="month-select-calendar"
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
              id="year-select-calendar"
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
              onChange('');
              setIsOpen(false);
            }}
            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md font-medium"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              handleDateSelect(today);
            }}
            className="px-2 py-1 text-xs text-blue-700 dark:text-blue-700 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
          >
            Today
          </button>
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
      <div className="relative w-full" ref={dropdownRef}>
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
          <span className={selectedDate ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-600'}>
            {selectedDate ? (
              mode === 'year' ? format(selectedDate, 'yyyy') :
              mode === 'month' ? format(selectedDate, 'MMM yyyy') :
              mode === 'custom' ? format(selectedDate, 'dd MMM yyyy') :
              mode === 'calendar' ? format(selectedDate, 'dd MMM yyyy') :
              format(selectedDate, 'dd MMM yyyy')
            ) : finalPlaceholder}
          </span>
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-600" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 animate-in fade-in slide-in-from-top-2 duration-200 w-[460px] ring-1 ring-gray-900/10 dark:ring-white/10">
            {renderCalendar()}
          </div>
        )}
      </div>
    </div>
  );
}



















