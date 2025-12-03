'use client'

import { useEffect, useState } from 'react';

export default function FirstTimeNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if user has visited before using cookie
    const hasVisited = document.cookie
      .split('; ')
      .find(row => row.startsWith('hasVisitedBefore='));
    
    if (!hasVisited) {
      setShowNotice(true);
    }

    // Check if cookie consent was given
    const cookieConsent = document.cookie
      .split('; ')
      .find(row => row.startsWith('cookieConsent='));
    
    if (!cookieConsent) {
      // Show cookie consent after a brief delay
      setTimeout(() => setShowCookieConsent(true), 500);
    }
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return null;

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  };

  const handleClose = () => {
    // Mark as visited - set cookie for 365 days
    setCookie('hasVisitedBefore', 'true', 365);
    setShowNotice(false);
  };

  const handleAcceptCookies = () => {
    // Set cookie consent for 365 days
    setCookie('cookieConsent', 'true', 365);
    setShowCookieConsent(false);
  };

  return (
    <>
      {/* First Time Notice - Full Screen */}
      {showNotice && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8"
          style={{ 
            backgroundColor: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
            letterSpacing: '-0.015em'
          }}
        >
          <div className="max-w-2xl w-full text-center space-y-8">
            {/* Asterisk Icon matching the theme */}
            <div className="flex justify-center mb-8">
              <svg width="64" height="64" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35 0L35 70M0 35L70 35M11.8 11.8L58.2 58.2M11.8 58.2L58.2 11.8" stroke="#111827" strokeWidth="7" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="space-y-6">
              <h1 
                className="text-4xl font-bold mb-4" 
                style={{ 
                  letterSpacing: '-0.025em',
                  color: '#111827'
                }}
              >
                Welcome
              </h1>
              <p 
                className="text-lg leading-relaxed max-w-xl mx-auto"
                style={{ color: '#374151' }}
              >
                This website is for Visual Representation of how a custom payroll and HR management site would work. 
                I am still working on it so you may find some bugs. Feedback is appreciated.
              </p>
              <button
                onClick={handleClose}
                className="mt-8 px-8 py-3.5 rounded-lg transition-all duration-200 font-semibold text-base shadow-sm"
                style={{
                  backgroundColor: '#111827',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Consent Banner - Bottom */}
      {showCookieConsent && !showNotice && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                {/* Cookie Icon */}
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-gray-900 dark:text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM7.5 9C8.33 9 9 9.67 9 10.5C9 11.33 8.33 12 7.5 12C6.67 12 6 11.33 6 10.5C6 9.67 6.67 9 7.5 9ZM16.5 17C15.67 17 15 16.33 15 15.5C15 14.67 15.67 14 16.5 14C17.33 14 18 14.67 18 15.5C18 16.33 17.33 17 16.5 17ZM16.5 12C15.67 12 15 11.33 15 10.5C15 9.67 15.67 9 16.5 9C17.33 9 18 9.67 18 10.5C18 11.33 17.33 12 16.5 12ZM10.5 17C9.67 17 9 16.33 9 15.5C9 14.67 9.67 14 10.5 14C11.33 14 12 14.67 12 15.5C12 16.33 11.33 17 10.5 17Z" fill="currentColor"/>
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ letterSpacing: '-0.015em' }}>
                    Essential Cookie Notice
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    This website uses an essential, non-tracking cookie to remember your first visit. 
                    This cookie doesn't collect any personal information and is strictly necessary for the website to function properly. 
                    No data is shared with third parties.
                  </p>
                </div>

                {/* Accept Button */}
                <div className="flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={handleAcceptCookies}
                    className="w-full md:w-auto px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 font-semibold text-sm whitespace-nowrap shadow-sm"
                  >
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

