import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useApiClient } from '../hooks/useApiClient';
import { LoadingPage } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { AllowNoHousehold } from '../components/HouseholdGuard';
import { useHouseholdGuard } from '../hooks/useHouseholdGuard';
import WelcomeModal from '../components/WelcomeModal';
import { Receipt, formatCurrency, formatDisplayDate } from '@homebudget/types';
import Link from 'next/link';

interface DashboardStats {
  totalHouseholds: number;
  totalReceipts: number;
  totalSpent: number;
  budgetUtilization: number;
}

interface BudgetOverview {
  summary: {
    total_budget: number;
    total_spent: number;
    total_remaining: number;
    overall_percentage: number;
  };
}

export default function HomePage() {
  const { user, loading: authLoading, session } = useAuth();
  const router = useRouter();
  const client = useApiClient();
  const { households, isLoading: householdsLoading } = useHouseholdGuard();
  
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Only load data when auth session is available
    if (!authLoading && session && user && households.length > 0 && !householdsLoading) {
      loadDashboardData();
      
      const isNewUser = !localStorage.getItem('welcomeShown');
      if (isNewUser) {
        setShowWelcome(true);
        localStorage.setItem('welcomeShown', 'true');
      }
    }
  }, [authLoading, session, user, households, householdsLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [receiptsData, budgetData] = await Promise.all([
        client.get<{ receipts: Receipt[] }>('/receipts?limit=5'),
        client.get<BudgetOverview>('/categories/budget-overview').catch(() => null),
      ]);
      
      setRecentReceipts(receiptsData.receipts);
      setBudgetOverview(budgetData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || householdsLoading) {
    return <LoadingPage title="Loading Dashboard" subtitle="Please wait..." />;
  }

  if (!user) {
    return null;
  }

  const stats: DashboardStats = {
    totalHouseholds: households.length,
    totalReceipts: recentReceipts.length,
    totalSpent: recentReceipts.reduce((sum, r) => sum + r.amount, 0),
    budgetUtilization: budgetOverview?.summary.overall_percentage || 0,
  };

  return (
    <AllowNoHousehold>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Welcome back, {user.user_metadata?.full_name || 'User'}!
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Here's an overview of your finances
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Households</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalHouseholds}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🏠</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Recent Receipts</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{recentReceipts.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Spent</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(stats.totalSpent)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Budget Usage</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {stats.budgetUtilization.toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Receipts */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Recent Receipts</h2>
                <Link href="/receipts" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All →
                </Link>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-slate-600">Loading...</div>
              ) : recentReceipts.length > 0 ? (
                <div className="space-y-4">
                  {recentReceipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                      <div className="flex items-center space-x-4">
                        {receipt.category && (
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: receipt.category.color }}
                          >
                            <span className="text-white">{receipt.category.icon || '📂'}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{receipt.title}</p>
                          <p className="text-sm text-slate-500">{formatDisplayDate(receipt.receipt_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(receipt.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600">No receipts yet. Start tracking your expenses!</p>
                  <Link href="/receipts">
                    <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add Receipt
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/receipts" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">📄</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Add Receipt</h3>
                <p className="text-sm text-slate-600">Track a new expense</p>
              </Link>

              <Link href="/budget" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">View Budget</h3>
                <p className="text-sm text-slate-600">Check your spending</p>
              </Link>

              <Link href="/reports" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">View Reports</h3>
                <p className="text-sm text-slate-600">Analyze your finances</p>
              </Link>
            </div>
          </div>
        </div>

        {showWelcome && <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />}
      </Layout>
    </AllowNoHousehold>
  );
}
