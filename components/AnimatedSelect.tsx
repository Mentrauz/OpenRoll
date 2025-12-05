'use client';
import React, { useState, useEffect, useContext, createContext } from 'react';
import { ChevronDown } from 'lucide-react';

// Context to manage open dropdowns (only one dropdown can be open at a time)
const DropdownContext = createContext({
  openId: null as string | null,
  setOpenId: (id: string | null) => {}
});

export const DropdownProvider = ({ children }: { children: React.ReactNode }) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdownId(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <DropdownContext.Provider value={{ openId: openDropdownId, setOpenId: setOpenDropdownId }}>
      {children}
    </DropdownContext.Provider>
  );
};

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AnimatedSelectProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  direction?: 'up' | 'down';
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  dropdownClassName?: string;
}

export const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  direction = 'down',
  disabled = false,
  error,
  required = false,
  className = '',
  labelClassName = '',
  dropdownClassName = ''
}) => {
  const { openId, setOpenId } = useContext(DropdownContext);
  const isOpen = openId === id;
  const [selectedLabel, setSelectedLabel] = useState('');

  useEffect(() => {
    const selected = options.find(opt => opt.value === value);
    setSelectedLabel(selected ? selected.label : placeholder);
  }, [value, options, placeholder]);

  const handleClick = () => {
    if (disabled) return;
    setOpenId(isOpen ? null : id);
  };

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    setOpenId(null);
  };

  return (
    <div className={`relative ${className}`} data-dropdown>
      {label && (
        <label 
          htmlFor={id}
          className={`block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={handleClick}
          disabled={disabled}
          className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-lg cursor-pointer flex justify-between items-center text-left focus:outline-none ${
            error 
              ? 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
              : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-gray-500'
          } ${
            disabled 
              ? 'bg-slate-50 dark:bg-gray-700 cursor-not-allowed opacity-60' 
              : 'hover:border-gray-200 dark:hover:border-gray-500'
          }`}
        >
          <span className={`${!value ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'} truncate`}>
            {selectedLabel}
          </span>
          <div className="flex-shrink-0 ml-2">
            <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && !disabled && (
          <div
            className={`absolute z-50 w-full ${
              direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
            } bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden ${dropdownClassName}`}
          >
            <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleOptionClick(option.value)}
                  className={`w-full px-4 py-2 text-left cursor-pointer relative ${
                    value === option.value 
                      ? 'bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white font-medium' 
                      : option.disabled
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                  disabled={option.disabled}
                >
                  {option.label}
                  {value === option.value && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
              {options.length === 0 && (
                <div className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
};

export default AnimatedSelect;





















