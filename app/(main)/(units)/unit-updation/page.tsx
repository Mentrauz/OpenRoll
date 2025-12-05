'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { statesAndDistricts } from '@/app/data/states-districts';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

import { Building2, Loader2, Save, Check } from 'lucide-react';
import { globalLoadingState } from '@/components/Layout';
import AnimatedSelect from '@/components/AnimatedSelect';
import ModernDatePicker from '@/components/ModernDatePicker';
import LoadingSpinner from '@/components/LoadingSpinner';

// Add to your formData interface and initialState
interface UnitFormData {
  unitNumber: string;
  unitName: string;
  address: string;
  state: string;
  district: string;
  supervisor: string;
  phoneNumber: string;
  gstNumber: string;
  contractStartDate: string;
  contractEndDate: string;
  unitType: 'Active' | 'Inactive';
  foodAmt: boolean;
  prodAll: boolean;
  nightShiftAll: boolean;
  altAward: boolean;
  pfNewRule: boolean;
  pfBasic: boolean;
  pfVDA: boolean;
  pfHRA: boolean;
  pfConv: boolean;
  pfWash: boolean;
  pfOther: boolean;
  pfAddAll: boolean;
  pfSplAll: boolean;
  esiBasic: boolean;
  esiVDA: boolean;
  esiHRA: boolean;
  esiConv: boolean;
  esiWash: boolean;
  esiOther: boolean;
  esiAddAll: boolean;
  esiSplAll: boolean;
  lwfOn: 'Gross Earn(Salary+OT)';
  lwfLimit: number;
  lwfRate: number;
  ptaxMinLimit: number;
  ptaxMaxLimit: number;
  dateOfContract: string;
  dateOfTer: string;
  notes: string;
  fcRate: number;
  appNewRule: boolean;
  monthDays: number;
  monthDaysType: 'month' | 'specific';
  contractStatus: 'active' | 'inactive';
}

const initialFormState = {
  unitNumber: '',
  unitName: '',
  address: '',
  state: '',
  district: '',
  supervisor: '',
  phoneNumber: '',
  gstNumber: '',
  contractStartDate: '',
  contractEndDate: '',
  unitType: 'Active',
  foodAmt: false,
  prodAll: false,
  nightShiftAll: false,
  altAward: false,
  pfNewRule: false,
  pfBasic: false,
  pfVDA: false,
  pfHRA: false,
  pfConv: false,
  pfWash: false,
  pfOther: false,
  pfAddAll: false,
  pfSplAll: false,
  esiBasic: false,
  esiVDA: false,
  esiHRA: false,
  esiConv: false,
  esiWash: false,
  esiOther: false,
  esiAddAll: false,
  esiSplAll: false,
  lwfOn: 'Gross Earn(Salary+OT)',
  lwfLimit: 31,
  lwfRate: 0.2,
  ptaxMinLimit: 0,
  ptaxMaxLimit: 0,
  dateOfContract: '',
  dateOfTer: '',
  notes: '',
  fcRate: 0,
  appNewRule: false,
  monthDays: 31,
  monthDaysType: 'month' as 'month' | 'specific',
  contractStatus: 'active',
};



// First, create a unit selection component
const UnitSelector = ({ onUnitSelect, selectedUnit, units, loading }) => {

  return (
    <AnimatedSelect
      id="unit-selector-component"
      value={selectedUnit?._id || ''}
      onChange={(value) => {
        const selected = units.find(unit => unit._id === value);
        onUnitSelect(selected);
      }}
      options={units.map((unit) => ({
        value: unit._id,
        label: unit.unitName
      }))}
      placeholder="Select a unit"
      disabled={loading}
    />
  );
};

