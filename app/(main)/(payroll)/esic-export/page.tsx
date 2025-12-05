'use client';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Download, FileSpreadsheet, Loader2, TrendingUp } from 'lucide-react';
import LordIcon from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';
import { toast, Toaster } from 'react-hot-toast';
import CircularProgress from '@/app/components/CircularProgress';
import AnimatedSelect from '@/components/AnimatedSelect';

interface Unit {
  _id: string;
  unitName: string;
}

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function ESICExport() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    month: '',
    year: '',
    unit: '',
    consolidationType: 'single' as 'single' | 'unit-year' | 'all-units-month' | 'all-units-year' | 'custom',
  });

  // Multi-select states for custom option
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // Fetch units
  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoadingUnits(true);
      try {
        const res = await fetch('/api/units/get-units');
        if (!res.ok) throw new Error('Failed to load units');
        const data = await res.json();
        setUnits(data.units || data || []);
      } catch {
        toast.error('Failed to load units. Please retry.');
      } finally {
        setIsLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []);

  const isFormValid = useMemo(() => {
    if (formData.consolidationType === 'single') {
      return formData.unit && formData.month && formData.year;
    }
    if (formData.consolidationType === 'unit-year') {
      return formData.unit && formData.year;
    }
    if (formData.consolidationType === 'all-units-month') {
      return formData.month && formData.year;
    }
    if (formData.consolidationType === 'all-units-year') {
      return formData.year;
    }
    if (formData.consolidationType === 'custom') {
      return selectedUnits.length > 0 && selectedMonths.length > 0 && selectedYears.length > 0;
    }
    return false;
  }, [formData, selectedUnits, selectedMonths, selectedYears]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please complete required fields.');
      return;
    }

    setLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 400);

    try {
      const payload =
        formData.consolidationType === 'custom'
          ? {
              consolidationType: formData.consolidationType,
              units: selectedUnits,
              months: selectedMonths,
              years: selectedYears,
            }
          : {
              consolidationType: formData.consolidationType,
              unit: formData.unit,
              month: formData.month,
              year: formData.year,
            };

      const res = await fetch('/api/generate-esic-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }

      setProgress(100);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `ESIC_${Date.now()}.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.href = url;
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('ESIC report generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 400);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-full">
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ESIC Export</h1>
          </div>
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <LordIcon icon={searchIcon} size={16} className="text-gray-400" trigger="hover" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-7xl text-gray-900 dark:text-gray-100">
          <form onSubmit={handleExport} className="space-y-6">
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  Report Configuration
                </h3>
              </div>

              <div className="p-6 md:p-8">
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
                          onChange={(e) => setFormData((prev) => ({ ...prev, consolidationType: e.target.value as typeof formData.consolidationType }))}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-semibold text-sm ${
                                formData.consolidationType === option.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                              }`}
                            >
                              {option.label}
                            </span>
                            {formData.consolidationType === option.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(formData.consolidationType === 'single' || formData.consolidationType === 'unit-year') && (
                    <div className="space-y-2">
                      <AnimatedSelect
                        id="unit-esic"
                        label="Select Unit"
                        value={formData.unit}
                        onChange={(value) => setFormData({ ...formData, unit: value })}
                        options={units.map((unit) => ({
                          value: unit._id,
                          label: unit.unitName,
                        }))}
                        placeholder="Choose Unit..."
                        disabled={isLoadingUnits}
                      />
                    </div>
                  )}

                  {(formData.consolidationType === 'single' || formData.consolidationType === 'all-units-month') && (
                    <div className="space-y-2">
                      <AnimatedSelect
                        id="month-esic"
                        label="Select Month"
                        value={formData.month}
                        onChange={(value) => setFormData({ ...formData, month: value })}
                        options={months}
                        placeholder="Choose Month..."
                      />
                    </div>
                  )}

                  {formData.consolidationType !== 'custom' && (
                    <div className="space-y-2">
                      <AnimatedSelect
                        id="year-esic"
                        label="Select Year"
                        value={formData.year}
                        onChange={(value) => setFormData({ ...formData, year: value })}
                        options={Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return { value: year.toString(), label: year.toString() };
                        })}
                        placeholder="Choose Year..."
                      />
                    </div>
                  )}
                </div>

                {formData.consolidationType === 'custom' && (
                  <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-bold">Advanced Filtering</span>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Units</label>
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = units.map((u) => u._id);
                            setSelectedUnits(selectedUnits.length === allIds.length ? [] : allIds);
                          }}
                          className="text-xs text-blue-600 font-medium hover:underline"
                        >
                          {selectedUnits.length === units.length ? 'Clear Selection' : 'Select All'}
                        </button>
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 custom-scrollbar">
                        {units.map((unit) => (
                          <label key={unit._id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUnits.includes(unit._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedUnits([...selectedUnits, unit._id]);
                                else setSelectedUnits(selectedUnits.filter((id) => id !== unit._id));
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300 truncate">{unit.unitName}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Months</label>
                        <div className="grid grid-cols-3 gap-2">
                          {months.map((m) => {
                            const isSelected = selectedMonths.includes(m.value);
                            return (
                              <label
                                key={m.value}
                                className={`text-center py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors border ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-200 hover:border-blue-400'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedMonths([...selectedMonths, m.value]);
                                    else setSelectedMonths(selectedMonths.filter((val) => val !== m.value));
                                  }}
                                />
                                {m.label.slice(0, 3)}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Years</label>
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = (new Date().getFullYear() - i).toString();
                            const isSelected = selectedYears.includes(year);
                            return (
                              <label
                                key={year}
                                className={`text-center py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors border ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-200 hover:border-blue-400'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedYears([...selectedYears, year]);
                                    else setSelectedYears(selectedYears.filter((val) => val !== year));
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
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              {loading && <CircularProgress progress={progress} color="#2563EB" size={40} />}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export ESIC
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

