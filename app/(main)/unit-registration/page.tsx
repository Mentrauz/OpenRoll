'use client';
import { useState, useEffect, useMemo } from 'react';
import { Building2, Check, Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { showErrorToast, showSuccessToast } from '@/lib/toast-config';
import AnimatedSelect from '@/components/AnimatedSelect';
import ModernDatePicker from '@/components/ModernDatePicker';
import { statesAndDistricts } from '@/app/data/states-districts';

// Initial form state
const initialFormState = {
  unitNumber: '',
  unitName: '',
  gstNumber: '',
  address: '',
  state: '',
  district: '',
  supervisor: '',
  contractStartDate: '',
  contractEndDate: '',
  phoneNumber: '',
  pfBasic: false,
  pfVDA: false,
  pfHRA: false,
  pfConv: false,
  pfWash: false,
  pfOther: false,
  pfNewRule: false,
  esiBasic: false,
  esiVDA: false,
  esiHRA: false,
  esiConv: false,
  esiWash: false,
  esiOther: false,
  lwfOn: '',
  lwfLimit: '',
  lwfRate: '',
  ptaxMinLimit: '',
  ptaxMaxLimit: '',
  monthDaysType: 'month',
  monthDays: 30,
};

export default function UnitRegistration() {
  const [formData, setFormData] = useState(initialFormState);
  const [gstNumber, setGstNumber] = useState('');
  const [gstValidationStatus, setGstValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [gstValidationMessage, setGstValidationMessage] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get states array from statesAndDistricts keys
  const states = Object.keys(statesAndDistricts);

  // Calculate form completion percentage
  const formCompletion = useMemo(() => {
    const requiredFields = [
      'unitNumber', 'unitName', 'gstNumber', 'address', 'state',
      'district', 'supervisor', 'contractStartDate', 'contractEndDate', 'phoneNumber'
    ];
    const filledFields = requiredFields.filter(field => {
      const value = field === 'gstNumber' ? gstNumber : formData[field as keyof typeof formData];
      return value && value.toString().trim() !== '';
    });
    const percentage = Math.round((filledFields.length / requiredFields.length) * 100);
    return { percentage, filled: filledFields.length, total: requiredFields.length };
  }, [formData, gstNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (gstValidationStatus !== 'valid') {
      showErrorToast('Please enter a valid GST number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, gstNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register unit');
      }

      showSuccessToast('Unit registered successfully!');
      handleReset();
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to register unit');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'state') {
      const districts = statesAndDistricts[value as keyof typeof statesAndDistricts] || [];
      setAvailableDistricts(districts);
      setFormData(prev => ({ ...prev, [name]: value, district: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

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

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
      setFormData(initialFormState);
      setGstNumber('');
      setGstValidationStatus('idle');
      setGstValidationMessage('');
      setAvailableDistricts([]);
    }
  };

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
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen pb-20">
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          {/* Unit Registration Title - Left Side */}
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Unit Registration</h1>
          </div>

          {/* Form Completion Indicator - Right Side */}
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
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Main Grid Container */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left Column (Wider) */}
            <div className="xl:col-span-2 space-y-6">

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
                      <div className={`mt-2 text-sm flex items-center gap-2 ${gstValidationStatus === 'valid' ? 'text-emerald-600' : 'text-red-600'
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                      onChange={handleChange}
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
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        maxLength={10}
                      />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-6">
                      <ModernDatePicker
                        label="Start Date"
                        value={formData.contractStartDate}
                        onChange={(value) => handleChange({ target: { name: 'contractStartDate', value } } as any)}
                        mode="calendar"
                      />
                      <ModernDatePicker
                        label="End Date"
                        value={formData.contractEndDate}
                        onChange={(value) => handleChange({ target: { name: 'contractEndDate', value } } as any)}
                        mode="calendar"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Split for Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* PF Settings */}
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
                    <CheckboxItem label="Basic" name="pfBasic" checked={formData.pfBasic} onChange={handleChange} />
                    <CheckboxItem label="VDA" name="pfVDA" checked={formData.pfVDA} onChange={handleChange} />
                    <CheckboxItem label="HRA" name="pfHRA" checked={formData.pfHRA} onChange={handleChange} />
                    <CheckboxItem label="Conv" name="pfConv" checked={formData.pfConv} onChange={handleChange} />
                    <CheckboxItem label="Wash" name="pfWash" checked={formData.pfWash} onChange={handleChange} />
                    <CheckboxItem label="Other" name="pfOther" checked={formData.pfOther} onChange={handleChange} />
                    <div className="col-span-2 mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                      <CheckboxItem label="New Rule Apply" name="pfNewRule" checked={formData.pfNewRule} onChange={handleChange} />
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
                    <CheckboxItem label="Basic" name="esiBasic" checked={formData.esiBasic} onChange={handleChange} />
                    <CheckboxItem label="VDA" name="esiVDA" checked={formData.esiVDA} onChange={handleChange} />
                    <CheckboxItem label="HRA" name="esiHRA" checked={formData.esiHRA} onChange={handleChange} />
                    <CheckboxItem label="Conv" name="esiConv" checked={formData.esiConv} onChange={handleChange} />
                    <CheckboxItem label="Wash" name="esiWash" checked={formData.esiWash} onChange={handleChange} />
                    <CheckboxItem label="Other" name="esiOther" checked={formData.esiOther} onChange={handleChange} />
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* Location Details */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <SectionHeader title="Location" />
                <div className="p-6 space-y-5">
                  <AnimatedSelect
                    id="state-selector-reg"
                    label="State"
                    value={formData.state}
                    onChange={(value) => handleChange({ target: { name: 'state', value } } as any)}
                    options={states.map((state) => ({ value: state, label: state }))}
                    placeholder="Select State"
                    required
                  />
                  <AnimatedSelect
                    id="district-selector-reg"
                    label="District"
                    value={formData.district}
                    onChange={(value) => handleChange({ target: { name: 'district', value } } as any)}
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
                      onChange={handleChange}
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
                      onChange={(value) => handleChange({ target: { name: 'lwfOn', value } } as any)}
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
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-black text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Max</label>
                        <input
                          type="number"
                          name="ptaxMaxLimit"
                          value={formData.ptaxMaxLimit}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-black text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Settings */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <SectionHeader title="Calculation Logic" />
                <div className="p-6 space-y-4">
                  <AnimatedSelect
                    id="month-days-type-selector-reg"
                    label="Days Calculation"
                    value={formData.monthDaysType}
                    onChange={(value) => handleChange({ target: { name: 'monthDaysType', value } } as any)}
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
                        onChange={handleChange}
                        min="1" max="31"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={handleReset}
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
              <span>{isSubmitting ? 'Processing...' : 'Register Unit'}</span>
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}