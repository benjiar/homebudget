import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, LoadingPage, LoadingCard, LoadingSkeleton } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { getCachedHouseholdsSync, hasCachedHouseholds } from '@/hooks/useHouseholdGuard';
import { Category, Household, formatCurrency } from '@homebudget/types';

interface BudgetOverview {
  categories: Array<{
    category: Category;
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  summary: {
    total_budget: number;
    total_spent: number;
    total_remaining: number;
    overall_percentage: number;
  };
}

export default function BudgetPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const { household: householdId } = router.query;
  
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadHouseholds();
    }
  }, [user]);

  // Set default household from URL param
  useEffect(() => {
    if (householdId && typeof householdId === 'string') {
      setSelectedHousehold(householdId);
    }
  }, [householdId]);

  // Load budget overview when household or date changes
  useEffect(() => {
    if (selectedHousehold) {
      loadBudgetOverview();
    }
  }, [selectedHousehold, selectedMonth, selectedYear]);

  const loadHouseholds = async () => {
    setIsLoadingHouseholds(true);
    try {
      // Use cached households instead of API call
      if (user && hasCachedHouseholds(user.id)) {
        const cachedHouseholds = getCachedHouseholdsSync(user.id);
        setHouseholds(cachedHouseholds);
        console.log(`⚡ BUDGET: Using ${cachedHouseholds.length} cached households`);
        
        // If no household selected and we have households, select the first one
        if (!selectedHousehold && cachedHouseholds.length > 0) {
          setSelectedHousehold(cachedHouseholds[0].id);
        }
      } else {
        console.log('⚠️ BUDGET: No cached households, will wait for guard to fetch');
        setHouseholds([]);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load households' 
      });
    } finally {
      setIsLoadingHouseholds(false);
    }
  };

  const loadBudgetOverview = async () => {
    if (!selectedHousehold) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories/budget-overview/${selectedHousehold}?month=${selectedMonth}&year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load budget overview');
      }

      const data = await response.json();
      setBudgetOverview(data);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load budget overview' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage <= 50) return 'bg-green-500';
    if (percentage <= 80) return 'bg-yellow-500';
    if (percentage <= 100) return 'bg-orange-500';
    return 'bg-red-500'; // Red for overspending
  };

  const getProgressBarBgColor = (percentage: number) => {
    if (percentage <= 50) return 'bg-green-100';
    if (percentage <= 80) return 'bg-yellow-100';
    if (percentage <= 100) return 'bg-orange-100';
    return 'bg-red-100'; // Red background for overspending
  };

  const getProgressBarWidth = (percentage: number) => {
    // Cap the visual width at 100% but show the actual percentage in text
    return Math.min(100, percentage);
  };

  const getTextColor = (percentage: number) => {
    if (percentage <= 100) return 'text-slate-900';
    return 'text-red-600 font-bold'; // Bold red text for overspending
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (loading) {
    return (
      <LoadingPage 
        title="Loading Budget" 
        subtitle="Please wait while we load your budget overview..." 
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Budget">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Budget Overview</h1>
              <p className="mt-1 text-sm text-slate-600">
                Track your spending against your monthly budgets
              </p>
            </div>
            <Button
              onClick={() => router.push('/categories')}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
            >
              Manage Categories
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Household Selector */}
            {isLoadingHouseholds ? (
              <LoadingSkeleton width="w-48" height="h-10" />
            ) : households.length > 1 ? (
              <div>
                <label htmlFor="household" className="block text-sm font-medium text-slate-700 mb-2">
                  Household
                </label>
                <select
                  id="household"
                  value={selectedHousehold}
                  onChange={(e) => setSelectedHousehold(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a household...</option>
                  {households.map((household) => (
                    <option key={household.id} value={household.id}>
                      {household.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Month Selector */}
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-slate-700 mb-2">
                Month
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-2">
                Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 text-sm">{message.text}</div>
              </div>
            </div>
          )}

          {selectedHousehold ? (
            <>
              {isLoading ? (
                <div className="space-y-6">
                  <LoadingCard lines={4} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <LoadingCard key={i} lines={3} />
                    ))}
                  </div>
                </div>
              ) : budgetOverview ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {months[selectedMonth - 1]} {selectedYear} Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatCurrency(budgetOverview.summary.total_budget)}
                        </div>
                        <div className="text-sm text-slate-600">Total Budget</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatCurrency(budgetOverview.summary.total_spent)}
                        </div>
                        <div className="text-sm text-slate-600">Total Spent</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${budgetOverview.summary.total_remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budgetOverview.summary.total_remaining)}
                        </div>
                        <div className="text-sm text-slate-600">Remaining</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getTextColor(budgetOverview.summary.overall_percentage)}`}>
                          {budgetOverview.summary.overall_percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-600">Used</div>
                      </div>
                    </div>
                    
                    {/* Overall Progress Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Overall Progress</span>
                        <span className={getTextColor(budgetOverview.summary.overall_percentage)}>
                          {budgetOverview.summary.overall_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`w-full ${getProgressBarBgColor(budgetOverview.summary.overall_percentage)} rounded-full h-3`}>
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budgetOverview.summary.overall_percentage)}`}
                          style={{ width: `${getProgressBarWidth(budgetOverview.summary.overall_percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Budget Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgetOverview.categories
                      .filter(item => item.budget > 0)
                      .map((item) => (
                      <div key={item.category.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium shadow-sm"
                              style={{ backgroundColor: item.category.color }}
                            >
                              <span className="text-sm">
                                {item.category.icon || '📂'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{item.category.name}</h4>
                              <p className="text-sm text-slate-600">
                                {formatCurrency(item.spent)} of {formatCurrency(item.budget)}
                              </p>
                            </div>
                          </div>
                          {item.percentage > 100 && (
                            <div className="text-red-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Progress</span>
                            <span className={`font-medium ${getTextColor(item.percentage)}`}>
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className={`w-full ${getProgressBarBgColor(item.percentage)} rounded-full h-2`}>
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(item.percentage)}`}
                              style={{ width: `${getProgressBarWidth(item.percentage)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Remaining</span>
                            <span className={`font-medium ${item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(item.remaining)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Categories without budgets */}
                  {budgetOverview.categories.filter(item => item.budget === 0).length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Categories without Budgets</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgetOverview.categories
                          .filter(item => item.budget === 0)
                          .map((item) => (
                          <div key={item.category.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: item.category.color }}
                              >
                                {item.category.icon || '📂'}
                              </div>
                              <span className="font-medium text-slate-900">{item.category.name}</span>
                            </div>
                            <span className="text-sm text-slate-600">
                              {formatCurrency(item.spent)} spent
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center">
                        <Button
                          onClick={() => router.push('/categories')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Set Budgets
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No budget data available</h3>
                  <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                    Set up budgets for your categories to start tracking your spending.
                  </p>
                  <Button
                    onClick={() => router.push('/categories')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Manage Categories
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No household selected</h3>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                Please select a household to view budget information.
              </p>
              <Button
                onClick={() => router.push('/households')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Manage Households
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </RequireHousehold>
  );
} 