'use client';

import { useState, useEffect } from 'react';
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { toast, Toaster } from 'react-hot-toast';
import { PlusIcon, ArrowPathIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Loader2, Save, Download, Calendar, Building2, FileText } from 'lucide-react';
import LordIcon from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';
import dynamic from 'next/dynamic';
import AnimatedSelect from '@/components/AnimatedSelect';
import ModernDatePicker from '@/components/ModernDatePicker';

// Dynamically import motion components
const motion = {
  div: dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
    ssr: false,
    loading: () => <div />
  }),
  button: dynamic(() => import('framer-motion').then(mod => mod.motion.button), {
    ssr: false,
    loading: () => <button />
  })
};

const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), {
  ssr: false
});

// Dynamically import PDF component to avoid ESM issues
const PDFDownloadButton = dynamic(() => import('@/app/components/PDFDownloadButton'), {
  ssr: false,
  loading: () => <button>Loading PDF...</button>
});

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Button Component
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// Utils function
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

// Add this CSS at the top of your file or in your global CSS
const inputStyles = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  padding: '0.5rem',
  borderRadius: '0.375rem',
  width: '100%',
};


// Step interface
interface Step {
  id: 'unit' | 'date' | 'action' | 'invoice';
  title: string;
}

const steps: Step[] = [
  { id: 'date', title: 'Select Period' },
  { id: 'unit', title: 'Select Unit' },
  { id: 'action', title: 'Choose Action' },
  { id: 'invoice', title: 'Invoice Details' },
];

// Replace the roundToTwo function with simpler roundAmount
const roundAmount = (num: number | string): number => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  return Math.round(value);
};

// Add these animation variants at the top of your file
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

// Add these animation variants at the top of your file alongside the other variants
const dropdownVariants = {
  hidden: { 
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2
    }
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05
    }
  }
};

const optionVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2 }
  }
};

