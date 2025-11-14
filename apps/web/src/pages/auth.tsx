import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, LoadingPage } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import Link from 'next/link';

export default function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      // Check if there's a redirect parameter
      const redirect = router.query.redirect as string;
      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Handle OAuth error from URL params
  useEffect(() => {
    const { error } = router.query;
    if (error === 'oauth_failed') {
      setMessage({ type: 'error', text: 'Google authentication failed. Please try again.' });
    } else if (error === 'unexpected') {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    }
  }, [router.query]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setMessage({ type: 'error', text: error.message || 'Sign-in failed. Please try again.' });
        } else {
          setMessage({ type: 'success', text: 'Welcome back! Redirecting to your dashboard...' });
        }
      } else {
        const { error } = await signUp(formData.email, formData.password);
        if (error) {
          setMessage({ type: 'error', text: error.message || 'Sign-up failed. Please try again.' });
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Account created successfully! Please check your email to verify your account.' 
          });
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Authentication failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setMessage({
          type: 'error',
          text: error.message || 'Google authentication failed. Please try again.',
        });
        setIsSubmitting(false);
      }
      // Note: Don't set isSubmitting to false here if successful, 
      // as the user will be redirected to Google and then back
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Google authentication failed. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  if (loading) {
    return (
      <LoadingPage 
        title="Authenticating" 
        subtitle="Please wait while we set up your account..." 
      />
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-violet-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            {/* Back to home link */}
            <div className="text-center mb-8">
              <Link href="/" className="group inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors duration-300">
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
            </div>

            {/* Auth Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 transform hover:scale-[1.02] transition-all duration-300">
              {/* Logo and Title */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <span className="text-2xl font-bold text-white">₪</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg animate-bounce delay-300"></div>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                  {mode === 'signin' ? 'Welcome Back' : 'Join HomeBudget'}
                </h1>
                <p className="text-slate-600">
                  {mode === 'signin' 
                    ? 'Sign in to your financial command center' 
                    : 'Start managing your family finances like a pro'
                  }
                </p>
              </div>

              {/* Message */}
              {message && (
                <div className={`mb-6 p-4 rounded-2xl border transition-all duration-300 ${
                  message.type === 'success' 
                    ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/50' 
                    : 'bg-red-50/80 text-red-800 border-red-200/50'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {message.type === 'success' ? (
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium">{message.text}</div>
                  </div>
                </div>
              )}

              {/* Google Auth Button */}
              <Button
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full mb-6 bg-white hover:bg-gray-50 text-slate-700 border border-slate-300 shadow-sm hover:shadow-md font-semibold h-12 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center">
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-700 mr-3"></div>
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </div>
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">Or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange('fullName')}
                      className={`w-full px-4 py-3 border rounded-2xl shadow-sm bg-white/90 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 ${
                        errors.fullName ? 'border-red-300 focus:border-red-300 focus:ring-red-500/50' : 'border-slate-300'
                      }`}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                    />
                    {errors.fullName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`w-full px-4 py-3 border rounded-2xl shadow-sm bg-white/90 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 ${
                      errors.email ? 'border-red-300 focus:border-red-300 focus:ring-red-500/50' : 'border-slate-300'
                    }`}
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`w-full px-4 py-3 border rounded-2xl shadow-sm bg-white/90 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 ${
                      errors.password ? 'border-red-300 focus:border-red-300 focus:ring-red-500/50' : 'border-slate-300'
                    }`}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      className={`w-full px-4 py-3 border rounded-2xl shadow-sm bg-white/90 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 ${
                        errors.confirmPassword ? 'border-red-300 focus:border-red-300 focus:ring-red-500/50' : 'border-slate-300'
                      }`}
                      placeholder="Confirm your password"
                      disabled={isSubmitting}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold h-12 rounded-2xl shadow-lg hover:shadow-blue-500/25 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                      </svg>
                    </span>
                  )}
                </Button>
              </form>

              {/* Mode Toggle */}
              <div className="mt-8 text-center">
                <p className="text-slate-600">
                  {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setErrors({});
                      setMessage(null);
                    }}
                    disabled={isSubmitting}
                    className="ml-2 font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 disabled:opacity-50"
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>

              {/* Terms and Privacy */}
              {mode === 'signup' && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-500">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-6 text-slate-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">256-bit SSL</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Trusted by 5,000+ families</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
