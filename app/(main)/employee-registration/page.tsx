'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Save, User, Briefcase, DollarSign, FileText, UserPlus, Upload, Check, AlertCircle, X, CheckCircle, Loader2 } from 'lucide-react';

import '@/styles/datepicker.css';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import AnimatedSelect from '@/components/AnimatedSelect';
import ModernDatePicker from '@/components/ModernDatePicker';

interface FormData {
  name: string;
  gender: 'male' | 'female' | '';
  dob: string;
  guardianName: string;
  relation: 'Father' | 'Husband' | '';
  maritalStatus: 'Single' | 'Married' | 'Widow' | 'Divorcee' | '';
  unitName: string;
  empId: string;
  esicNumber: string;
  uanNumber: string;
  lwfId: string;
  doj: string;
  basic: string;
  hra: string;
  conv: string;
  washAll: string;
  othAll: string;
  grossRate: string;
  mobileNumber: string;
  aadharNumber: string;
  aadharName: string;
  bankAccount: string;
  ifscCode: string;
  aadharVerified: boolean;
  address: string;
  bankName: string;
}

interface Unit {
  _id: string;
  unitName: string;
}

const initialFormState: FormData = {
  name: '',
  gender: '',
  dob: '',
  guardianName: '',
  relation: '',
  maritalStatus: '',
  unitName: '',
  empId: '',
  esicNumber: '',
  uanNumber: '',
  lwfId: '',
  doj: '',
  basic: '',
  hra: '',
  conv: '',
  washAll: '',
  othAll: '',
  grossRate: '0',
  mobileNumber: '',
  aadharNumber: '',
  aadharName: '',
  bankAccount: '',
  ifscCode: '',
  aadharVerified: false,
  address: '',
  bankName: '',
};

