'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function QuickAttendancePage() {
  const [id, setId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id.trim()) {
      toast.error('Please enter your ID');
      return;
    }

    setIsSubmitting(true);

    try {
      // First get location
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Got location, now submit attendance
          const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: id.trim(),
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              }
            }),
          });

          const data = await response.json();

          if (data.success) {
            toast.success('Attendance marked successfully!', {
              position: 'bottom-center',
              duration: 2000,
              style: {
                marginBottom: '80px',
                background: '#4B0082',
                color: '#fff',
              },
            });
            setId('');
          } else {
            toast.error(data.error || 'Failed to mark attendance', {
              position: 'bottom-center',
              style: {
                marginBottom: '80px',
              },
            });
          }
        },
        (error) => {
          toast.error('Please enable location access to mark attendance', {
            position: 'bottom-center',
            style: {
              marginBottom: '80px',
            },
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-100">
        <div className="w-full max-w-md">
          <div className="mb-8 md:mb-12">
            <Image
              src="/images/tms-logo.svg"
              alt="TMS Logo"
              width={70}
              height={21}
              priority
              className="mb-6"
            />
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Quick Attendance
            </h1>
            <p className="text-slate-600 text-lg font-normal">
              Enter your ID to mark your attendance
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 md:space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                ID
              </label>
              <div>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value.toUpperCase())}
                  placeholder="Enter your ID"
                  className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-black text-white py-4 px-5 rounded-lg hover:bg-slate-900 font-semibold ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Marking Attendance...' : 'Mark Attendance'}
            </button>

            <div className="text-center pt-4 md:pt-6">
              <Link href="/">
                <div className="inline-flex items-center text-slate-600 text-sm md:text-base font-medium hover:text-slate-900">
                  <span className="mr-2">←</span>
                  Back to Login
                </div>
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section - Only show on desktop */}
      <div className="hidden md:block md:w-1/2 bg-black p-8 relative overflow-hidden">
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Quick Attendance
          </h2>
          <p className="text-lg text-slate-400 text-center max-w-md">
            Mark your daily attendance with just your ID
          </p>
        </div>
      </div>
    </div>
  );
}





