// Update your step indicators section
const StepIndicator = ({ step, label, isActive, isDone }: any) => (
  <motion.div
    variants={stepVariants}
    className="flex flex-col items-center gap-3"
  >
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
        ${isActive ? 'bg-[#1a365d] dark:bg-blue-600 text-white shadow-lg' :
          isDone ? 'bg-green-1000 text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-slate-600 border-2 border-gray-200 dark:border-gray-600'}`}
    >
      {isDone ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <span className="text-sm font-semibold">{step}</span>
      )}
    </motion.div>
    <span className={`text-sm font-medium text-center whitespace-nowrap
      ${isActive ? 'text-[#1a365d] dark:text-blue-400' : isDone ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
      {label}
    </span>
  </motion.div>
);

// Main Invoice Page Component
export default function InvoicePage() {
  const [currentStep, setCurrentStep] = useState<Step['id']>('date');
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAction, setSelectedAction] = useState<'new' | 'update' | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState({
    date: '',
    billTo: '',
    partyGstin: '',
    stateCode: '',
    address: '',
    invoiceNo: '',
    services: [
      { id: 1, name: 'BASIC', amount: '' },
      { id: 2, name: 'ARREAR', amount: '' },
      { id: 3, name: 'ATT. AWD', amount: '' },
      { id: 4, name: 'CONVEYANCE', amount: '' },
      { id: 5, name: 'D.A.', amount: '' },
      { id: 6, name: 'HRA', amount: '' },
      { id: 7, name: 'PROD', amount: '' },
      { id: 8, name: 'SPL. ALL', amount: '' },
      { id: 9, name: 'TRAVEL. ALL', amount: '' },
      { id: 10, name: 'WOF', amount: '' }
    ],
    deductions: [
      { name: 'EPFO', rate: 13.00, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
      { name: 'ESIC', rate: 3.25, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
      { name: 'LWF', rate: 0.40, baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
      { name: 'SERVICE CHARGE', rate: '', baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: true },
      { name: 'UNIFORM', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
      { name: 'CEILING MACHINE', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false }
    ],
    cgst: { amount: 0 },
    sgst: { amount: 0 },
    igst: { amount: 0 },
    grandTotal: 0,
    ptDeduction: 0,
    pt: {
      amount: 0
    },
    gstNumber: '',
  });

  // Add new state for unit details
  const [unitDetails, setUnitDetails] = useState<any>(null);

  // Initialize totals state with default values
  const [totals, setTotals] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    grossTaxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    grandTotal: 0
  });

  // Add new state for basicInfo
  const [basicInfo, setBasicInfo] = useState<any>(null);

  // Fetch units on component mount
  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units/get-units');
      const data = await response.json();
      
      if (data.success) {
        setUnits(data.units);
      } else {
        setError('Failed to fetch units');
      }
    } catch (err) {
      setError('Error fetching units');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'date' && selectedMonth && selectedYear) {
      setCurrentStep('unit');  // Go to Unit Selection (Step 2)
    } else if (currentStep === 'unit' && selectedUnit) {
      setCurrentStep('action');  // Then go to Choose Action (Step 3)
    } else if (currentStep === 'action' && selectedAction) {
      setCurrentStep('invoice');  // Finally to Invoice Details (Step 4)
    }
  };

  const handleBack = () => {
    if (currentStep === 'invoice') {
      setCurrentStep('action');
    } else if (currentStep === 'action') {
      setCurrentStep('unit');
    } else if (currentStep === 'unit') {
      setCurrentStep('date');
    }
  };

  // Also add a cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      setInvoiceData({
        billTo: '',
        partyGstin: '',
        stateCode: '',
        address: '',
        invoiceNo: '',
        date: '',
        services: [
          { id: 1, name: 'BASIC', amount: '' },
          { id: 2, name: 'ARREAR', amount: '' },
          { id: 3, name: 'ATT. AWD', amount: '' },
          { id: 4, name: 'CONVEYANCE', amount: '' },
          { id: 5, name: 'D.A.', amount: '' },
          { id: 6, name: 'HRA', amount: '' },
          { id: 7, name: 'PROD', amount: '' },
          { id: 8, name: 'SPL. ALL', amount: '' },
          { id: 9, name: 'TRAVEL. ALL', amount: '' },
          { id: 10, name: 'WOF', amount: '' },
        ],
        deductions: [
          { name: 'EPFO', rate: 13.00, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
          { name: 'ESIC', rate: 3.25, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
          { name: 'LWF', rate: 0.40, baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
          { name: 'SERVICE CHARGE', rate: '', baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: true },
          { name: 'UNIFORM', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
          { name: 'CEILING MACHINE', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false }
        ],
        cgst: { amount: 0 },
        sgst: { amount: 0 },
        igst: { amount: 0 },
        grandTotal: 0,
        ptDeduction: 0,
        pt: { amount: 0 },
        gstNumber: '',
      });
      setTotals({
        totalEarnings: 0,
        totalDeductions: 0,
        grossTaxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        grandTotal: 0
      });
      setSelectedAction('');
    };
  }, []);

  // Separate the PT handler and calculations
  const handlePTChange = (amount: number) => {
    setInvoiceData(prev => ({
      ...prev,
      pt: {
        amount: amount
      }
    }));
  };

  // Update the useEffect for tax calculations
  useEffect(() => {
    const calculateTotals = () => {
      // Calculate total earnings
      const totalEarnings = Math.round(
        invoiceData.services.reduce((sum, service) => 
          sum + (service.amount ? parseFloat(service.amount) : 0), 0)
      );

      // Calculate deductions total
      const deductionsTotal = Math.round(
        invoiceData.deductions.reduce((sum, deduction) => {
          let amount = 0;
          const rate = typeof deduction.rate === 'string' ? parseFloat(deduction.rate) || 0 : deduction.rate;
          const baseAmount = typeof deduction.baseAmount === 'string' ? parseFloat(deduction.baseAmount) || 0 : deduction.baseAmount;
          const deductionAmount = typeof deduction.amount === 'string' ? parseFloat(deduction.amount) || 0 : deduction.amount;
          
          if (deduction.name === 'SERVICE CHARGE') {
            amount = rate === 0 ? 
              baseAmount : 
              (baseAmount * rate) / 100;
          } else if (deduction.hasBaseAmount) {
            amount = (baseAmount * rate) / 100;
          } else {
            amount = deductionAmount;
          }
          return sum + amount;
        }, 0)
      );

      // Calculate gross taxable amount (total earnings + total deductions)
      const grossTaxableAmount = Math.round(totalEarnings + deductionsTotal);
      
      const isHaryanaUnit = invoiceData.stateCode?.toLowerCase() === 'haryana';
      
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      
      if (isHaryanaUnit) {
        cgstAmount = Math.round((grossTaxableAmount * 9) / 100);
        sgstAmount = Math.round((grossTaxableAmount * 9) / 100);
      } else {
        igstAmount = Math.round((grossTaxableAmount * 18) / 100);
      }
      
      const ptDeduction = Math.round(invoiceData.pt?.amount || 0);

      const grandTotal = Math.round(
        grossTaxableAmount + cgstAmount + sgstAmount + igstAmount - ptDeduction
      );

      setTotals({
        totalEarnings,
        totalDeductions: deductionsTotal,
        grossTaxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        grandTotal
      });
    };

    calculateTotals();
  }, [invoiceData]);

  // Update the handleDeductionBaseAmountChange function
  const handleDeductionBaseAmountChange = (index: number, baseAmount: number) => {
    setInvoiceData(prev => {
      const newDeductions = [...prev.deductions];
      const deduction = newDeductions[index];
      
      // Round the base amount first
      const roundedBaseAmount = Math.round(baseAmount);
      deduction.baseAmount = roundedBaseAmount.toString();
      
      // Calculate and round the amount
      const rate = typeof deduction.rate === 'string' ? parseFloat(deduction.rate) || 0 : deduction.rate;
      if (deduction.name === 'SERVICE CHARGE' && rate === 0) {
        deduction.amount = roundedBaseAmount.toString();
      } else {
        deduction.amount = Math.round((roundedBaseAmount * rate) / 100).toString();
      }
      
      return {
        ...prev,
        deductions: newDeductions
      };
    });
  };

  // Update the handleRateChange function
  const handleRateChange = (index: number, rate: number) => {
    setInvoiceData(prev => {
      const updatedDeductions = [...prev.deductions];
      updatedDeductions[index] = {
        ...updatedDeductions[index],
        rate: rate.toString()
      };
      
      // If this deduction has a base amount, recalculate the amount
      if (updatedDeductions[index].hasBaseAmount && updatedDeductions[index].baseAmount) {
        const baseAmount = parseFloat(updatedDeductions[index].baseAmount) || 0;
        updatedDeductions[index].amount = 
          Math.round((baseAmount * rate / 100)).toString();
      }
      
      return {
        ...prev,
        deductions: updatedDeductions
      };
    });
  };

  // Update the handleDirectAmountChange function
  const handleDirectAmountChange = (index: number, amount: number) => {
    setInvoiceData(prev => {
      const newDeductions = [...prev.deductions];
      const deduction = newDeductions[index];
      const roundedAmount = Math.round(amount);
      
      deduction.amount = roundedAmount.toString();
      if (deduction.name === 'LWF') {
        deduction.baseAmount = roundedAmount.toString();
      }
      
      return {
        ...prev,
        deductions: newDeductions
      };
    });
  };

  // Generate array of months
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate array of years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Update the unit selection handler
  const handleUnitSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUnit(e.target.value);
    // Clear any previous errors
    setError('');
  };

  // Update the select component with a custom styled dropdown
  const CustomSelect = ({ value, onChange, options, loading }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-gray-500 disabled:opacity-60 disabled:cursor-not-allowed hover:border-gray-200 dark:hover:border-gray-500"
          disabled={loading}
        >
          <span className={`${!value ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'} truncate`}>
            {value || "Choose a unit"}
          </span>
          <svg className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={dropdownVariants}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="py-1 max-h-60 overflow-y-auto">
                {options.map((option: any) => (
                  <button
                    key={option._id}
                    type="button"
                    onClick={() => {
                      onChange({ target: { value: option.unitName } });
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left cursor-pointer ${value === option.unitName ? 'bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700'}`}
                  >
                    {option.unitName}
                  </button>
                ))}
                {options.length === 0 && (
                  <div className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm">
                    No units available
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Add this function to handle keydown events
  const preventArrowKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  // Add this handler for service amounts
  const handleServiceAmountChange = (index: number, value: string) => {
    setInvoiceData(prev => {
      const newServices = [...prev.services];
      newServices[index] = {
        ...newServices[index],
        amount: value
      };
      return {
        ...prev,
        services: newServices
      };
    });
  };

  const renderInvoiceForm = () => {
    if (currentStep === 'invoice' && invoiceData) {
      return (
        <div className="space-y-8">
          {/* Invoice Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Details</h2>
            </div>
            <div className="pt-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">TAX INVOICE</h1>
                <h2 className="text-2xl font-semibold text-[#1a365d] dark:text-blue-400 mt-2">YOUR COMPANY NAME</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">EMAIL- YOUR COMPANY EMAIL</p>
                <p className="text-slate-600 dark:text-slate-400">YOUR COMPANY ADDRESS</p>
              </div>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Information</h2>
            </div>
            <div className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">BILL TO (M/S)</label>
                <Input
                  value={invoiceData.billTo}
                  onChange={(e) => handleInputChange('billTo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  readOnly
                />
              </div>
              <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">ADDRESS</label>
                <textarea
                  value={invoiceData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full h-24 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm resize-none"
                  readOnly
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
                  <ModernDatePicker
                    label="DATE"
                    value={invoiceData.date || ''}
                    onChange={(value) => handleInputChange('date', value)}
                    mode="calendar"
                    required
                  />
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">PARTY GSTIN</label>
                    <Input
                      value={invoiceData.partyGstin}
                      onChange={(e) => handleInputChange('partyGstin', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">HSN/SAC CODE</label>
                    <Input
                      value="998519"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">STATE CODE</label>
                    <Input
                      value={invoiceData.stateCode}
                      onChange={(e) => handleInputChange('stateCode', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">INVOICE NO</label>
                    <Input
                      value={invoiceData.invoiceNo}
                      onChange={(e) => handleInputChange('invoiceNo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Supply Month */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Supply Month</h2>
            </div>
            <div className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Month</label>
                  <Input
                    value={selectedMonth}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Year</label>
                  <Input
                    value={selectedYear}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Description of Services</h2>
            </div>
            <div className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SL. NO.</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">PARTICULARS</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">AMOUNT(Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invoiceData.services.map((service, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{service.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <input
                            type="number"
                            value={service.amount}
                            onChange={(e) => handleServiceAmountChange(index, e.target.value)}
                            onKeyDown={preventArrowKeys}
                            className="w-full text-right px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Enter amount"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 font-bold">
                      <td colSpan={2} className="px-6 py-4 text-base text-slate-900 dark:text-white">TOTAL EARNINGS</td>
                      <td className="px-6 py-4 text-base text-right text-slate-900 dark:text-white">
                        ₹{Math.round(
                          invoiceData.services.reduce((sum, service) =>
                            sum + (service.amount ? parseFloat(service.amount) : 0), 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Deductions</h2>
            </div>
            <div className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SL. NO.</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">PARTICULARS</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">RATE(%)</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">BASE AMOUNT</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">AMOUNT(Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {invoiceData.deductions.map((deduction, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{deduction.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <input
                            type="number"
                            value={deduction.rate || ''}
                            onChange={(e) => handleRateChange(index, parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (
                                !/[\d\.]/.test(e.key) &&
                                !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                              ) {
                                e.preventDefault();
                              }
                            }}
                            className="w-24 text-right px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Enter rate"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {deduction.hasBaseAmount ? (
                            <input
                              type="number"
                              value={deduction.baseAmount || ''}
                              onChange={(e) => handleDeductionBaseAmountChange(index, parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (
                                  !/[\d\.]/.test(e.key) &&
                                  !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              className="w-24 text-right px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                              placeholder="Enter amount"
                            />
                          ) : (
                            <input
                              type="number"
                              value={deduction.amount || ''}
                              onChange={(e) => handleDirectAmountChange(index, parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (
                                  !/[\d\.]/.test(e.key) &&
                                  !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              className="w-24 text-right px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                              placeholder="Enter amount"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                        ₹{deduction.amount ? (typeof deduction.amount === 'string' ? parseFloat(deduction.amount) || 0 : deduction.amount).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                    <tr className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 font-bold">
                      <td colSpan={4} className="px-6 py-4 text-sm text-slate-900 dark:text-white">TOTAL</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-white">
                      ₹{(() => {
                        const rawTotal = invoiceData.deductions.reduce((sum, deduction) => {
                          const amount = typeof deduction.amount === 'string' ? parseFloat(deduction.amount) || 0 : deduction.amount || 0;
                          return sum + amount;
                        }, 0);
                        return rawTotal.toFixed(2);
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Tax Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tax Calculation</h2>
            </div>
            <div className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 p-5 rounded-xl border border-yellow-200 dark:border-yellow-700">
                  <span className="font-semibold text-slate-900 dark:text-white">GROSS TAXABLE AMOUNT</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(totals?.grossTaxableAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-slate-600 dark:text-slate-400">C.G.S.T (9.00%)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{(totals?.cgstAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-slate-600 dark:text-slate-400">S.G.S.T (9.00%)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{(totals?.sgstAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-slate-600 dark:text-slate-400">I.G.S.T (18.00%)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{(totals?.igstAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-slate-600 dark:text-slate-400">P.T</span>
                  <input
                    type="number"
                    value={invoiceData.pt?.amount || ''}
                    onChange={(e) => handlePTChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    onKeyDown={preventArrowKeys}
                    className="w-24 text-right px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="Enter PT"
                  />
                </div>
                <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-5 rounded-xl border border-green-200 dark:border-green-700 font-bold">
                  <span className="text-slate-900 dark:text-white">GRAND TOTAL</span>
                  <span className="text-slate-900 dark:text-white">₹{(totals?.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-center">
              <Button
                onClick={() => setCurrentStep('action')}
                variant="secondary"
                className="px-8 py-3 text-slate-600 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 hover:border-slate-400 dark:hover:border-gray-500 transition-all duration-200 font-medium shadow-sm"
              >
                Back
              </Button>

              <div className="flex flex-col sm:flex-row gap-6">
                <Button
                  onClick={handleSaveInvoice}
                  disabled={loading}
                  className="px-10 py-3 bg-gradient-to-r from-[#1a365d] to-[#2d3748] text-white rounded-xl
                           hover:from-[#2d3748] hover:to-[#1a365d] disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-[#1a365d]/50 focus:ring-offset-2
                           transition-all duration-200 flex items-center gap-3 font-semibold text-sm shadow-lg hover:shadow-xl
                           transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{selectedAction === 'update' ? 'Update Invoice' : 'Save Invoice'}</span>
                    </>
                  )}
                </Button>

                {invoiceData && (
                  <PDFDownloadButton
                    data={{
                      ...invoiceData,
                      month: selectedMonth,
                      createdAt: new Date(),
                      services: invoiceData?.services || [],
                      deductions: invoiceData?.deductions || [],
                      totals: {
                        totalEarnings: totals.totalEarnings || 0,
                        totalDeductions: totals.totalDeductions || 0,
                        grossTaxableAmount: totals.grossTaxableAmount || 0,
                        cgstAmount: totals.cgstAmount || 0,
                        sgstAmount: totals.sgstAmount || 0,
                        igstAmount: totals.igstAmount || 0,
                        pt: invoiceData.pt?.amount || 0,
                        grandTotal: totals.grandTotal || 0
                      }
                    }}
                    fileName={`invoice-${selectedUnit}-${selectedMonth}-${selectedYear}.pdf`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Add calculation helper functions if not already present
  const calculateTotalEarnings = () => {
    return invoiceData.services.reduce((sum, service) => 
      sum + (parseFloat(service.amount) || 0), 0
    );
  };

  const calculateTotalDeductions = () => {
    return invoiceData.deductions.reduce((sum, deduction) => 
      sum + (parseFloat(deduction.amount) || 0), 0
    );
  };

  const calculateGrossTaxableAmount = () => {
    return calculateTotalEarnings() - calculateTotalDeductions();
  };

  const calculateCGST = () => {
    return (calculateGrossTaxableAmount() * 0.09);
  };

  const calculateSGST = () => {
    return (calculateGrossTaxableAmount() * 0.09);
  };

  const calculateIGST = () => {
    return (calculateGrossTaxableAmount() * 0.18);
  };

  const calculateGrandTotal = () => {
    const grossAmount = calculateGrossTaxableAmount();
    const gst = calculateCGST() + calculateSGST();
    const pt = parseFloat(invoiceData.pt?.amount?.toString() || '0') || 0;
    return grossAmount + gst - pt;
  };

  // Add save handler
  const handleSaveInvoice = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/invoice/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          unit: selectedUnit,
          invoiceData: {
            ...invoiceData,
            invoiceNo: invoiceData.invoiceNo,
            totalEarnings: totals.totalEarnings,
            totalDeductions: totals.totalDeductions,
            grossTaxableAmount: totals.grossTaxableAmount,
            cgstAmount: totals.cgstAmount,
            sgstAmount: totals.sgstAmount,
            igstAmount: totals.igstAmount,
            pt: invoiceData.pt,
            grandTotal: totals.grandTotal
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        toast.success('Invoice saved successfully!');
        // Optionally redirect or reset form
      } else {
        throw new Error(data.message || 'Failed to save invoice');
      }
    } catch (error) {
      toast.error('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update the handleActionSelect function
  const handleActionSelect = async (action: string) => {
    setSelectedAction(action as 'new' | 'update' | '');
    if (action === 'update') {
      try {
        setLoading(true);
        const response = await fetch('/api/invoice/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year: selectedYear,
            month: selectedMonth,
            unit: selectedUnit
          })
        });

        const data = await response.json();

        if (data.success) {
          // Update all the invoice data from the database
          setInvoiceData({
            date: data.invoice.date,
            billTo: data.invoice.billTo,
            address: data.invoice.address,
            invoiceNo: data.invoice.invoiceNo,
            partyGstin: data.invoice.partyGstin,
            stateCode: data.invoice.stateCode,
            services: data.invoice.services || [
              { id: 1, name: 'BASIC', amount: '' },
              { id: 2, name: 'ARREAR', amount: '' },
              { id: 3, name: 'ATT. AWD', amount: '' },
              { id: 4, name: 'CONVEYANCE', amount: '' },
              { id: 5, name: 'D.A.', amount: '' },
              { id: 6, name: 'HRA', amount: '' },
              { id: 7, name: 'PROD', amount: '' },
              { id: 8, name: 'SPL. ALL', amount: '' },
              { id: 9, name: 'TRAVEL. ALL', amount: '' },
              { id: 10, name: 'WOF', amount: '' }
            ],
            deductions: data.invoice.deductions || [
              { name: 'EPFO', rate: 13.00, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
              { name: 'ESIC', rate: 3.25, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
              { name: 'LWF', rate: 0.40, baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
              { name: 'SERVICE CHARGE', rate: '', baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: true },
              { name: 'UNIFORM', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
              { name: 'CEILING MACHINE', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false }
            ],
            cgst: data.invoice.cgst || { amount: 0 },
            sgst: data.invoice.sgst || { amount: 0 },
            igst: data.invoice.igst || { amount: 0 },
            grandTotal: data.invoice.grandTotal || 0,
            ptDeduction: data.invoice.ptDeduction || 0,
            pt: data.invoice.pt || { amount: 0 },
            gstNumber: data.invoice.gstNumber || ''
          });

          // Update totals from the database
          setTotals({
            totalEarnings: data.invoice.totals.totalEarnings || 0,
            totalDeductions: data.invoice.totals.totalDeductions || 0,
            grossTaxableAmount: data.invoice.totals.grossTaxableAmount || 0,
            cgstAmount: data.invoice.totals.cgstAmount || 0,
            sgstAmount: data.invoice.totals.sgstAmount || 0,
            igstAmount: data.invoice.totals.igstAmount || 0,
            grandTotal: data.invoice.totals.grandTotal || 0
          });

          setCurrentStep('invoice');
          toast.success('Invoice loaded successfully!');
        } else {
          throw new Error(data.message || 'Failed to load invoice');
        }
      } catch (error) {
        toast.error('Failed to load invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (action === 'new') {
      try {
        setLoading(true);
        
        // Fetch the latest invoice number with no parameters
        const invoiceNoResponse = await fetch('/api/invoice/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})  // Empty object for latest invoice number
        });
        const invoiceNoData = await invoiceNoResponse.json();
        const nextInvoiceNo = invoiceNoData.success ? 
          (parseInt(invoiceNoData.latestInvoiceNo) + 1).toString() : 
          '101'; // Default starting number if no previous invoices

        // Rest of your existing new invoice logic...
        const response = await fetch('/api/units/get-unit-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unitName: selectedUnit
          })
        });

        const data = await response.json();

        if (data.success) {
          setInvoiceData(prevData => ({
            ...prevData,
            billTo: data.unit.billTo,
            address: data.unit.address,
            partyGstin: data.unit.partyGstin,
            stateCode: data.unit.stateCode,
            invoiceNo: nextInvoiceNo, // Set the next invoice number
            date: new Date().toISOString().split('T')[0],
            services: [
              { id: 1, name: 'BASIC', amount: '' },
              { id: 2, name: 'ARREAR', amount: '' },
              { id: 3, name: 'ATT. AWD', amount: '' },
              { id: 4, name: 'CONVEYANCE', amount: '' },
              { id: 5, name: 'D.A.', amount: '' },
              { id: 6, name: 'HRA', amount: '' },
              { id: 7, name: 'PROD', amount: '' },
              { id: 8, name: 'SPL. ALL', amount: '' },
              { id: 9, name: 'TRAVEL. ALL', amount: '' },
              { id: 10, name: 'WOF', amount: '' }
            ],
            deductions: [
              { name: 'EPFO', rate: 13.00, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
              { name: 'ESIC', rate: 3.25, baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: false },
              { name: 'LWF', rate: 0.40, baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
              { name: 'SERVICE CHARGE', rate: data.unit.serviceChargeRate || '', baseAmount: '', amount: '', hasBaseAmount: true, isRateEditable: true },
              { name: 'UNIFORM', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false },
              { name: 'CEILING MACHINE', rate: '', baseAmount: '', amount: '', hasBaseAmount: false, isRateEditable: false }
            ],
            pt: { amount: 0 }
          }));
          
          setCurrentStep('invoice');
          toast.success('Unit details loaded successfully!');
        } else {
          throw new Error(data.message || 'Failed to load unit details');
        }
      } catch (error) {
        toast.error('Failed to load details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Add this function in your InvoicePage component
  const handleInputChange = (field: string, value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-full">
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title - Left Side */}
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Invoice Generator</h1>
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
              placeholder="Search invoices..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">

    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
        className="min-h-full"
      >
        <div className="w-full">
          <div className="space-y-8">


            {/* Progress Steps */}
            <div className="flex justify-start">
              <div className="flex items-center gap-8 md:gap-12">
                <StepIndicator
                  step={1}
                  label="Select Period"
                  isActive={currentStep === 'date'}
                  isDone={currentStep !== 'date'}
                />
                <div className="w-6 h-px bg-gray-300 dark:bg-gray-600 hidden md:block"></div>
                <StepIndicator
                  step={2}
                  label="Select Unit"
                  isActive={currentStep === 'unit'}
                  isDone={currentStep === 'action' || currentStep === 'invoice'}
                />
                <div className="w-6 h-px bg-gray-300 dark:bg-gray-600 hidden md:block"></div>
                <StepIndicator
                  step={3}
                  label="Choose Action"
                  isActive={currentStep === 'action'}
                  isDone={currentStep === 'invoice'}
                />
                <div className="w-6 h-px bg-gray-300 dark:bg-gray-600 hidden md:block"></div>
                <StepIndicator
                  step={4}
                  label="Invoice Details"
                  isActive={currentStep === 'invoice'}
                  isDone={false}
                />
              </div>
            </div>

            {/* Step Content */}
          {currentStep !== 'invoice' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Step content components */}
              {currentStep === 'date' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                    <AnimatedSelect
                      id="invoice-month"
                      label="Select Month"
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                      options={months.map(month => ({
                        value: month,
                        label: month
                      }))}
                      placeholder="Choose Month"
                    />
                    <AnimatedSelect
                      id="invoice-year"
                      label="Select Year"
                      value={selectedYear}
                      onChange={setSelectedYear}
                      options={years.map(year => ({
                        value: year.toString(),
                        label: year.toString()
                      }))}
                      placeholder="Choose Year"
                    />
                  </div>
                </div>
              )}

              {currentStep === 'unit' && (
                <div className="space-y-6">
                  <div className="max-w-lg">
                    <CustomSelect
                      value={selectedUnit}
                      onChange={handleUnitSelect}
                      options={units}
                      loading={loading}
                    />
                  </div>
                </div>
              )}

              {currentStep === 'action' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                        <div
                          className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedAction === 'new' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => handleActionSelect('new')}
                        >
                          <div className="text-center">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg w-fit mx-auto mb-4">
                              <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Create New Invoice</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Generate a fresh invoice</p>
                          </div>
                        </div>

                        <div
                          className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedAction === 'update' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => handleActionSelect('update')}
                        >
                          <div className="text-center">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg w-fit mx-auto mb-4">
                              <ArrowPathIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Update Existing Invoice</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Modify an existing invoice</p>
                          </div>
                        </div>
                      </div>
                </div>
              )}

              {/* Navigation */}
              <div className="pt-6 flex justify-start">
                <div className="flex gap-3">
                  {currentStep !== 'date' && (
                    <button
                      onClick={handleBack}
                      className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 'date' && (!selectedMonth || !selectedYear)) ||
                      (currentStep === 'unit' && !selectedUnit) ||
                      (currentStep === 'action' && !selectedAction)
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Invoice form rendered separately */}
          {renderInvoiceForm()}
          </div>
        </div>
      </motion.div>
      </main>
    </div>
  );
}