export default function EmployeeRegistration() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [esicFile, setEsicFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [idExists, setIdExists] = useState(false);
  const [isVerifyingAadhar, setIsVerifyingAadhar] = useState(false);
  const [aadharVerificationData, setAadharVerificationData] = useState<any>(null);
  const [showAadharPopup, setShowAadharPopup] = useState(false);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [clientId, setClientId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isBankVerifying, setIsBankVerifying] = useState(false);
  const [showBankPopup, setShowBankPopup] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);
  const [bankData, setBankData] = useState<any>(null);

  // Calculate form completion
  const formCompletion = useMemo(() => {
    const requiredFields = [
      formData.name,
      formData.gender,
      formData.dob,
      formData.guardianName,
      formData.relation,
      formData.maritalStatus,
      formData.unitName,
      formData.empId,
      formData.doj,
      formData.mobileNumber,
      formData.aadharNumber,
    ];
    
    const filled = requiredFields.filter(field => field && field.toString().trim() !== '').length;
    const total = requiredFields.length;
    const percentage = Math.round((filled / total) * 100);
    
    return { filled, total, percentage };
  }, [formData]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units/get-units');
        const data = await response.json();
        
        if (data.success) {
          setUnits(data.units);
        } else {
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const calculateGrossRate = (values: Partial<FormData>) => {
    const numbers = {
      basic: parseFloat(values.basic || '0'),
      hra: parseFloat(values.hra || '0'),
      conv: parseFloat(values.conv || '0'),
      washAll: parseFloat(values.washAll || '0'),
      othAll: parseFloat(values.othAll || '0'),
    };

    return (
      numbers.basic +
      numbers.hra +
      numbers.conv +
      numbers.washAll +
      numbers.othAll
    ).toFixed(2);
  };

  const checkEmployeeId = async (id: string) => {
    if (!id) return;
    
    //
    setIsCheckingId(true);
    
    try {
      //
      const response = await fetch('/api/employees/check-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ empId: id }),
      });

      //
      const data = await response.json();
      //

      setIdExists(data.exists);
      
      if (data.exists) {
        toast.error('Employee ID already exists');
      } else {
        toast.success('Employee ID is available');
      }

    } catch (error) {
      toast.error('Failed to check employee ID');
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // If gender is changed to male, automatically set relation to Father
      if (name === 'gender' && value === 'male') {
        newData.relation = 'Father';
      }
      
      // If relation is changed to Husband
      if (name === 'relation' && value === 'Husband') {
        newData.gender = 'female';
        newData.maritalStatus = 'Married';
      }

      // Handle numeric fields
      if (name === 'mobileNumber') {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length <= 10) {
          newData[name] = numericValue;
        } else {
          return prev; // Don't update if exceeds length
        }
      } else if (name === 'aadharNumber') {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length <= 12) {
          newData[name] = numericValue;
        } else {
          return prev; // Don't update if exceeds length
        }
      } else if (['basic', 'hra', 'conv', 'washAll', 'othAll'].includes(name)) {
        const numericValue = value.replace(/[^\d.]/g, '');
        if (numericValue.split('.').length > 2) return prev;
        
        newData[name] = numericValue;
        newData.grossRate = calculateGrossRate(newData);
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (idExists) {
      toast.error('Please use a different Employee ID');
      return;
    }

    // Initial loading toast
    const loadingToast = toast.loading('Uploading employee...', {
      position: 'top-center',
    });
    
    try {
      if (!formData.unitName) {
        toast.error('Please select a unit', {
          id: loadingToast,
          duration: 3000,
        });
        return;
      }

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Success toast
        toast.success('Employee uploaded!', {
          id: loadingToast,
          duration: 3000,
          icon: '✅',
        });
        setFormData(initialFormState);
        if (data.createdBy) {
          toast.success(`Created by ${data.createdBy}`);
        }
      } else {
        throw new Error(data.message || 'Failed to upload employee');
      }

    } catch (error) {
      toast.error('Failed to upload employee. Please try again.', {
        id: loadingToast,
        duration: 3000,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setEsicFile(file);
    } else {
      toast.error('Please select a PDF file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async () => {
    if (!esicFile || !formData.empId) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', esicFile);
    formDataUpload.append('empId', formData.empId);

    try {
      const response = await fetch('/api/upload-esic', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('ESIC Certificate uploaded successfully');
      setEsicFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to upload ESIC Certificate');
    }
  };

  const generateOtp = async () => {
    if (!formData.aadharNumber || formData.aadharNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhar number');
      return;
    }

    setIsGeneratingOtp(true);
    
    try {
      const response = await fetch('/api/verify-aadhar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          aadharNumber: formData.aadharNumber,
          action: 'generateOtp'
        }),
      });

      const data = await response.json();
      //

      if (data.success) {
        toast.success('OTP sent successfully to your registered mobile number');
        setClientId(data.clientId);
        setOtpSent(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }

    setIsVerifyingOtp(true);
    
    try {
      const response = await fetch('/api/verify-aadhar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'verifyOtp',
          clientId: clientId,
          otp: otpValue
        }),
      });

      const data = await response.json();
      //

      if (data.success) {
        toast.success('Aadhar verification successful!');
        setAadharVerificationData(data.aadharData);
        setShowAadharPopup(true);
        setFormData(prev => ({
          ...prev,
          aadharVerified: true,
          aadharName: data.aadharData.name || prev.aadharName
        }));
        setOtpSent(false); // Reset OTP flow
        setOtpValue('');
      } else {
        toast.error(data.message || 'OTP verification failed');
      }
    } catch (error) {
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Function to close the Aadhar verification popup
  const closeAadharPopup = () => {
    setShowAadharPopup(false);
  };

  const verifyBankAccount = async () => {
    if (!formData.bankAccount || !formData.ifscCode) {
      toast.error('Please enter both account number and IFSC code');
      return;
    }
    
    setIsBankVerifying(true);
    
    try {
      const response = await fetch('/api/verify-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: formData.bankAccount,
          ifscCode: formData.ifscCode
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Bank account verified successfully');
        setBankVerified(true);
        setBankData(result.data);
        setShowBankPopup(true);
        
        // Auto-fill form fields with verified data
        setFormData(prev => ({
          ...prev,
          bankName: result.data.bankName || prev.bankName,
          // Add other fields you want to auto-fill
        }));
      } else {
        toast.error(result.message || 'Bank verification failed');
        setBankVerified(false);
      }
    } catch (error) {
      toast.error('Failed to verify bank account. Please try again.');
    } finally {
      setIsBankVerifying(false);
    }
  };

  // Function to close the bank popup
  const closeBankPopup = () => {
    setShowBankPopup(false);
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
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
        checked ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-gray-300 bg-white dark:bg-gray-800'
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
      <span className={`text-sm font-medium transition-colors ${
        checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700'
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
          {/* Employee Registration Title - Left Side */}
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Employee Registration</h1>
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Details Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <SectionHeader title="Personal Details" />
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm bg-transparent dark:text-white placeholder:text-gray-400"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <AnimatedSelect
                  id="gender"
                  label="Gender*"
                  value={formData.gender}
                  onChange={(value) => handleChange({
                    target: { name: 'gender', value }
                  } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                  ]}
                  placeholder="Select Gender"
                  disabled={formData.relation === 'Husband'}
                  required
                />
              </div>

              <ModernDatePicker
                label="Date of Birth"
                value={formData.dob}
                onChange={(value) => handleChange({ target: { name: 'dob', value } } as any)}
                required
                mode="calendar"
              />

              <div>
                    <label htmlFor="guardianName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Guardian's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="guardianName"
                  name="guardianName"
                  required
                  value={formData.guardianName}
                  onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm bg-transparent dark:text-white placeholder:text-gray-400"
                      placeholder="Enter guardian's name"
                />
              </div>

                  <div>
                <AnimatedSelect
                  id="relation"
                  label="Relation*"
                  value={formData.relation}
                  onChange={(value) => handleChange({
                    target: { name: 'relation', value }
                  } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: 'Father', label: 'Father' },
                    { value: 'Husband', label: 'Husband' }
                  ]}
                  placeholder="Select Relation"
                  required
                />
              </div>

              <div>
                <AnimatedSelect
                  id="maritalStatus"
                  label="Marital Status*"
                  value={formData.maritalStatus}
                  onChange={(value) => handleChange({
                    target: { name: 'maritalStatus', value }
                  } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Widow', label: 'Widow' },
                    { value: 'Divorcee', label: 'Divorcee' }
                  ]}
                  placeholder="Select Marital Status"
                  disabled={formData.relation === 'Husband'}
                  required
                />
              </div>
            </div>
              </div>
            </div>

            {/* Employment Details and Standard Rates Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Employment Details Section */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <SectionHeader title="Employment Details" />
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <AnimatedSelect
                    id="unitName"
                    label="Unit Name*"
                    value={formData.unitName}
                    onChange={(value) => handleChange({
                      target: { name: 'unitName', value }
                    } as React.ChangeEvent<HTMLSelectElement>)}
                    options={
                      isLoading 
                        ? [{ value: '', label: 'Loading units...', disabled: true }]
                        : units.length > 0 
                        ? units.map((unit) => ({
                            value: unit.unitName,
                            label: unit.unitName
                          }))
                        : [{ value: '', label: 'No units found', disabled: true }]
                    }
                    placeholder="Select Unit"
                    required
                  />
                </div>

                    <div>
                      <label htmlFor="empId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        EMP ID <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="empId"
                      name="empId"
                      required
                      value={formData.empId}
                      onChange={handleChange}
                          className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                            ${idExists ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:ring-purple-200'} 
                            focus:ring-2 focus:border-transparent`}
                      placeholder="Enter EMP ID"
                    />
                    <button
                      type="button"
                          onClick={() => checkEmployeeId(formData.empId)}
                      disabled={!formData.empId || isCheckingId}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#1a365d] to-[#2d3748] text-white rounded-lg hover:from-[#2d3748] hover:to-[#1a365d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm font-semibold shadow-sm"
                        >
                          {isCheckingId ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Checking...</span>
                            </div>
                          ) : 'Check ID'}
                    </button>
                  </div>
                  {idExists && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-700" />
                          <span className="text-sm text-red-700 font-medium">This Employee ID is already in use</span>
                        </div>
                  )}
                </div>

                <ModernDatePicker
                  label="Date of Joining"
                  value={formData.doj}
                  onChange={(value) => handleChange({ target: { name: 'doj', value } } as any)}
                  required
                  mode="calendar"
                />

                <div>
                      <label htmlFor="esicNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ESIC Number
                  </label>
                  <input
                    type="text"
                    id="esicNumber"
                    name="esicNumber"
                    maxLength={10}
                    pattern="[0-9]{0,10}"
                    title="Please enter up to 10 digits only"
                    value={formData.esicNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({...prev, esicNumber: value}));
                    }}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                        placeholder="10-digit ESIC number"
                  />
                </div>

                <div>
                      <label htmlFor="uanNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    UAN Number
                  </label>
                  <input
                    type="text"
                    id="uanNumber"
                    name="uanNumber"
                    maxLength={12}
                    pattern="[0-9]{0,12}"
                    title="Please enter up to 12 digits only"
                    value={formData.uanNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({...prev, uanNumber: value}));
                    }}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                        placeholder="12-digit UAN number"
                  />
                </div>

                <div>
                      <label htmlFor="lwfId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    LWF ID
                  </label>
                  <input
                    type="text"
                    id="lwfId"
                    name="lwfId"
                    value={formData.lwfId}
                    onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                        placeholder="Enter LWF ID"
                  />
                </div>

                <div>
                      <label htmlFor="mobileNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    required
                    maxLength={10}
                    value={formData.mobileNumber}
                    onChange={handleChange}
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
                </div>
              </div>

              {/* Standard Rates Section */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <SectionHeader title="Standard Rates" />
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="basic" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Basic
                  </label>
                  <input
                    type="text"
                    id="basic"
                    name="basic"
                    value={formData.basic}
                    onChange={handleChange}
                    placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                  />
                </div>

                    <div>
                      <label htmlFor="hra" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    HRA
                  </label>
                  <input
                    type="text"
                    id="hra"
                    name="hra"
                    value={formData.hra}
                    onChange={handleChange}
                    placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                  />
                </div>

                    <div>
                      <label htmlFor="conv" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Conv.
                  </label>
                  <input
                    type="text"
                    id="conv"
                    name="conv"
                    value={formData.conv}
                    onChange={handleChange}
                    placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                  />
                </div>

                    <div>
                      <label htmlFor="washAll" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Wash. ALL
                  </label>
                  <input
                    type="text"
                    id="washAll"
                    name="washAll"
                    value={formData.washAll}
                    onChange={handleChange}
                    placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                  />
                </div>

                    <div>
                      <label htmlFor="othAll" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Oth. ALL
                  </label>
                  <input
                    type="text"
                    id="othAll"
                    name="othAll"
                    value={formData.othAll}
                    onChange={handleChange}
                    placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                      <label htmlFor="grossRate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Gross Rate
                  </label>
                  <input
                    type="text"
                    id="grossRate"
                    name="grossRate"
                    value={formData.grossRate}
                    readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed text-sm font-medium"
                  />
                </div>
              </div>
                </div>
              </div>
          </div>

            {/* KYC Details Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <SectionHeader title="KYC Details" />
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label htmlFor="aadharNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Aadhar Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="aadharNumber"
                          name="aadharNumber"
                          maxLength={12}
                          value={formData.aadharNumber}
                          onChange={handleChange}
                          placeholder="12-digit Aadhar number"
                          className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm
                            ${formData.aadharVerified ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'} 
                            text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                          disabled={otpSent || formData.aadharVerified}
                        />
                        <button
                          type="button"
                          onClick={otpSent ? verifyOtp : generateOtp}
                          disabled={isGeneratingOtp || isVerifyingOtp || 
                            (!otpSent && (!formData.aadharNumber || formData.aadharNumber.length !== 12)) || 
                            (otpSent && !otpValue)}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#1a365d] to-[#2d3748] text-white rounded-lg hover:from-[#2d3748] hover:to-[#1a365d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm font-semibold shadow-sm"
                        >
                          {isGeneratingOtp ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending...</span>
                            </div>
                          ) : isVerifyingOtp ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Verifying...</span>
                            </div>
                          ) : otpSent ? 'Verify OTP' : 'Send OTP'}
                        </button>
                      </div>
                      
                      {/* OTP input field (shows only when OTP is sent) */}
                      {otpSent && (
                        <div>
                          <label htmlFor="otpValue" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Enter OTP sent to registered mobile
                          </label>
                          <input
                            type="text"
                            id="otpValue"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value)}
                            placeholder="Enter OTP"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      )}
                      
                      {formData.aadharVerified && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-200 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-700" />
                          <span className="text-sm text-green-700 font-medium">Aadhar Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bankAccount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bank A/c Number
                    </label>
                    <input
                      type="text"
                      id="bankAccount"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm
                        ${bankVerified ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'} 
                        text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="Enter bank account number"
                    />
                  </div>

                  <div>
                    <label htmlFor="ifscCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      IFSC Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="ifscCode"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        placeholder="IFSC Code"
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm
                          ${bankVerified ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'} 
                          text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      />
                      <button
                        type="button"
                        onClick={verifyBankAccount}
                        disabled={isBankVerifying || !formData.bankAccount || !formData.ifscCode}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#1a365d] to-[#2d3748] text-white rounded-lg hover:from-[#2d3748] hover:to-[#1a365d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm font-semibold shadow-sm"
                      >
                        {isBankVerifying ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </div>
                        ) : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {bankVerified && (
                    <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-700" />
                      <span className="text-sm text-green-700 font-medium">Bank Account Verified</span>
                    </div>
                  )}

                  <div className="col-span-2">
                    <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 text-sm
                        ${bankVerified ? 'bg-slate-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} 
                        text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="Bank name will auto-fill after verification"
                      readOnly={bankVerified}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ESIC Certificate Upload Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <SectionHeader title="ESIC Certificate Upload" />
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200 cursor-pointer inline-block shadow-sm font-semibold text-sm">
                      <span>Choose File</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!esicFile || !formData.empId}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#1a365d] to-[#2d3748] text-white rounded-lg hover:from-[#2d3748] hover:to-[#1a365d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm"
                    >
                      Upload
                    </button>
                  </div>
                  {!formData.empId && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-blue-700" />
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Please enter Employee ID first to enable file upload
                      </p>
                    </div>
                  )}
                  {esicFile && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                      <Check className="w-4 h-4 text-green-700" />
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Selected file: {esicFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="flex items-center justify-start gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
                    setFormData(initialFormState);
                    setEsicFile(null);
                    setOtpSent(false);
                    setOtpValue('');
                    setBankVerified(false);
                    setIdExists(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting || idExists}
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Processing...' : 'Register Employee'}</span>
              </button>
            </div>
          </form>
      </main>

      {/* Aadhar Verification Popup - Fix the address rendering */}
      {showAadharPopup && aadharVerificationData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aadhar Verification Details</h3>
                <button
                  onClick={closeAadharPopup}
                  className="text-slate-600 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-4">
                  {aadharVerificationData.name && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Name</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">{aadharVerificationData.name}</p>
                    </div>
                  )}
                  
                  {aadharVerificationData.gender && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Gender</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">
                        {aadharVerificationData.gender === "M" ? "Male" : 
                         aadharVerificationData.gender === "F" ? "Female" : 
                         aadharVerificationData.gender}
                      </p>
                    </div>
                  )}
                  
                  {aadharVerificationData.dob && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Date of Birth</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">{aadharVerificationData.dob}</p>
                    </div>
                  )}
                  
                  {aadharVerificationData.guardianName && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Guardian's Name</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">{aadharVerificationData.guardianName}</p>
                    </div>
                  )}
                  
                  {aadharVerificationData.relation && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Relation</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">
                        {aadharVerificationData.relation === "father" ? "Father" : 
                         aadharVerificationData.relation === "husband" ? "Husband" : 
                         aadharVerificationData.relation}
                      </p>
                    </div>
                  )}
                  
                  {/* Properly format address data - Don't render the address object directly */}
                  {aadharVerificationData.address && typeof aadharVerificationData.address === 'object' && (
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Address</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {Object.entries(aadharVerificationData.address)
                          .filter(([_, value]) => value) // Only keep entries with values
                          .map(([_, value]) => value)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {/* Handle string address */}
                  {aadharVerificationData.address && typeof aadharVerificationData.address === 'string' && (
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Address</p>
                      <p className="font-medium text-slate-900 dark:text-white">{aadharVerificationData.address}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    // Parse the date if it exists
                    let dobValue = "";
                    if (aadharVerificationData.rawDob) {
                      try {
                        // Handle YYYY-MM-DD format
                        const dateParts = aadharVerificationData.rawDob.split('-');
                        if (dateParts.length === 3) {
                          const [year, month, day] = dateParts;
                          dobValue = `${year}-${month}-${day}`; // Format as YYYY-MM-DD for date input
                        }
                      } catch (e) {
                      }
                    }

                    // Auto-fill form with verified data
                    setFormData(prev => ({
                      ...prev,
                      aadharVerified: true,
                      aadharName: aadharVerificationData.name || prev.aadharName,
                      name: prev.name || aadharVerificationData.name || "",
                      dob: dobValue || prev.dob,
                      gender: prev.gender || 
                        (aadharVerificationData.gender === "M" ? "male" : 
                         aadharVerificationData.gender === "F" ? "female" : 
                         prev.gender),
                      guardianName: prev.guardianName || aadharVerificationData.guardianName || "",
                      relation: prev.relation || aadharVerificationData.relation || "",
                    }));
                    closeAadharPopup();
                  }}
                  className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
                >
                  Use This Information
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bank Details Verification Popup */}
        {showBankPopup && bankData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Bank Account Verification</h3>
                <button
                  onClick={closeBankPopup}
                  className="text-slate-600 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-4">
                  {bankData.accountHolderName && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Account Holder</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">{bankData.accountHolderName}</p>
                    </div>
                  )}
                  
                  {bankData.bankName && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Bank Name</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">{bankData.bankName}</p>
                    </div>
                  )}
                  
                  {bankData.ifsc && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">IFSC Code</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">{bankData.ifsc}</p>
                    </div>
                  )}
                  
                  {bankData.branchName && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Branch Name</p>
                      <p className="font-medium text-lg text-slate-900 dark:text-white">{bankData.branchName}</p>
                    </div>
                  )}
                  
                  {bankData.branchAddress && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Branch Address</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {bankData.branchAddress}
                        {bankData.city && `, ${bankData.city}`}
                        {bankData.state && `, ${bankData.state}`}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-b pb-3">
                    <p className="text-sm text-slate-600 mb-1">Account Number</p>
                    <p className="font-medium text-lg">
                      {/* Show masked account number for security */}
                      {formData.bankAccount.slice(0, 4)}****{formData.bankAccount.slice(-4)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Verified Account</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    // Auto-fill form fields if they're not already filled
                    setFormData(prev => ({
                      ...prev,
                      aadharName: prev.aadharName || bankData.accountHolderName || "",
                      bankName: bankData.bankName || prev.bankName
                    }));
                    closeBankPopup();
                  }}
                  className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
                >
                  Confirm & Use
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}






















