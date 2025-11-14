import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { Button, LoadingPage } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { MessageAlert } from '../components/common/MessageAlert';
import { useReports } from '../hooks/useReports';
import { formatCurrency } from '@homebudget/types';
import { convertToCSV, downloadCSV, generateReportFilename } from '../utils/csvExport';

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const { isLoading: isLoadingHouseholds, households } = useHousehold();
  const {
    categories,
    receipts,
    monthlyReports,
    isLoading,
    message,
    loadCategories,
    loadReceipts,
    generateMonthlyReports,
  } = useReports();

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const hasLoadedDataRef = useRef(false);

  useEffect(() => {
    // Wait for auth and households to finish loading
    if (!loading && !isLoadingHouseholds && households.length > 0 && user && !hasLoadedDataRef.current) {
      hasLoadedDataRef.current = true;
      loadCategories();
      loadReceipts(dateRange);
    }
  }, [loading, isLoadingHouseholds, households.length, user]);

  useEffect(() => {
    if (receipts.length > 0 && categories.length > 0) {
      generateMonthlyReports(receipts, categories);
    }
  }, [receipts, categories]);

  const handleDateRangeChange = async () => {
    await loadReceipts(dateRange);
  };

  const handleExport = () => {
    if (monthlyReports.length === 0) return;

    const exportData = monthlyReports.flatMap(report =>
      report.categories.map(cat => ({
        month: report.monthName,
        category: cat.category.name,
        amount: cat.amount,
        count: cat.count,
        percentage: cat.percentage.toFixed(2),
      }))
    );

    const csv = convertToCSV(exportData, ['month', 'category', 'amount', 'count', 'percentage']);
    downloadCSV(csv, generateReportFilename('monthly-reports'));
  };

  if (loading) {
    return <LoadingPage title="Loading Reports" subtitle="Please wait..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Reports">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Reports</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Analyze your spending patterns and trends
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={monthlyReports.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm w-full sm:w-auto"
              >
                Export CSV
              </Button>
            </div>

            <MessageAlert message={message} />

            {/* Date Range Filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Date Range</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="block w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="block w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleDateRangeChange}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </div>

            {/* Monthly Reports */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-slate-600">Loading reports...</div>
              </div>
            ) : monthlyReports.length > 0 ? (
              <div className="space-y-6">
                {monthlyReports.map((report) => (
                  <div key={report.month} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-slate-900">{report.monthName}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(report.totalAmount)}
                        </div>
                        <div className="text-sm text-slate-500">
                          {report.receiptCount} receipts • Avg: {formatCurrency(report.averageAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="space-y-3">
                      {report.categories.map((cat) => (
                        <div key={cat.category.id} className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: cat.category.color }}
                          >
                            <span className="text-white text-sm">{cat.category.icon || '📂'}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-slate-900">{cat.category.name}</span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(cat.amount)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${cat.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-12 text-right">
                                {cat.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No reports available</h3>
                <p className="text-slate-600 max-w-sm mx-auto">
                  Add some receipts to see spending reports and insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </RequireHousehold>
  );
}
