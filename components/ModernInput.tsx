'use client';

import { useState } from 'react';

interface ModernInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
}

export default function ModernInput({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  error,
  helperText,
  maxLength,
  minLength,
  pattern,
  autoComplete,
}: ModernInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          className={`
            w-full px-4 py-3 border rounded-lg
            transition-all duration-200 text-sm font-medium
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
            ${disabled 
              ? 'bg-slate-100 dark:bg-gray-700 cursor-not-allowed text-slate-600 dark:text-slate-400 border-gray-200 dark:border-gray-600' 
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
            }
            ${error 
              ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }
            ${isFocused ? 'shadow-sm' : ''}
            placeholder:text-slate-400 dark:placeholder:text-slate-600
          `}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-700 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}





















