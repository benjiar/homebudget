import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useApiClient } from '../hooks/useApiClient';
import { LoadingPage } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { MessageAlert } from '../components/common/MessageAlert';
import { Category, formatCurrency } from '@homebudget/types';

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
  const { user, loading } = useAuth();
  const { isLoading: isLoadingHouseholds, households } = useHousehold();
  const client = useApiClient();

  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const previousMonthRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth and households to finish loading
    // Only load if month/year changed or first load
    const currentMonthKey = `${selectedYear}-${selectedMonth}`;
    if (user && !loading && !isLoadingHouseholds && households.length > 0) {
      if (previousMonthRef.current !== currentMonthKey) {
        previousMonthRef.current = currentMonthKey;
        loadBudgetOverview();
      }
    }
  }, [user, loading, isLoadingHouseholds, households.length, selectedMonth, selectedYear]);

  const loadBudgetOverview = async () => {
    setIsLoading(true);
    try {
      const data = await client.get<BudgetOverview>(
        `/categories/budget-overview?month=${selectedMonth}&year=${selectedYear}`
      );
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
    return 'bg-red-500';
  };

  const getProgressBarBgColor = (percentage: number) => {
    if (percentage <= 50) return 'bg-green-100';
    if (percentage <= 80) return 'bg-yellow-100';
    if (percentage <= 100) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getProgressBarWidth = (percentage: number) => Math.min(100, percentage);

  const getTextColor = (percentage: number) =>
    percentage <= 100 ? 'text-slate-900' : 'text-red-600 font-bold';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (loading) {
    return <LoadingPage title="Loading Budget" subtitle="Please wait..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Budget">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Budget Overview</h1>
              <p className="mt-1 text-sm text-slate-600">
                Track your spending against your budget goals
              </p>
            </div>

            <MessageAlert message={message} />

            {/* Date Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="block w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="block w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Budget Overview */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-slate-600">Loading budget data...</div>
              </div>
            ) : budgetOverview ? (
              <>
                {/* Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Total Budget</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(budgetOverview.summary.total_budget)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Total Spent</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(budgetOverview.summary.total_spent)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Remaining</div>
                      <div className={`text-2xl font-bold ${budgetOverview.summary.total_remaining >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {formatCurrency(budgetOverview.summary.total_remaining)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                      <span className={`text-sm font-semibold ${getTextColor(budgetOverview.summary.overall_percentage)}`}>
                        {budgetOverview.summary.overall_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-3 ${getProgressBarBgColor(budgetOverview.summary.overall_percentage)}`}>
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budgetOverview.summary.overall_percentage)}`}
                        style={{ width: `${getProgressBarWidth(budgetOverview.summary.overall_percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  {budgetOverview.categories.map((item) => (
                    <div key={item.category.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: item.category.color }}
                          >
                            <span className="text-lg text-white">{item.category.icon || '📂'}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{item.category.name}</h3>
                            <p className="text-sm text-slate-500">
                              Budget: {formatCurrency(item.budget)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(item.spent)}
                          </div>
                          <div className={`text-sm ${item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.remaining >= 0 ? 'Remaining: ' : 'Over: '}
                            {formatCurrency(Math.abs(item.remaining))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Progress</span>
                          <span className={`text-sm font-semibold ${getTextColor(item.percentage)}`}>
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${getProgressBarBgColor(item.percentage)}`}>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(item.percentage)}`}
                            style={{ width: `${getProgressBarWidth(item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-lg font-medium text-slate-900 mb-2">No budget data available</h3>
                <p className="text-slate-600">Set up budgets for your categories to track spending.</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </RequireHousehold>
  );
}
