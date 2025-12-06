'use client';
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
// animations removed
import { Calendar, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Filter, Users, Clock, TrendingUp, BarChart3, Check, MapPin, Loader2, X as XIcon, Bell, Send } from 'lucide-react';
import LordIcon, { LordIconRef } from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import LocationDisplay from '../../../../components/LocationDisplay';
import AnimatedSelect from '../../../../components/AnimatedSelect';
import ModernDateRangePicker from '../../../../components/ModernDateRangePicker';
import * as XLSX from 'xlsx-js-style';
import { globalLoadingState } from '../../../../components/Layout';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { hasFeaturePermissionWithConfig, type RolePermissionsConfig } from '@/lib/auth/permissions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AttendanceRecord {
  date: string;
  timeIn: string;
  status: 'present' | 'absent';
  id: string;
  fullName?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface EmployeeAttendanceData {
  id: string;
  fullName: string;
  role: string;
  type: 'Fulltime' | 'Contractor';
  regularHours: number;
  overtimeHours: number;
  sickLeaveHours: number;
  ptoHours: number;
  paidHolidayHours: number;
  totalHours: number;
  avatar?: string;
}

interface ExportOptions {
  isOpen: boolean;
  type: 'month' | 'date';
  date: Date | null;
}



export default function AttendanceClient() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateRecords, setSelectedDateRecords] = useState<AttendanceRecord[]>([]);
  const [selectedCalendarBarDate, setSelectedCalendarBarDate] = useState<Date | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMarkedToday, setHasMarkedToday] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [permissionsConfig, setPermissionsConfig] = useState<Partial<RolePermissionsConfig> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchIconRef = useRef<LordIconRef>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const chartDataCache = useRef<{ key: string; data: any[] } | null>(null);

  // Helper function to format date as YYYY-MM-DD (local date)
  const formatDateForPicker = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize with current month dates
  const getDefaultDates = () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
  };

  const [startDate, setStartDate] = useState(() => getDefaultDates().start);
  const [endDate, setEndDate] = useState(() => getDefaultDates().end);
  const [employeeData, setEmployeeData] = useState<EmployeeAttendanceData[]>([]);

  // Helper function to check if user can view all attendance details
  const canViewAllAttendance = () => {
    if (!userData?.role) return false;
    return hasFeaturePermissionWithConfig(
      userData.role,
      'attendance-visibility',
      permissionsConfig || undefined
    );
  };
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    isOpen: false,
    type: 'month',
    date: null
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [downloadPopup, setDownloadPopup] = useState({
    isOpen: false,
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear()
  });
  const [locationNames, setLocationNames] = useState<Map<string, string>>(new Map());
  const [locationLoading, setLocationLoading] = useState<Set<string>>(new Set());

  // Component to display location names
  const LocationNameDisplay = ({ record }: { record: AttendanceRecord }) => {
    const [locationName, setLocationName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (record.location) {
        const fetchLocationName = async () => {
          setIsLoading(true);
          try {
            const name = await getLocationName(record.location!.latitude, record.location!.longitude);
            setLocationName(name);
          } catch (error) {
            setLocationName('Location unavailable');
          } finally {
            setIsLoading(false);
          }
        };
        fetchLocationName();
      }
    }, [record.location]);

    if (!record.location) {
      return <div className="text-sm text-gray-500 dark:text-gray-400">Location not available</div>;
    }

    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Loading location...</span>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-900 dark:text-white">
        <a
          href={`https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
        >
          <MapPin className="w-4 h-4" />
          <span>{locationName}</span>
        </a>
      </div>
    );
  };

  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  // Move chart component outside to prevent recreation on every render
  const StableAttendanceTimelineChart = useCallback(memo(({ data }: { data: any[] }) => {

    // Memoize the current date string to prevent recreation on every render
    const currentDateString = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              fontSize={12}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tick={{ fill: '#6B7280' }}
              domain={[0, 24]}
              ticks={[0, 6, 12, 18, 24]}
              tickFormatter={(value) => {
                const hour = Math.floor(value);
                const minute = Math.round((value - hour) * 60);
                return minute > 0 ? `${hour}:${minute.toString().padStart(2, '0')}` : `${hour}:00`;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              labelStyle={{ color: '#F9FAFB' }}
              formatter={(value: number | null, name: string, props: any) => {
                if (name === 'loginHour') {
                  const { payload } = props;
                  if (payload.isFutureDate) {
                    return ['Future Date', 'Status'];
                  }
                  if (!payload.isPresent) {
                    return ['Absent', 'Status'];
                  }
                  return [payload.loginTime || `${Math.floor(value)}:00`, 'Login Time'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="loginHour"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={(props: any) => {
                const { payload, cx, cy } = props;
                const isCurrentDate = payload.fullDate === currentDateString;

                if (payload.isFutureDate) {
                  return <circle cx={cx} cy={cy} r={2} fill="#D1D5DB" stroke="#D1D5DB" strokeWidth={1} />;
                }
                if (!payload.isPresent) {
                  return <circle cx={cx} cy={cy} r={3} fill="#9CA3AF" stroke="#9CA3AF" strokeWidth={1} />;
                }

                // Special pulsing effect for current date present
                if (isCurrentDate && payload.isPresent) {
                  return (
                    <g>
                      {/* Outer pulse wave */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        opacity={0.8}
                        style={{
                          animation: 'pulse-wave 2s ease-in-out infinite',
                          transformOrigin: `${cx}px ${cy}px`
                        }}
                      />
                      {/* Middle pulse wave */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth={1.5}
                        opacity={0.6}
                        style={{
                          animation: 'pulse-wave 2s ease-in-out infinite 0.7s',
                          transformOrigin: `${cx}px ${cy}px`
                        }}
                      />
                      {/* Inner pulsing dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#3B82F6"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        style={{
                          animation: 'pulse-color 2s ease-in-out infinite'
                        }}
                      />
                    </g>
                  );
                }

                return <circle cx={cx} cy={cy} r={5} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} />;
              }}
              activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: '#FFFFFF' }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }, (prevProps, nextProps) => {

    // Custom comparison function for memoization
    // Only re-render if the data array length or content actually changed
    if (prevProps.data.length !== nextProps.data.length) {
      return false;
    }

    // Deep comparison of data array
    for (let i = 0; i < prevProps.data.length; i++) {
      const prev = prevProps.data[i];
      const next = nextProps.data[i];

      // Compare key properties that matter for the chart
      if (prev.date !== next.date ||
        prev.loginHour !== next.loginHour ||
        prev.status !== next.status ||
        prev.fullDate !== next.fullDate ||
        prev.isPresent !== next.isPresent ||
        prev.isFutureDate !== next.isFutureDate ||
        prev.loginTime !== next.loginTime) {
        return false;
      }
    }

    return true; // No changes, don't re-render
  }), []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = localStorage.getItem('id');
        if (!id) {
          toast.error('No user found. Please login again.');
          return;
        }

        setCurrentUserId(id); // Store id in state

        const response = await fetch(`/api/user?id=${id}`);
        const data = await response.json();

        if (response.ok) {
          setUserData(data.user); // Extract user data from the nested response
          checkTodayAttendance(id);
          fetchAttendanceHistory(id, startDate, endDate);
        } else {
          toast.error(data.error || 'Failed to fetch user data');
        }
      } catch (error) {
        toast.error('Error loading user data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/admin/permissions');
        if (response.ok) {
          const data = await response.json();
          setPermissionsConfig(data);
        }
      } catch (error) {
        // Silently handle - will fall back to default permissions
      }
    };

    fetchUserData();
    fetchPermissions();
  }, []);

  // Auto-select today's date when the page loads
  useEffect(() => {
    if (!isLoading && userData && canViewAllAttendance() && selectedCalendarBarDate === null) {
      const today = new Date();
      handleCalendarBarDateSelect(today);
    }
  }, [isLoading, userData, permissionsConfig]);

  // Refetch attendance history when date range changes
  useEffect(() => {
    if (userData?.id && startDate && endDate) {
      fetchAttendanceHistory(userData.id, startDate, endDate);
    }
  }, [startDate, endDate, userData?.id]);

  const checkTodayAttendance = async (id: string) => {
    try {
      const todayString = formatDateForAPI(new Date());
      const response = await fetch(`/api/attendance/check?id=${id}&date=${todayString}`);
      const data = await response.json();
      setHasMarkedToday(data.hasMarkedToday);
    } catch (error) {
      // Silently handle attendance check errors
    }
  };

  const fetchAttendanceHistory = async (id: string, startDate?: Date, endDate?: Date) => {
    try {
      let url = `/api/attendance/history?id=${id}`;
      if (startDate && endDate) {
        url += `&startDate=${formatDateForAPI(startDate)}&endDate=${formatDateForAPI(endDate)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setAttendanceHistory(data.history);
      }
    } catch (error) {
      // Silently handle history fetch errors
    }
  };

  const markAttendance = async () => {
    const id = localStorage.getItem('id');
    if (!id) {
      toast.error('Please login first');
      return;
    }

    try {
      const now = new Date();
      const clientDate = formatDateForAPI(now);
      const clientTimestamp = now.toISOString();

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, clientDate, clientTimestamp }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Attendance marked successfully!');
        setHasMarkedToday(true);
        await fetchAttendanceHistory(id, startDate, endDate);
      } else {
        toast.error(data.error || 'Failed to mark attendance');
      }
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeDateString = (value?: string | null) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (value.includes('T')) {
      const [datePart] = value.split('T');
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateForAPI(parsed);
    }

    return value;
  };

  const handleDateSelect = async (date: Date) => {
    const newSelectedDate = new Date(date);
    setSelectedDate(newSelectedDate);

    const dateString = formatDateForAPI(newSelectedDate);
    try {
      const response = await fetch(`/api/attendance/date?date=${dateString}`);
      const data = await response.json();

      if (data.success) {
        setSelectedDateRecords(data.records);
      } else {
        toast.error('Failed to fetch attendance records');
      }
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    }
  };

  const handleCalendarBarDateSelect = async (date: Date) => {
    const newSelectedDate = new Date(date);
    setSelectedCalendarBarDate(newSelectedDate);

    const dateString = formatDateForAPI(newSelectedDate);
    try {
      const response = await fetch(`/api/attendance/date?date=${dateString}`);
      const data = await response.json();

      if (data.success) {
        setSelectedDateRecords(data.records);
        // Also update the main calendar selection for consistency
        setSelectedDate(newSelectedDate);
      } else {
        toast.error('Failed to fetch attendance records');
      }
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    }
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentMonth.setMonth(month));
    setCurrentMonth(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentMonth.setFullYear(year));
    setCurrentMonth(newDate);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const generateCalendar = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const weeks = [];
    let days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(<td key={`empty-${i}`} className="p-2"></td>);
    }

    for (let date = 1; date <= lastDay.getDate(); date++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date);
      const dateString = formatDateForAPI(currentDate);
      const today = new Date();

      const isToday = date === today.getDate() &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear();

      const isSelected = selectedDate?.getDate() === date &&
        selectedDate?.getMonth() === currentDate.getMonth() &&
        selectedDate?.getFullYear() === currentDate.getFullYear();

      // Find attendance records for this date
      const recordsForDay = selectedDateRecords.filter(
        (record) => normalizeDateString(record.date) === dateString
      );
      const hasAttendance = recordsForDay.length > 0;

      days.push(
        <td
          key={date}
          className={`p-2 text-center relative cursor-pointer transition-all
            ${hasAttendance && !isToday ? 'bg-[#EEF2FF]' : ''}
            ${isToday ? 'bg-[#6366F1] text-white font-semibold rounded-lg' : 'text-gray-700'}
            ${isSelected ? (isToday ? 'ring-2 ring-[#EEF2FF] rounded-lg' : 'bg-gray-100 ring-2 ring-[#6366F1] rounded-lg text-gray-900') : ''}
            ${!isToday && !isSelected && !hasAttendance ? 'hover:bg-gray-50 rounded-lg' : ''}`}
          onClick={() => handleDateSelect(currentDate)}
        >
          <span className="relative z-10 inline-block w-8 h-8 leading-8 font-medium">{date}</span>
          {isSelected && canViewAllAttendance() && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-200 z-50 w-24 text-gray-900 text-center">
              <span className="text-base font-bold leading-none">
                {recordsForDay?.length ?? 0}
              </span>
            </div>
          )}
        </td>
      );

      if ((firstDay.getDay() + date) % 7 === 0) {
        weeks.push(<tr key={`week-${weeks.length}`}>{days}</tr>);
        days = [];
      }
    }

    if (days.length > 0) {
      while (days.length < 7) {
        days.push(<td key={`empty-end-${days.length}`} className="p-2"></td>);
      }
      weeks.push(<tr key={`week-${weeks.length}`}>{days}</tr>);
    }

    return weeks;
  };

  // Add this debug function to help troubleshoot


  const exportToPDF = async () => {
    setExportLoading(true);

    try {
      let records: AttendanceRecord[] = [];
      let title = '';

      if (exportOptions.type === 'month') {
        // Export entire month - ALL employees
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        const monthName = months[currentMonth.getMonth()];

        const response = await fetch(`/api/attendance/export?month=${month}&year=${year}`);
        const data = await response.json();

        if (data.success) {
          records = data.records;
          title = `Attendance Report - All Employees - ${monthName} ${year}`;
        } else {
          toast.error(data.error || 'Failed to fetch attendance data');
          return;
        }
      } else if (exportOptions.type === 'date' && exportOptions.date) {
        // Export specific date - ALL employees
        const dateString = formatDateForAPI(exportOptions.date);
        const month = exportOptions.date.getMonth() + 1;
        const year = exportOptions.date.getFullYear();

        const response = await fetch(`/api/attendance/export?month=${month}&year=${year}&date=${dateString}`);
        const data = await response.json();

        if (data.success) {
          records = data.records;
          title = `Attendance Report - All Employees - ${exportOptions.date.toLocaleDateString()}`;
        } else {
          toast.error(data.error || 'Failed to fetch attendance data');
          return;
        }
      }

      if (!records || records.length === 0) {
        toast.error('No attendance records found for the selected period');
        return;
      }

      // Validate records structure
      //
      const validRecords = records.filter(record =>
        record && typeof record === 'object' && record.id && record.date
      );

      if (validRecords.length === 0) {
        toast.error('No valid attendance records found');
        return;
      }

      //

      // Import jsPDF and autoTable
      const { default: jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable');

      //

      // Create new jsPDF instance
      const doc = new jsPDF();

      // Store the autoTable function for direct use
      const autoTableFn = autoTable.default;

      //

      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, 22);

      // Add company info
      doc.setFontSize(12);
      doc.text('Company Name: YOUR COMPANY NAME', 14, 32);

      // Add date of generation
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 40);

      // Add report summary
      doc.text(`Total Records: ${validRecords.length}`, 14, 48);

      if (exportOptions.type === 'month') {
        // Group records by date for month report
        const recordsByDate: { [key: string]: AttendanceRecord[] } = {};

        // Sort and group records by date
        validRecords.sort((a, b) => {
          // First sort by date
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          // Then by time if dates are the same
          return new Date(a.timeIn).getTime() - new Date(b.timeIn).getTime();
        });

        validRecords.forEach(record => {
          if (!recordsByDate[record.date]) {
            recordsByDate[record.date] = [];
          }
          recordsByDate[record.date].push(record);
        });

        // Start position for content
        let yPos = 58;

        // For each date, create a section
        for (const date in recordsByDate) {
          const dateRecords = recordsByDate[date];
          const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          // Add date header
          doc.setFontSize(14);
          doc.setTextColor(75, 0, 130); // Purple color

          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.text(`${formattedDate} (${dateRecords.length} employees)`, 14, yPos);
          yPos += 8;

          // Create table for this date
          const tableColumn = ["ID", "Employee Name", "Time In", "Status", "Location"];
          const tableRows = dateRecords.map(record => [
            record.id,
            record.fullName || 'N/A',
            new Date(record.timeIn).toLocaleTimeString(),
            record.status,
            record.location ? 'Location recorded' : 'N/A'
          ]);

          // Reset text color for table
          doc.setTextColor(0, 0, 0);

          // Fix the autoTable call
          //
          try {
            autoTableFn(doc, {
              head: [tableColumn],
              body: tableRows,
              startY: yPos,
              styles: { fontSize: 9, cellPadding: 2 },
              headStyles: { fillColor: [75, 0, 130] },
              margin: { left: 14 }
            });
            //
          } catch (tableError) {
            throw new Error(`Failed to create table: ${tableError.message}`);
          }

          // Update position for next section
          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
      } else {
        // For specific date reports, use the original table format
        const tableColumn = ["ID", "Employee Name", "Date", "Time In", "Status", "Location"];
        const tableRows = validRecords.map(record => [
          record.id,
          record.fullName || 'N/A',
          new Date(record.date).toLocaleDateString(),
          new Date(record.timeIn).toLocaleTimeString(),
          record.status,
          record.location ? 'Location recorded' : 'N/A'
        ]);

        // Fix the autoTable call
        //
        try {
          autoTableFn(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [26, 54, 93] }
          });
          //
        } catch (tableError) {
          throw new Error(`Failed to create specific date table: ${tableError.message}`);
        }
      }

      // Save PDF
      //
      doc.save(`attendance_report_${Date.now()}.pdf`);

      toast.success('PDF exported successfully!');
      setExportOptions({ ...exportOptions, isOpen: false });
    } catch (error) {
      toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Handle download button click
  const handleDownload = async () => {
    setDownloadPopup(prev => ({ ...prev, isOpen: false }));

    // Set export options for the selected month/year
    const selectedDate = new Date(downloadPopup.selectedYear, downloadPopup.selectedMonth, 1);
    setExportOptions({
      isOpen: false,
      type: 'month',
      date: selectedDate
    });

    // Trigger PDF export
    await exportToPDF();
  };

  // Add this utility function at the top of the file
  const formatLocation = (location: { latitude: number; longitude: number }) => {
    return {
      short: `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`,
      full: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      mapsUrl: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    };
  };

  // Reverse geocoding function to get location names from coordinates
  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

    // Check if we already have this location cached
    if (locationNames.has(key)) {
      return locationNames.get(key)!;
    }

    // Check if we're already loading this location
    if (locationLoading.has(key)) {
      return 'Loading...';
    }

    // Mark as loading
    setLocationLoading(prev => new Set(prev).add(key));

    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Geocoding API error');
      }

      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        let mainPart = '';

        // Try to build a readable location name from address components
        // Priority: city/town > suburb > county > state
        if (address.city) {
          mainPart = address.city;
        } else if (address.town) {
          mainPart = address.town;
        } else if (address.village) {
          mainPart = address.village;
        } else if (address.suburb) {
          mainPart = address.suburb;
        } else if (address.county) {
          mainPart = address.county;
        } else if (address.state) {
          mainPart = address.state;
        }

        const country = address.country || '';
        let locationName = mainPart ? `${mainPart}${country ? `, ${country}` : ''}` : country;

        // If we got nothing, use display_name (truncated)
        if (!locationName && data.display_name) {
          locationName = data.display_name.split(',')[0] || 'Unknown Location';
        }

        // Cache the result
        setLocationNames(prev => new Map(prev).set(key, locationName));
        return locationName;
      } else {
        throw new Error('No results found');
      }
    } catch (error) {
      console.warn('Failed to get location name:', error);
      const fallbackName = 'Location unavailable';
      setLocationNames(prev => new Map(prev).set(key, fallbackName));
      return fallbackName;
    } finally {
      setLocationLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // Add this useEffect to handle clicks outside the calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Get the calendar element
      const calendarElement = document.getElementById('attendance-calendar');

      // Check if the click is on a map link - don't clear selection in this case
      const isMapLink = (event.target as Element)?.closest('a[href*="google.com/maps"]');

      // If the click is outside the calendar and not on a map link, clear the selection
      if (calendarElement && !calendarElement.contains(event.target as Node) && selectedDate && !isMapLink) {
        setSelectedDate(null);
        setSelectedDateRecords([]);
      }

      // Close download popup when clicking outside
      const downloadButton = document.querySelector('[data-download-button]');
      const downloadPopup = document.querySelector('[data-download-popup]');
      if (downloadPopup && downloadButton && !downloadButton.contains(event.target as Node) && !downloadPopup.contains(event.target as Node)) {
        setDownloadPopup(prev => ({ ...prev, isOpen: false }));
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedDate]);

  // Fetch employee attendance data for selected date
  useEffect(() => {
    const fetchEmployeeAttendanceData = async () => {
      if (!canViewAllAttendance() || !selectedCalendarBarDate) return;

      try {
        const dateString = formatDateForAPI(selectedCalendarBarDate);
        const response = await fetch(`/api/attendance/date?date=${dateString}`);
        const data = await response.json();

        if (data.success && data.records.length > 0) {
          // Get unique IDs from attendance records
          const uniqueIds = [...new Set(data.records.map((record: AttendanceRecord) => record.id))];

          // Fetch employee names for each ID
          const employeePromises = uniqueIds.map(async (id: string) => {
            try {
              const userResponse = await fetch(`/api/user?id=${id}`);
              const userData = await userResponse.json();
              const firstName = userData.user?.firstName || '';
              const lastName = userData.user?.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim();

              return {
                id,
                fullName: fullName || id, // Use ID if name is empty
                role: userData.user?.role || 'Employee',
                type: 'Fulltime' as const
              };
            } catch (error) {
              console.warn(`Failed to fetch user data for ID ${id}:`, error);
              return {
                id,
                fullName: id, // Use ID as fallback
                role: 'Employee',
                type: 'Fulltime' as const
              };
            }
          });

          const employeeInfos = await Promise.all(employeePromises);

          // Create employee data with actual names
          const employeeData = employeeInfos.map(employee => ({
            id: employee.id,
            fullName: employee.fullName,
            role: employee.role,
            type: employee.type,
            regularHours: 8, // Default hours
            overtimeHours: 0,
            sickLeaveHours: 0,
            ptoHours: 0,
            paidHolidayHours: 0,
            totalHours: 8
          }));

          setEmployeeData(employeeData);
        } else {
          console.warn('No attendance records found for selected date');
          setEmployeeData([]);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setEmployeeData([]);
      }
    };

    fetchEmployeeAttendanceData();
  }, [userData, permissionsConfig, selectedCalendarBarDate]);

  // Clear employee data when no date is selected
  useEffect(() => {
    if (canViewAllAttendance() && !selectedCalendarBarDate) {
      setEmployeeData([]);
    }
  }, [userData, permissionsConfig, selectedCalendarBarDate]);

  // Calculate days in current period
  const daysInPeriod = useMemo(() => {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  // Month and year options for download popup
  const downloadMonthOptions = months.map((month, index) => ({ value: index.toString(), label: month }));
  const downloadYearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 1 + i;
    return { value: year.toString(), label: year.toString() };
  });


  // Create a completely stable chart data calculation with manual caching
  const attendanceChartData = useMemo(() => {

    // Early return with stable empty array
    if (!currentUserId || attendanceHistory.length === 0) {
      chartDataCache.current = null;
      return [];
    }

    // Create a stable key for the current state
    const stateKey = `${currentUserId}-${startDate.getTime()}-${endDate.getTime()}-${attendanceHistory.length}`;

    // Check if we have cached data for this exact state
    if (chartDataCache.current && chartDataCache.current.key === stateKey) {
      return chartDataCache.current.data;
    }

    // Get all days in the selected date range
    const daysInRange = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    while (currentDate <= endDate) {
      daysInRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const result = daysInRange.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayAttendance = attendanceHistory.find(record =>
        record.date.startsWith(dateString) && record.id === currentUserId
      );

      const isFutureDate = date > today; // Check if this date is in the future

      let loginTime = null;
      let loginHour = null;

      if (!isFutureDate && dayAttendance && dayAttendance.status === 'present' && dayAttendance.timeIn) {
        // Extract time from timeIn (assuming format like "HH:mm:ss" or full datetime)
        const timeString = dayAttendance.timeIn;
        let timePart = '';
        if (timeString.includes('T')) {
          // Full datetime string like "2025-01-15T15:10:30.123Z"
          timePart = timeString.split('T')[1].split('.')[0]; // Get "15:10:30"
        } else if (timeString.includes(':')) {
          // Time string like "15:10:30"
          timePart = timeString;
        }

        if (timePart) {
          const [hours, minutes] = timePart.split(':').map(Number);

          // Convert UTC time to local time
          const utcDate = new Date();
          utcDate.setUTCHours(hours, minutes, 0, 0);
          const localHours = utcDate.getHours();
          const localMinutes = utcDate.getMinutes();

          loginHour = localHours + (localMinutes / 60); // Convert to decimal hours for Y-axis positioning
          loginTime = `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
        }
      }

      return {
        date: format(date, 'MMM dd'),
        loginHour: isFutureDate ? null : (loginHour !== null ? loginHour : 0), // Null for future dates to break the line
        loginTime: loginTime, // Store the formatted time string
        status: dayAttendance ? (dayAttendance.status === 'present' ? 1 : 0) : 0,
        fullDate: dateString,
        isPresent: dayAttendance?.status === 'present',
        isFutureDate: isFutureDate
      };
    });

    // Cache the result
    chartDataCache.current = { key: stateKey, data: result };
    return result;
  }, [currentUserId, attendanceHistory, startDate, endDate]);

  // Filter attendance records based on search
  const filteredAttendanceRecords = useMemo(() => {
    if (!searchQuery) return selectedDateRecords;
    const query = searchQuery.toLowerCase();
    return selectedDateRecords.filter(record =>
      (record.fullName || record.id).toLowerCase().includes(query) ||
      record.id.toLowerCase().includes(query)
    );
  }, [selectedDateRecords, searchQuery]);

  // Show inline loading when attendance data is loading

  return (
    <div className="bg-white min-h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"></div>
              <div className="w-8 h-8 rounded-full border-2 border-t-gray-800 dark:border-t-white border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0 animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading attendance data...</p>
          </div>
        </div>
      )}
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Attendance Title - Left Side */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-900 dark:text-white" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Time & Attendance</h1>
          </div>

          {/* Quick Check In Button */}
          {userData && (
            <button
              onClick={markAttendance}
              disabled={hasMarkedToday}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${hasMarkedToday
                ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-900'
                }`}
            >
              {hasMarkedToday ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Marked
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Check In
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">

        {/* Timesheet Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timesheet</h2>
            <div className="flex items-center gap-3">
              <div className="relative" data-download-button>
                <button
                  onClick={() => setDownloadPopup(prev => ({ ...prev, isOpen: true }))}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Download
                </button>

                {/* Download Popup */}
                {downloadPopup.isOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-4 z-50" data-download-popup>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Download Attendance Report</h3>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Month</label>
                          <AnimatedSelect
                            id="download-month"
                            value={downloadPopup.selectedMonth.toString()}
                            onChange={(value) => setDownloadPopup(prev => ({ ...prev, selectedMonth: parseInt(value) }))}
                            options={downloadMonthOptions}
                            className="!w-38 !text-xs"
                            dropdownClassName="!w-43"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Year</label>
                          <AnimatedSelect
                            id="download-year"
                            value={downloadPopup.selectedYear.toString()}
                            onChange={(value) => setDownloadPopup(prev => ({ ...prev, selectedYear: parseInt(value) }))}
                            options={downloadYearOptions}
                            className="!text-xs"
                            dropdownClassName="!w-20"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setDownloadPopup(prev => ({ ...prev, isOpen: false }))}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDownload}
                          disabled={exportLoading}
                          className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {exportLoading ? 'Downloading...' : 'Download PDF'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                Setting
              </button> */}
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-gray-600 dark:text-gray-400">Time period:</span>
            <ModernDateRangePicker
              startValue={formatDateForPicker(startDate)}
              endValue={formatDateForPicker(endDate)}
              onStartChange={(value) => setStartDate(value ? new Date(value + 'T00:00:00') : getDefaultDates().start)}
              onEndChange={(value) => setEndDate(value ? new Date(value + 'T00:00:00') : getDefaultDates().end)}
              placeholder="Select date range"
              className="flex-1 max-w-60"
            />
          </div>

          {/* Attendance Timeline Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Login Time Timeline ({attendanceChartData.length} days)
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Login Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <span>Future</span>
                </div>
              </div>
            </div>
            <StableAttendanceTimelineChart data={attendanceChartData} />
          </div>

          {/* Calendar Bar */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                This Month: <span className="font-semibold text-gray-900 dark:text-white">{startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
              </span>
            </div>
            <div className="flex gap-0.5">
              {daysInPeriod.map((day, index) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const isPast = day < new Date() && !isToday;
                const isSelected = selectedCalendarBarDate && day.toDateString() === selectedCalendarBarDate.toDateString();
                const dayNum = day.getDate();

                // Check if current user has attendance for this date
                const isUserPresent = attendanceHistory.some(record => {
                  const recordDate = new Date(record.date);
                  return recordDate.toDateString() === day.toDateString() && record.status === 'present' && record.id === currentUserId;
                });

                return (
                  <div
                    key={index}
                    onClick={() => handleCalendarBarDateSelect(day)}
                    className={`flex-1 h-10 flex items-center justify-center text-xs font-semibold rounded transition-all cursor-pointer
                      ${isSelected ? 'bg-indigo-800 hover:bg-indigo-900 text-white ring-2 ring-indigo-700' : ''}
                      ${isToday ? 'bg-blue-800 hover:bg-blue-900 text-white' : ''}
                      ${!isSelected && !isToday && isPast && isUserPresent ? 'bg-emerald-800 hover:bg-emerald-900 text-white' : ''}
                      ${!isSelected && !isToday && isPast && !isUserPresent ? 'bg-red-800 hover:bg-red-900 text-white' : ''}
                      ${!isPast && !isToday && !isSelected ? 'bg-gray-300 text-gray-600 hover:bg-gray-400' : ''}
                    `}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div
              className="relative w-72"
              onMouseEnter={() => searchIconRef.current?.playAnimation()}
              onMouseLeave={() => searchIconRef.current?.goToFirstFrame()}
            >
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <LordIcon
                  ref={searchIconRef}
                  icon={searchIcon}
                  size={16}
                  className="text-gray-400"
                  trigger="manual"
                />
              </div>
              <input
                type="text"
                placeholder="Search employee or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAttendanceRecords.map((record, index) => (
                  <tr key={`${record.id}-${index}`} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center text-white font-semibold text-sm">
                          {(record.fullName || record.id)[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{record.fullName || record.id}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{record.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {new Date(record.timeIn).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {record.status === 'present' ? 'Present' : 'Absent'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <LocationNameDisplay record={record} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        •••
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* No attendance records message */}
        {selectedCalendarBarDate && filteredAttendanceRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-600 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11M9 11h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
              No Attendance Records
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Seems like it was a holiday or no one marked attendance on this date
            </p>
          </div>
        )}

        {/* Export Modal (if needed) */}
        {exportOptions.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Export Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Export Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="exportType"
                        checked={exportOptions.type === 'month'}
                        onChange={() => setExportOptions({ ...exportOptions, type: 'month' })}
                        className="form-radio"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Entire Month</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="exportType"
                        checked={exportOptions.type === 'date'}
                        onChange={() => setExportOptions({ ...exportOptions, type: 'date' })}
                        className="form-radio"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Specific Date</span>
                    </label>
                  </div>
                </div>

                {exportOptions.type === 'date' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={exportOptions.date?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setExportOptions({ ...exportOptions, date: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setExportOptions({ ...exportOptions, isOpen: false })}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-400 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={exportLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                  >
                    {exportLoading ? 'Exporting...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}