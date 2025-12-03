'use client';
import { useState, useEffect } from 'react';
import { FileSpreadsheet, Loader2, Download, PieChart, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import LordIcon from '../../../components/ui/LordIcon';
import searchIcon from '../../../public/icons/search.json';
import { toast, Toaster } from 'react-hot-toast';
import CircularProgress from '@/app/components/CircularProgress';
import AnimatedSelect from '@/components/AnimatedSelect';

type Unit = {
  _id: string;
  unitName: string;
};

export default function ESICExportPage() {
  const [formData, setFormData] = useState({
    unit: '',
    month: '',
    year: '',
    consolidationType: 'single' // 'single', 'unit-year', 'all-units-month', 'all-units-year', 'custom'
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Multi-select states for custom option
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units/get-units');
        const data = await response.json();
        
        if (data.success) {
          setUnits(data.units);
        } else {
          setError('Failed to load units');
        }
      } catch (err) {
        setError('Error loading units');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on consolidation type
    if (formData.consolidationType === 'single') {
      if (!formData.unit || !formData.month || !formData.year) {
        toast.error('Please select all required fields');
        return;
      }
    } else if (formData.consolidationType === 'unit-year') {
      if (!formData.unit || !formData.year) {
        toast.error('Please select unit and year');
        return;
      }
    } else if (formData.consolidationType === 'all-units-month') {
      if (!formData.month || !formData.year) {
        toast.error('Please select month and year');
        return;
      }
    } else if (formData.consolidationType === 'all-units-year') {
      if (!formData.year) {
        toast.error('Please select year');
        return;
      }
    } else if (formData.consolidationType === 'custom') {
      if (selectedUnits.length === 0 || selectedMonths.length === 0 || selectedYears.length === 0) {
        toast.error('Please select at least one unit, month, and year');
        return;
      }
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const requestData = formData.consolidationType === 'custom' ? {
        units: selectedUnits,
        months: selectedMonths,
        years: selectedYears,
        consolidationType: formData.consolidationType
      } : {
        unit: formData.unit,
        month: formData.month,
        year: formData.year,
        consolidationType: formData.consolidationType
      };

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/generate-esic-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      clearInterval(progressInterval);

      // Check for error responses
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate ESIC Excel');
        }
        throw new Error('Failed to generate ESIC Excel');
      }

      setProgress(100);

      // Check if it's a JSON response (error) or Excel file
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to generate ESIC Excel');
        }
      } else {
        // Handle Excel file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        let filename = '';
        if (formData.consolidationType === 'single') {
          filename = `esic_report_${formData.unit}_${formData.month}_${formData.year}.xlsx`;
        } else if (formData.consolidationType === 'unit-year') {
          filename = `esic_reports_${formData.unit}_${formData.year}.xlsx`;
        } else if (formData.consolidationType === 'all-units-month') {
          filename = `esic_all_units_${formData.month}_${formData.year}.xlsx`;
        } else if (formData.consolidationType === 'all-units-year') {
          filename = `esic_all_units_year_${formData.year}.xlsx`;
        } else if (formData.consolidationType === 'custom') {
          const timestamp = new Date().getTime();
          filename = `custom_esic_report_${timestamp}.xlsx`;
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('ESIC Excel generated successfully');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate ESIC Excel');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 500);
    }
  };

  // Check if all required fields are selected based on consolidation type
  const isFormValid = (() => {
    if (formData.consolidationType === 'single') {
      return formData.unit && formData.month && formData.year;
    } else if (formData.consolidationType === 'unit-year') {
      return formData.unit && formData.year;
    } else if (formData.consolidationType === 'all-units-month') {
      return formData.month && formData.year;
    } else if (formData.consolidationType === 'all-units-year') {
      return formData.year;
    } else if (formData.consolidationType === 'custom') {
      return selectedUnits.length > 0 && selectedMonths.length > 0 && selectedYears.length > 0;
    }
    return false;
  })();

  return (
    <div className="bg-white dark:bg-gray-900 min-h-full">
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title - Left Side */}
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ESIC Export</h1>
          </div>

          {/* Search Box - Right Side */}
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <LordIcon
                icon={searchIcon}
                size={16}
                className="text-gray-400"
                trigger="hover"
              />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-7xl text-gray-900 dark:text-gray-100">

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Main Configuration Card */}
          <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  Report Configuration
               </h3>
            </div>

            <div className="p-6 md:p-8">
              {/* Report Scope Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Select Report Scope</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'single', label: 'Single Report', sub: 'One Unit, One Month' },
                    { id: 'unit-year', label: 'Unit Annual', sub: 'All Months for One Unit' },
                    { id: 'all-units-month', label: 'Monthly Consolidation', sub: 'All Units for One Month' },
                    { id: 'all-units-year', label: 'Annual Master', sub: 'All Units, All Months' },
                    { id: 'custom', label: 'Custom Selection', sub: 'Manual Multi-Select' },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`relative flex items-start p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        formData.consolidationType === option.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500'
                          : 'border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="consolidationType"
                        value={option.id}
                        checked={formData.consolidationType === option.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, consolidationType: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <span className={`font-semibold text-sm ${formData.consolidationType === option.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                {option.label}
                            </span>
                            {formData.consolidationType === option.id && (
                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Unit Selection */}
                {(formData.consolidationType === 'single' || formData.consolidationType === 'unit-year') && (
                  <div className="space-y-2">
                    <AnimatedSelect
                      id="esic-export-unit"
                      label="Select Unit"
                      value={formData.unit}
                      onChange={(value) => handleChange({
                        target: { name: 'unit', value }
                      } as React.ChangeEvent<HTMLSelectElement>)}
                      options={units.map(unit => ({
                        value: unit._id,
                        label: unit.unitName
                      }))}
                      placeholder="Choose Unit..."
                      disabled={loading}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                )}

                {/* Month Selection */}
                {(formData.consolidationType === 'single' || formData.consolidationType === 'all-units-month') && (
                  <div className="space-y-2">
                    <AnimatedSelect
                      id="esic-export-month"
                      label="Select Month"
                      value={formData.month}
                      onChange={(value) => handleChange({
                        target: { name: 'month', value }
                      } as React.ChangeEvent<HTMLSelectElement>)}
                      options={Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(0, i).toLocaleString('default', { month: 'long' });
                        return {
                          value: String(i + 1).padStart(2, '0'),
                          label: month
                        };
                      })}
                      placeholder="Choose Month..."
                    />
                  </div>
                )}

                {/* Year Selection */}
                {formData.consolidationType !== 'custom' && (
                  <div className="space-y-2">
                    <AnimatedSelect
                      id="esic-export-year"
                      label="Select Year"
                      value={formData.year}
                      onChange={(value) => handleChange({
                        target: { name: 'year', value }
                      } as React.ChangeEvent<HTMLSelectElement>)}
                      options={Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return {
                          value: year.toString(),
                          label: year.toString()
                        };
                      })}
                      placeholder="Choose Year..."
                    />
                  </div>
                )}
              </div>

              {/* Custom Multi-Select Section */}
              {formData.consolidationType === 'custom' && (
                <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-bold">Advanced Filtering</span>
                  </div>

                  {/* Multi-select Units */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Units</label>
                        <button
                            type="button"
                            onClick={() => {
                              const allUnitIds = units.map(unit => unit._id);
                              if (selectedUnits.length === allUnitIds.length) setSelectedUnits([]);
                              else setSelectedUnits(allUnitIds);
                            }}
                            className="text-xs text-blue-600 font-medium hover:underline"
                        >
                            {selectedUnits.length === units.length ? 'Clear Selection' : 'Select All'}
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2">
                      {units.map((unit) => (
                        <label key={unit._id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUnits.includes(unit._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUnits([...selectedUnits, unit._id]);
                              else setSelectedUnits(selectedUnits.filter(id => id !== unit._id));
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300 truncate">{unit.unitName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Multi-select Months */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Months</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = new Date(0, i).toLocaleString('default', { month: 'short' });
                          const monthValue = String(i + 1).padStart(2, '0');
                          const isSelected = selectedMonths.includes(monthValue);
                          return (
                            <label key={monthValue} className={`text-center py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors border ${
                              isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-200 hover:border-blue-400'
                            }`}>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedMonths([...selectedMonths, monthValue]);
                                  else setSelectedMonths(selectedMonths.filter(m => m !== monthValue));
                                }}
                              />
                              {month}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Multi-select Years */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Years</label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          const yearValue = year.toString();
                          const isSelected = selectedYears.includes(yearValue);
                          return (
                            <label key={yearValue} className={`px-4 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors border ${
                              isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-200 hover:border-blue-400'
                            }`}>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedYears([...selectedYears, yearValue]);
                                  else setSelectedYears(selectedYears.filter(y => y !== yearValue));
                                }}
                              />
                              {year}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={loading || isGenerating || !isFormValid}
                  className={`w-full lg:w-auto px-8 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    loading || isGenerating || !isFormValid
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-[#111827] text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-md hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">Loading...</span>
                  ) : isGenerating ? (
                    <span className="flex items-center gap-2">Generating...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress Indicator */}
              {isGenerating && (
                <div className="mt-6 flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-10 h-10">
                     <CircularProgress progress={progress} color="#2563EB" size={40} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {progress < 100 ? 'Processing your request...' : 'Finalizing...'}
                    </p>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 h-1.5 rounded-full mt-1.5">
                        <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{progress}%</span>
                </div>
              )}
            </div>
          </div>
        </form>
        </div>
      </main>
    </div>
  );
}





