export default function UnitUpdationPage() {
  const router = useRouter();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const states = Object.keys(statesAndDistricts);
  const [gstValidationStatus, setGstValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [gstValidationMessage, setGstValidationMessage] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [monthDays, setMonthDays] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logic for form completion calculation
  const formCompletion = useMemo(() => {
    const requiredFields = [
      formData.gstNumber, formData.unitNumber, formData.unitName, formData.address,
      formData.state, formData.district, formData.supervisor, formData.phoneNumber,
    ];
    const filled = requiredFields.filter(field => field && field.toString().trim() !== '').length;
    const total = requiredFields.length;
    const percentage = Math.round((filled / total) * 100);
    return { filled, total, percentage };
  }, [formData]);

  // Memoize form handlers
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleStateChange = useCallback((newState: string) => {
    setFormData(prev => ({
      ...prev,
      state: newState,
      district: ''
    }));
    setAvailableDistricts(statesAndDistricts[newState] || []);
  }, []);

  const handlePFSelectAll = (checked: boolean) => {
    setFormData(prev => ({
      ...prev, pfBasic: checked, pfVDA: checked, pfHRA: checked, pfConv: checked, pfWash: checked, pfOther: checked,
    }));
  };

  const handleESISelectAll = (checked: boolean) => {
    setFormData(prev => ({
      ...prev, esiBasic: checked, esiVDA: checked, esiHRA: checked, esiConv: checked, esiWash: checked, esiOther: checked,
    }));
  };

  // Modify fetchUnits to silently handle the error
  const fetchUnits = useCallback(async (forceRefresh = false) => {
    try {
      const timestamp = Date.now();
      const url = forceRefresh
        ? `/api/units/get-units?t=${timestamp}`
        : '/api/units/get-units';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store'
      });

      let data;
      try {
        data = await response.json();
        if (data?.success) {
          setUnits(data.units);
        }
      } catch (parseError) {
        // Silently ignore JSON parsing error
      }
    } catch (error) {
      // Silently handle fetch errors
    } finally {
      setIsLoading(false);
      globalLoadingState.setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Modify handleUnitSelect to be simpler and more robust
  const handleUnitSelect = useCallback((unit) => {
    if (!unit) {
      setSelectedUnit(null);
      setFormData(initialFormState);
      return;
    }

    try {
      globalLoadingState.setIsLoading(true);
      setSelectedUnit(unit);
      setAvailableDistricts(statesAndDistricts[unit.state] || []);
      setFormData({
        ...initialFormState,
        ...unit,
        contractStatus: unit.contractStatus || 'active' // Set default if not present
      });
      setGstNumber(unit.gstNumber || '');
    } catch (error) {
    } finally {
      globalLoadingState.setIsLoading(false);
    }
  }, []);

  // Modify handleSubmit with similar error handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) {
      toast.error('Please select a unit to update');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Updating unit...');
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _id: selectedUnit._id
        }),
        cache: 'no-store'  // Disable caching
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        toast.error('Failed to update unit', { id: loadingToast });
        return;
      }

      if (result?.success) {
        toast.success('Unit updated successfully!', { id: loadingToast });
        await fetchUnits(true); // Force refresh after update
        // Clear selected unit to force user to reselect
        setSelectedUnit(null);
        setFormData(initialFormState);
      } else {
        toast.error(result?.message || 'Failed to update unit', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Failed to update unit', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUnit, formData, fetchUnits]);

  const validateGSTNumber = async (gstNumber: string) => {
    try {
      setGstValidationStatus('validating');
      const response = await fetch(`https://sheet.gstincheck.co.in/check/54bfc397944a8c4e4a8eb8968e8ae26d/${gstNumber}`);
      const data = await response.json();

      if (data.flag) {
        setGstValidationStatus('valid');
        setGstValidationMessage('Valid GST number');
        setFormData(prev => ({
          ...prev,
          gstNumber,
          unitName: data.data?.tradeNam || data.data?.lgnm || prev.unitName,
          address: data.data?.pradr?.addr ? [
            data.data.pradr.addr.bno, data.data.pradr.addr.st, data.data.pradr.addr.loc,
            data.data.pradr.addr.dst, data.data.pradr.addr.pncd
          ].filter(Boolean).join(', ') : prev.address,
          state: data.data?.pradr?.addr?.stcd || prev.state,
          district: data.data?.pradr?.addr?.dst || prev.district,
        }));

        if (data.data?.pradr?.addr?.stcd) {
          const districts = statesAndDistricts[data.data.pradr.addr.stcd] || [];
          setAvailableDistricts(districts);
        }
      } else {
        setGstValidationStatus('invalid');
        setGstValidationMessage(data.message || 'Invalid GST number');
      }
    } catch (error) {
      setGstValidationStatus('invalid');
      setGstValidationMessage('Error validating GST number');
    }
  };

  // Handle navigation
  const handleNavigation = useCallback((path: string) => {
    setSelectedUnit(null);
    setFormData(initialFormState);
    globalLoadingState.setIsLoading(false);
    setTimeout(() => router.push(path), 0);
  }, [router]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      globalLoadingState.setIsLoading(false);
      setSelectedUnit(null);
      setFormData(initialFormState);
    };
  }, []);

  // Modify the useEffect for month days
  useEffect(() => {
    const fetchMonthDays = async () => {
      try {
        const response = await fetch('/api/month-days/get-month-days');
        const data = await response.json();

        if (data.success) {
          const daysObject = data.monthDays.reduce((acc, item) => {
            acc[item.month] = item.days;
            return acc;
          }, {});
          setMonthDays(daysObject);
        }
        // Silently handle non-success cases without showing errors
      } catch (error) {
        // Only log to console, don't show error to user
      } finally {
        setIsLoading(false);
        globalLoadingState.setIsLoading(false); // Stop the loading bar
      }
    };

    fetchMonthDays();
  }, []);

  // Memoize districts options
  const districtOptions = useMemo(() => (
    availableDistricts.map(district => (
      <option key={district} value={district}>{district}</option>
    ))
  ), [availableDistricts]);

  // Show inline loading when form data is loading initially

  // Helper component for Section Headers to maintain consistency
  const SectionHeader = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {children}
    </div>
  );

  // Helper component for Checkboxes
  const CheckboxItem = ({ label, name, checked, onChange }: any) => (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group">
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-gray-300 bg-white dark:bg-gray-800'
        }`}>
        {checked && <Check className="w-3.5 h-3.5 text-white dark:text-black" />}
      </div>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
      <span className={`text-sm font-medium transition-colors ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700'
        }`}>
        {label}
      </span>
    </label>
  );

  return (
    <div className="bg-white dark:bg-white min-h-screen pb-20 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"></div>
              <div className="w-8 h-8 rounded-full border-2 border-t-gray-800 dark:border-t-white border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0 animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading unit data...</p>
          </div>
        </div>
      )}
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          {/* Unit Updation Title - Left Side */}
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Unit Updation</h1>
          </div>

          {/* Form Completion Indicator - Right Side */}
          {selectedUnit && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Form Completion</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formCompletion.percentage}%</p>
              </div>
              <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 dark:bg-white transition-all duration-500"
                  style={{ width: `${formCompletion.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px]">

        {/* REMOVED THE OUTER WRAPPER DIV HERE to fix the "bg container type thing" */}

        {/* Unit Selector - Now an individual card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
          <SectionHeader title="Select Unit to Update">
            <button
              onClick={() => fetchUnits(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </SectionHeader>
          <div className="p-6">
            <UnitSelector
              onUnitSelect={handleUnitSelect}
              selectedUnit={selectedUnit}
              units={units}
              loading={isLoading}
            />
          </div>
        </div>

        {selectedUnit ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Main Container */}
            <div className="space-y-6">

              {/* Unit Details Card */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <SectionHeader title="Unit Details" />
                  <div className="p-6 space-y-6">

                    {/* GST Input */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GST Number <span className="text-red-500">*</span>
                    </label>
                      <div className="relative">
                    <input
                      type="text"
                          name="gstNumber"
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm bg-transparent dark:text-white placeholder:text-gray-400"
                          value={gstNumber}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().trim();
                            setGstNumber(value);
                            if (value.length === 15) validateGSTNumber(value);
                            else {
                              setGstValidationStatus('idle');
                              setGstValidationMessage('');
                            }
                          }}
                          placeholder="Enter 15-digit GST number"
                          maxLength={15}
                        />
                        {gstValidationStatus === 'validating' && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Validation Messages - Styling updated to be subtler */}
                      {gstValidationStatus !== 'idle' && gstValidationStatus !== 'validating' && (
                        <div className={`mt-2 text-sm flex items-center gap-2 ${
                          gstValidationStatus === 'valid' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {gstValidationStatus === 'valid' ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center font-bold">!</span>}
                          {gstValidationMessage}
                        </div>
                      )}
                    </div>

                    {/* Unit Number and Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Unit Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="unitNumber"
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm bg-transparent dark:text-white placeholder:text-gray-400"
                      value={formData.unitNumber}
                      onChange={(e) => handleInputChange('unitNumber', e.target.value)}
                          placeholder="e.g. 101"
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                          name="unitName"
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm bg-transparent dark:text-white placeholder:text-gray-400"
                      value={formData.unitName}
                      onChange={(e) => handleInputChange('unitName', e.target.value)}
                          placeholder="Company Name Pvt Ltd"
                    />
                  </div>
                    </div>

                    {/* Address */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="address"
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm resize-none bg-transparent dark:text-white placeholder:text-gray-400"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter complete address"
                    />
              </div>

                    {/* Dates & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                          name="phoneNumber"
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm bg-transparent dark:text-white placeholder:text-gray-400"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          placeholder="+91 98765 43210"
                          maxLength={10}
                      />
                    </div>
                      <div className="md:col-span-2 grid grid-cols-2 gap-6">
                    <ModernDatePicker
                          label="Start Date"
                      value={formData.contractStartDate}
                      onChange={(value) => handleInputChange('contractStartDate', value)}
                      mode="calendar"
                    />
                        <ModernDatePicker
                          label="End Date"
                          value={formData.contractEndDate}
                          onChange={(value) => handleInputChange('contractEndDate', value)}
                          mode="calendar"
                        />
                  </div>
                </div>
              </div>
            </div>

                {/* Two Column Split for Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <SectionHeader title="PF Settings">
                      <button
                        type="button"
                                onClick={() => handlePFSelectAll(!formData.pfBasic)}
                                className="text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                            >
                                Select All
                      </button>
                        </SectionHeader>
                        <div className="p-6 grid grid-cols-2 gap-2">
                            <CheckboxItem label="Basic" name="pfBasic" checked={formData.pfBasic} onChange={(e) => handleInputChange('pfBasic', e.target.checked)} />
                            <CheckboxItem label="VDA" name="pfVDA" checked={formData.pfVDA} onChange={(e) => handleInputChange('pfVDA', e.target.checked)} />
                            <CheckboxItem label="HRA" name="pfHRA" checked={formData.pfHRA} onChange={(e) => handleInputChange('pfHRA', e.target.checked)} />
                            <CheckboxItem label="Conv" name="pfConv" checked={formData.pfConv} onChange={(e) => handleInputChange('pfConv', e.target.checked)} />
                            <CheckboxItem label="Wash" name="pfWash" checked={formData.pfWash} onChange={(e) => handleInputChange('pfWash', e.target.checked)} />
                            <CheckboxItem label="Other" name="pfOther" checked={formData.pfOther} onChange={(e) => handleInputChange('pfOther', e.target.checked)} />
                            <div className="col-span-2 mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                <CheckboxItem label="New Rule Apply" name="pfNewRule" checked={formData.pfNewRule} onChange={(e) => handleInputChange('pfNewRule', e.target.checked)} />
                </div>
              </div>
            </div>

              {/* ESI Settings */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <SectionHeader title="ESI Settings">
                             <button
                                type="button"
                                onClick={() => handleESISelectAll(!formData.esiBasic)}
                                className="text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                            >
                                Select All
                            </button>
                        </SectionHeader>
                        <div className="p-6 grid grid-cols-2 gap-2">
                            <CheckboxItem label="Basic" name="esiBasic" checked={formData.esiBasic} onChange={(e) => handleInputChange('esiBasic', e.target.checked)} />
                            <CheckboxItem label="VDA" name="esiVDA" checked={formData.esiVDA} onChange={(e) => handleInputChange('esiVDA', e.target.checked)} />
                            <CheckboxItem label="HRA" name="esiHRA" checked={formData.esiHRA} onChange={(e) => handleInputChange('esiHRA', e.target.checked)} />
                            <CheckboxItem label="Conv" name="esiConv" checked={formData.esiConv} onChange={(e) => handleInputChange('esiConv', e.target.checked)} />
                            <CheckboxItem label="Wash" name="esiWash" checked={formData.esiWash} onChange={(e) => handleInputChange('esiWash', e.target.checked)} />
                            <CheckboxItem label="Other" name="esiOther" checked={formData.esiOther} onChange={(e) => handleInputChange('esiOther', e.target.checked)} />
                  </div>
                </div>

              </div>

                {/* Location Details */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <SectionHeader title="Location" />
                  <div className="p-6 space-y-5">
                    <AnimatedSelect
                      id="state-selector-reg"
                      label="State"
                      value={formData.state}
                      onChange={(value) => handleStateChange(value)}
                      options={states.map((state) => ({ value: state, label: state }))}
                      placeholder="Select State"
                      required
                    />
                    <AnimatedSelect
                      id="district-selector-reg"
                      label="District"
                      value={formData.district}
                      onChange={(value) => handleInputChange('district', value)}
                      options={availableDistricts.map((district) => ({ value: district, label: district }))}
                      placeholder="Select District"
                      disabled={!formData.state}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Supervisor <span className="text-red-500">*</span>
                    </label>
                      <input
                        type="text"
                        name="supervisor"
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm bg-transparent dark:text-white placeholder:text-gray-400"
                        value={formData.supervisor}
                        onChange={(e) => handleInputChange('supervisor', e.target.value)}
                        placeholder="Supervisor Name"
                      />
                  </div>
                </div>
              </div>

                {/* LWF & Professional Tax */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <SectionHeader title="Tax & Deductions" />
                  <div className="p-6 space-y-6">
                    {/* LWF Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">LWF Settings</h3>
                      <AnimatedSelect
                            id="lwf-on-selector-reg"
                        label="LWF On"
                        value={formData.lwfOn}
                        onChange={(value) => handleInputChange('lwfOn', value)}
                            options={[{ value: 'Gross Earn(Salary', label: 'Gross Earn(Salary)' }]}
                            placeholder="Select Basis"
                        />
                        <div className="grid grid-cols-2 gap-4">
                    <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Limit</label>
                      <input
                        type="number"
                                    name="lwfLimit"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-black text-sm"
                        value={formData.lwfLimit}
                        onChange={(e) => handleInputChange('lwfLimit', Number(e.target.value))}
                      />
                    </div>
                    <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                      <input
                        type="number"
                                    name="lwfRate"
                        step="0.1"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-black text-sm"
                        value={formData.lwfRate}
                        onChange={(e) => handleInputChange('lwfRate', Number(e.target.value))}
                      />
                </div>
              </div>
            </div>

                    <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-4"></div>

                    {/* PTax Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prof. Tax Limits</h3>
                        <div className="grid grid-cols-2 gap-4">
                  <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Min</label>
                    <input
                      type="number"
                                    name="ptaxMinLimit"
                      value={formData.ptaxMinLimit}
                      onChange={(e) => handleInputChange('ptaxMinLimit', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-black text-sm"
                    />
                  </div>
                  <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Max</label>
                    <input
                      type="number"
                                    name="ptaxMaxLimit"
                      value={formData.ptaxMaxLimit}
                      onChange={(e) => handleInputChange('ptaxMaxLimit', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-black text-sm"
                    />
                            </div>
                        </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <SectionHeader title="Calculation Logic" />
              <div className="p-6 space-y-4">
                  <AnimatedSelect
                        id="month-days-type-selector-reg"
                        label="Days Calculation"
                    value={formData.monthDaysType}
                        onChange={(value) => handleInputChange('monthDaysType', value)}
                    options={[
                            { value: 'month', label: 'Actual Days in Month' },
                            { value: 'specific', label: 'Fixed Days' }
                    ]}
                    placeholder="Select Type"
                  />
                {formData.monthDaysType === 'specific' && (
                  <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fixed Days Count</label>
                    <input
                      type="number"
                                name="monthDays"
                      value={formData.monthDays}
                                onChange={(e) => handleInputChange('monthDays', Number(e.target.value))}
                                min="1" max="31"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="flex items-center justify-start gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                  if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
                      setFormData(initialFormState);
                      setSelectedUnit(null);
                    setGstNumber('');
                    setGstValidationStatus('idle');
                    setGstValidationMessage('');
                    setAvailableDistricts([]);
                    }
                  }}
                disabled={isSubmitting}
                  className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
                >
                  Reset
                </button>
                <button
                  type="submit"
                disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
                >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Updating...' : 'Update Unit'}</span>
                </button>
            </div>
          </form>
        ) : null}

      </main>
    </div>
  );
}