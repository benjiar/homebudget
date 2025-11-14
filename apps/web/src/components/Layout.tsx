import React, { useState, useEffect, Suspense, ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { Button } from '@homebudget/ui';
import { CacheDebugger } from './CacheDebugger';
import { MultiSelectHouseholdDropdown } from './MultiSelectHouseholdDropdown';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

const LoadingSpinner = () => (
  <div className="inline-flex items-center">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
  </div>
);

// Page transition loading component
const PageTransitionLoading = () => (
  <div className="fixed top-0 left-0 right-0 z-50">
    <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-pulse"></div>
    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 animate-loading-bar"></div>
  </div>
);

export function Layout({ children, title = 'HomeBudget', showHeader = true }: LayoutProps) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get households from context
  const { households } = useHousehold();
  const hasHouseholds = households.length > 0;

  // Handle router events for seamless navigation
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsNavigating(true);
      // Close mobile menu when navigating
      setIsMobileMenuOpen(false);
      setIsProfileMenuOpen(false);
    };

    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
    };

    const handleRouteChangeError = () => {
      setIsNavigating(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
    };

    if (isProfileMenuOpen || isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileMenuOpen, isMobileMenuOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠', current: router.pathname === '/', requiresHousehold: false },
    { name: 'Receipts', href: '/receipts', icon: '📄', current: router.pathname === '/receipts', requiresHousehold: true },
    { name: 'Budgets', href: '/budgets', icon: '💰', current: router.pathname === '/budgets', requiresHousehold: true },
    { name: 'Categories', href: '/categories', icon: '🏷️', current: router.pathname === '/categories', requiresHousehold: true },
    { name: 'Households', href: '/households', icon: '🏘️', current: router.pathname === '/households', requiresHousehold: false },
    { name: 'Reports', href: '/reports', icon: '📊', current: router.pathname === '/reports', requiresHousehold: true }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Enhanced navigation link component with prefetching
  const NavigationLink = ({ item, mobile = false }: { item: any; mobile?: boolean }) => {
    const isDisabled = item.requiresHousehold && !hasHouseholds;

    if (isDisabled) {
      return (
        <div
          key={item.name}
          className={`group relative font-medium text-slate-400 cursor-not-allowed border border-transparent ${mobile
            ? 'flex items-center space-x-3 px-4 py-3 rounded-xl'
            : 'px-4 py-2 rounded-xl'
            }`}
          title="Create a household first to access this feature"
        >
          <span className={`${mobile ? 'text-lg' : 'text-sm'} opacity-50`}>{item.icon}</span>
          <span className="opacity-50">{item.name}</span>
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        prefetch={true} // Enable prefetching for faster navigation
        className={`group relative font-medium transition-all duration-300 ${mobile
          ? 'flex items-center space-x-3 px-4 py-3 rounded-xl'
          : 'px-4 py-2 rounded-xl'
          } ${item.current
            ? 'text-blue-700 bg-blue-100/90 shadow-md border border-blue-200/50'
            : 'text-slate-800 hover:text-blue-700 hover:bg-blue-50/80 border border-transparent hover:border-blue-200/30 hover:scale-105'
          }`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <span className={`${mobile ? 'text-lg' : 'text-sm'} group-hover:scale-110 transition-transform duration-300`}>
          {item.icon}
        </span>
        <span>{item.name}</span>
        {item.current && !mobile && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
        )}
      </Link>
    );
  };

  return (
    <>
      <Head>
        <title>{title === 'HomeBudget' ? title : `${title} - HomeBudget`}</title>
        <meta name="description" content="Professional household budget management for modern families" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Preload key pages for faster navigation */}
        <link rel="preload" href="/households" as="document" />
        <link rel="preload" href="/receipts" as="document" />
        <link rel="preload" href="/budget" as="document" />
      </Head>

      {/* Page transition loading bar */}
      {isNavigating && <PageTransitionLoading />}

      <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 transition-all duration-300">
        {showHeader && (
          <Suspense fallback={<div className="h-20 bg-white/80 backdrop-blur-lg"></div>}>
            <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled
              ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-blue-500/5 border-b border-white/20'
              : 'bg-white/80 backdrop-blur-lg border-b border-white/10'
              }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                  {/* Logo */}
                  <Link href="/" prefetch={true} className="group flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <span className="text-lg font-bold text-white">₪</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300"></div>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                      HomeBudget
                    </span>
                  </Link>

                  {/* Desktop Navigation */}
                  {user && (
                    <nav className="hidden md:flex items-center space-x-1">
                      {navigation.map((item) => (
                        <NavigationLink key={item.name} item={item} />
                      ))}
                    </nav>
                  )}

                  {/* Household Selector & User Menu / Auth Buttons */}
                  <div className="flex items-center space-x-4">
                    {user && hasHouseholds && (
                      <div className="hidden lg:block">
                        <MultiSelectHouseholdDropdown />
                      </div>
                    )}

                    {user ? (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileMenuOpen(!isProfileMenuOpen);
                          }}
                          className="group flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                            <span className="text-sm font-semibold text-white">
                              {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="hidden sm:block text-left">
                            <div className="text-sm font-semibold text-slate-900">
                              {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </div>
                            <div className="text-xs text-slate-500">
                              {user.email}
                            </div>
                          </div>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''
                              }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileMenuOpen && (
                          <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="px-4 py-3 border-b border-slate-100">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-sm font-semibold text-white">
                                    {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {user.user_metadata?.full_name || 'User'}
                                  </div>
                                  <div className="text-sm text-slate-500 truncate">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="py-2">
                              <Link
                                href="/profile"
                                prefetch={true}
                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile Settings
                              </Link>

                              <button
                                onClick={handleSignOut}
                                disabled={loading}
                                className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-red-50/80 hover:text-red-700 transition-colors duration-200 disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {loading ? <LoadingSpinner /> : 'Sign Out'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Link href="/auth" prefetch={true} passHref>
                          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Mobile Menu Button */}
                    {user && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMobileMenuOpen(!isMobileMenuOpen);
                        }}
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <div className="relative w-5 h-5">
                          <span className={`absolute block h-0.5 w-5 bg-slate-700 transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                            }`}></span>
                          <span className={`absolute block h-0.5 w-5 bg-slate-700 transform transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                            }`}></span>
                          <span className={`absolute block h-0.5 w-5 bg-slate-700 transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                            }`}></span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Navigation */}
                {user && isMobileMenuOpen && (
                  <div className="md:hidden py-4 border-t border-white/20 animate-in slide-in-from-top-2 fade-in duration-200">
                    <nav className="space-y-2">
                      {navigation.map((item) => (
                        <NavigationLink key={item.name} item={item} mobile={true} />
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            </header>
          </Suspense>
        )}

        {/* Main Content with smooth transitions */}
        <main className="relative">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl animate-pulse">
                    <span className="text-2xl font-bold text-white">₪</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-slate-900">Loading your financial dashboard...</div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div className={`transition-opacity duration-300 ${isNavigating ? 'opacity-50' : 'opacity-100'}`}>
              {children}
            </div>
          </Suspense>
        </main>

        {/* Footer - only show for non-authenticated users */}
        {!user && (
          <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-2">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-white">₪</span>
                    </div>
                    <span className="text-xl font-bold">HomeBudget</span>
                  </div>
                  <p className="text-slate-300 mb-6 max-w-md">
                    The most sophisticated household budget management platform designed for modern Israeli families.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Product</h4>
                  <ul className="space-y-2 text-slate-300">
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Features</a></li>
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Pricing</a></li>
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Security</a></li>
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Mobile App</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Support</h4>
                  <ul className="space-y-2 text-slate-300">
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors duration-200">Terms</a></li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-white/20 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-slate-400 text-sm">
                  © 2024 HomeBudget. All rights reserved.
                </p>
                <p className="text-slate-400 text-sm mt-4 sm:mt-0">
                  Made with ❤️ for Israeli families
                </p>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl animate-pulse">
              <span className="text-2xl font-bold text-white">₪</span>
            </div>
            <div className="space-y-2">
              <div className="text-xl font-semibold text-slate-900">Please wait...</div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cache debugger - only shows in development when URL param debug=cache is present */}
      <CacheDebugger showDebug={typeof window !== 'undefined' && window.location.search.includes('debug=cache')} />

      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
} 