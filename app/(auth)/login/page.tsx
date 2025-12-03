'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/toast-config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: ID input, 2: Password input
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your ID');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: email, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (data.success) {
        if (data.user) {
          try { localStorage.setItem('fullName', data.user.fullName || ''); } catch { }
          try { sessionStorage.setItem('fullName', data.user.fullName || ''); } catch { }
          try { localStorage.setItem('id', data.user.id || ''); } catch { }
        }

        showSuccessToast('Login successful', { duration: 2000 });

        try { sessionStorage.setItem('justLoggedIn', 'true'); } catch { }

        const start = Date.now();
        let attempts = 0;
        const maxAttempts = 10; // Limit to 10 attempts

        const waitForCookie = () => {
          attempts++;
          const hasSession = document.cookie.split('; ').some(c => c.startsWith('sessionUser='));

          if (hasSession) {
            router.replace('/dashboard?loginSuccess=true');
          } else if (attempts >= maxAttempts || Date.now() - start > 1000) {
            // Fallback: redirect anyway after max attempts or 1 second timeout
            router.replace('/dashboard?loginSuccess=true');
          } else {
            setTimeout(waitForCookie, 100); // Poll every 100ms instead of 50ms
          }
        };
        waitForCookie();
      } else {
        setError(data.message || 'Invalid credentials');
        setPassword('');
        setIsLoading(false);
        showErrorToast(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Something went wrong');
      setPassword('');
      setIsLoading(false);
      showErrorToast('Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields are filled
    if (!email.trim() || !fullName.trim() || !emailAddress.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All fields except department are required');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/auth/public-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: email,
          name: fullName,
          email: emailAddress,
          password,
          department: department || undefined
        }),
      });

      const data = await res.json();

      if (data.success) {
        showSuccessToast('Registration successful! Please login.', { duration: 3000 });

        // Reset form and switch to login mode
        setIsRegisterMode(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setEmailAddress('');
        setDepartment('');
        setCurrentStep(1);
      } else {
        setError(data.error || 'Registration failed');
        showErrorToast(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong');
      showErrorToast('Registration failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] p-4 lg:p-8">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[120px]"></div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[1200px] h-[700px] flex rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-black relative z-10">

        {/* Left Section - Form */}
        <div className="w-full lg:w-[45%] bg-black flex flex-col justify-center p-8 lg:p-12 xl:p-16 relative">
          <div className="w-full max-w-sm mx-auto">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M35 0L35 70M0 35L70 35M11.8 11.8L58.2 58.2M11.8 58.2L58.2 11.8" stroke="white" strokeWidth="7" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Payroll</span>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {isRegisterMode ? 'Sign up' : 'Login'}
              </h1>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {isRegisterMode ? 'Create your account and start managing your payroll efficiently.' : 'Welcome back! Please enter your details.'}
              </p>
            </div>

            {/* Form */}
            {isRegisterMode ? (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-3">
                {/* ID Input */}
                <div className="space-y-1">
                  <input
                    id="id"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toUpperCase())}
                    placeholder="ENTER ID"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm uppercase"
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Full Name Input */}
                <div className="space-y-1">
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm"
                    required
                    autoComplete="name"
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-1">
                  <input
                    id="emailAddress"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Email Address"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1 relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1 relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-xs text-red-400 bg-red-900/10 p-2.5 rounded-lg border border-red-900/20">
                    {error}
                  </div>
                )}

                {/* Register Button */}
                <button
                  type="submit"
                  className="w-full bg-white text-black py-3 px-4 rounded-xl hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black font-semibold text-sm transition-all mt-2"
                >
                  Create Account
                </button>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={currentStep === 1 ? handleContinue : handleSubmit} className="space-y-3">
                {/* Step 1: ID Input */}
                {currentStep === 1 ? (
                  <>
                    <div className="space-y-1">
                      <input
                        id="id"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toUpperCase())}
                        placeholder="ENTER ID"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm uppercase"
                        required
                        autoComplete="username"
                        autoFocus
                      />
                    </div>

                    {error && (
                      <div className="text-xs text-red-400 bg-red-900/10 p-2.5 rounded-lg border border-red-900/20">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-white text-black py-3 px-4 rounded-xl hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </>
                ) : (
                  /* Step 2: Password Input */
                  <>
                    <div className="space-y-1">
                      <input
                        id="id"
                        type="text"
                        value={email}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-zinc-500 shadow-sm uppercase cursor-not-allowed text-sm"
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm"
                        required
                        autoComplete="current-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {error && (
                      <div className="text-xs text-red-400 bg-red-900/10 p-2.5 rounded-lg border border-red-900/20">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(1);
                          setPassword('');
                          setError('');
                        }}
                        className="flex-1 bg-zinc-900 text-zinc-400 py-3 px-4 rounded-xl hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-black font-semibold text-sm transition-all"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] bg-white text-black py-3 px-4 rounded-xl hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging in...
                          </>
                        ) : (
                          'Login'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* Footer / Toggle */}
            <div className="mt-6 pt-6 border-t border-zinc-900">
              <p className="text-zinc-500 text-sm text-center">
                {isRegisterMode ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setIsRegisterMode(false);
                        setError('');
                        setCurrentStep(1);
                      }}
                      className="text-white font-medium hover:underline transition-all"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setIsRegisterMode(true);
                        setError('');
                        setEmail('');
                        setPassword('');
                      }}
                      className="text-white font-medium hover:underline transition-all"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Visual */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-zinc-900 items-center justify-center">
          {/* Background Gradient/Image */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-80"></div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          {/* Abstract 3D Object Placeholder (CSS only) */}
          <div className="relative z-10 w-64 h-64">
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-600 rounded-3xl transform rotate-12 shadow-2xl border border-white/10 backdrop-blur-sm"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-white/10 to-transparent rounded-3xl transform -rotate-6 scale-90 border border-white/5"></div>

            {/* Floating Elements */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-zinc-800 rounded-2xl shadow-xl animate-bounce-staggered" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-zinc-700/50 backdrop-blur-md rounded-full shadow-xl animate-bounce-staggered"></div>
          </div>

          {/* Overlay Text */}
          <div className="absolute bottom-12 left-12 right-12 z-20">
            <p className="text-white/80 text-lg font-medium">"Automate your payroll workflow with ease."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
