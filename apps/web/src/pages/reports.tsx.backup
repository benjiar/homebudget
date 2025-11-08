import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, LoadingPage, LoadingSkeleton } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { householdsCache } from '@/lib/householdsCache';
import { 
  Receipt, 
  Household, 
  Category,
  formatCurrency,
  formatDisplayDate 
} from '@homebudget/types';

interface MonthlyReport {
  month: string; // YYYY-MM format
  year: number;
  monthName: string;
  totalAmount: number;
  receiptCount: number;
  averageAmount: number;
  categories: Array<{
    category: Category;
    amount: number;
    count: number;
    percentage: number;
  }>;
  previousMonth?: {
    totalAmount: number;
    changeAmount: number;
    changePercentage: number;
  };
}

interface ReportFilters {
  startMonth: string; // YYYY-MM format
  endMonth: string;
  categoryIds?: string[];
  memberIds?: string[];
  dateRangeType: 'monthly' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
}

interface SpendingPattern {
  pattern: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  description: string;
  confidence: number; // 0-100
  recommendation?: string;
}

interface CategoryPerformance {
  category: Category;
  currentMonth: number;
  previousMonth: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  averageMonthly: number;
  budgetUtilization?: number; // If budget is set
}

interface ExportOptions {
  format: 'csv';
  includeReceiptDetails: boolean;
  includeMonthlyBreakdown: boolean;
  includeCategoryAnalysis: boolean;
  includeSpendingPatterns: boolean;
  customDateRange?: {
    start: string;
    end: string;
  };
}

// CSV Export Utilities
const convertToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Handle values that contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
};

const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default function ReportsPage() {
  const { user, getAccessToken, loading } = useAuth();
  const router = useRouter();
  const { household: householdId } = router.query;
  
  const [households, setHouseholds] = useState<Household[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<any[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedReport, setSelectedReport] = useState<'monthly' | 'yearly' | 'comparison'>('monthly');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeReceiptDetails: true,
    includeMonthlyBreakdown: true,
    includeCategoryAnalysis: true,
    includeSpendingPatterns: true
  });
  
  // Default to last 12 months
  const currentDate = new Date();
  const defaultEndMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const defaultStartMonth = `${currentDate.getFullYear() - 1}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [filters, setFilters] = useState<ReportFilters>({
    startMonth: defaultStartMonth,
    endMonth: defaultEndMonth,
    categoryIds: [],
    memberIds: [],
    dateRangeType: 'monthly',
    customStartDate: undefined,
    customEndDate: undefined
  });

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

  // Load data when household changes
  useEffect(() => {
    if (selectedHousehold) {
      loadCategories();
      loadHouseholdMembers();
      loadReceipts();
    }
  }, [selectedHousehold, filters]);

  const loadHouseholds = async () => {
    try {
      if (user) {
        const accessToken = getAccessToken();
        if (accessToken) {
          const cachedHouseholds = await householdsCache.get(user.id, accessToken);
          setHouseholds(cachedHouseholds);
          
          // If no household selected and we have households, select the first one
          if (!selectedHousehold && cachedHouseholds.length > 0) {
            setSelectedHousehold(cachedHouseholds[0].id);
          }
        }
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load households' 
      });
    }
  };

  const loadCategories = async () => {
    if (!selectedHousehold) return;

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/categories/household/${selectedHousehold}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load categories' 
      });
    }
  };

  const loadHouseholdMembers = async () => {
    if (!selectedHousehold) return;

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/households/${selectedHousehold}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load household members');
      }

      const data = await response.json();
      setHouseholdMembers(data.members || []);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load household members' 
      });
    }
  };

  const loadReceipts = async () => {
    if (!selectedHousehold) return;

    setIsLoadingReports(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Calculate date range based on filter type
      let startDate: Date, endDate: Date;
      
      if (filters.dateRangeType === 'custom' && filters.customStartDate && filters.customEndDate) {
        startDate = new Date(filters.customStartDate);
        endDate = new Date(filters.customEndDate);
      } else {
        // Use monthly range
        startDate = new Date(filters.startMonth + '-01');
        endDate = new Date(filters.endMonth + '-01');
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
      }

      const searchParams = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: '1000' // Get all receipts in range
      });

      if (filters.categoryIds && filters.categoryIds.length > 0) {
        searchParams.append('categoryIds', filters.categoryIds.join(','));
      }

      // Note: Member filtering would need backend support
      // For now, we'll filter on the frontend
      const response = await fetch(`/api/receipts/household/${selectedHousehold}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load receipts');
      }

      const data = await response.json();
      const filteredReceipts = data.receipts || [];
      
      // Frontend member filtering (if member IDs were available in receipts)
      if (filters.memberIds && filters.memberIds.length > 0) {
        // This would work if receipts had a created_by or member_id field
        // filteredReceipts = filteredReceipts.filter(receipt => 
        //   filters.memberIds.includes(receipt.created_by)
        // );
      }
      
      setReceipts(filteredReceipts);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load receipts' 
      });
    } finally {
      setIsLoadingReports(false);
      setIsLoading(false);
    }
  };

  // Calculate monthly reports from receipts data
  const monthlyReports = useMemo((): MonthlyReport[] => {
    if (!receipts.length || !categories.length) return [];

    const reportMap = new Map<string, MonthlyReport>();
    
    // Initialize months in range
    const startDate = new Date(filters.startMonth + '-01');
    const endDate = new Date(filters.endMonth + '-01');
    
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      reportMap.set(monthKey, {
        month: monthKey,
        year: d.getFullYear(),
        monthName,
        totalAmount: 0,
        receiptCount: 0,
        averageAmount: 0,
        categories: []
      });
    }

    // Process receipts
    receipts.forEach(receipt => {
      const receiptDate = new Date(receipt.receipt_date);
      const monthKey = `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (reportMap.has(monthKey)) {
        const report = reportMap.get(monthKey)!;
        report.totalAmount += receipt.amount;
        report.receiptCount += 1;
        
        // Find or create category entry
        let categoryEntry = report.categories.find(c => c.category.id === receipt.category_id);
        if (!categoryEntry) {
          const category = categories.find(c => c.id === receipt.category_id);
          if (category) {
            categoryEntry = {
              category,
              amount: 0,
              count: 0,
              percentage: 0
            };
            report.categories.push(categoryEntry);
          }
        }
        
        if (categoryEntry) {
          categoryEntry.amount += receipt.amount;
          categoryEntry.count += 1;
        }
      }
    });

    // Calculate percentages and averages, add month-over-month comparisons
    const reports = Array.from(reportMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    
    reports.forEach((report, index) => {
      report.averageAmount = report.receiptCount > 0 ? report.totalAmount / report.receiptCount : 0;
      
      // Calculate category percentages
      report.categories.forEach(categoryEntry => {
        categoryEntry.percentage = report.totalAmount > 0 
          ? (categoryEntry.amount / report.totalAmount) * 100 
          : 0;
      });
      
      // Sort categories by amount
      report.categories.sort((a, b) => b.amount - a.amount);
      
      // Add previous month comparison
      if (index > 0) {
        const previousMonth = reports[index - 1];
        const changeAmount = report.totalAmount - previousMonth.totalAmount;
        const changePercentage = previousMonth.totalAmount > 0 
          ? (changeAmount / previousMonth.totalAmount) * 100 
          : 0;
        
        report.previousMonth = {
          totalAmount: previousMonth.totalAmount,
          changeAmount,
          changePercentage
        };
      }
    });

    return reports;
  }, [receipts, categories, filters.startMonth, filters.endMonth]);

  // Calculate overall summary statistics
  const overallSummary = useMemo(() => {
    const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const totalReceipts = receipts.length;
    const averagePerReceipt = totalReceipts > 0 ? totalAmount / totalReceipts : 0;
    const averagePerMonth = monthlyReports.length > 0 ? totalAmount / monthlyReports.length : 0;
    
    // Top categories across all months
    const categoryTotals = new Map<string, { category: Category; amount: number; count: number }>();
    
    receipts.forEach(receipt => {
      const category = categories.find(c => c.id === receipt.category_id);
      if (category) {
        const key = category.id;
        if (!categoryTotals.has(key)) {
          categoryTotals.set(key, { category, amount: 0, count: 0 });
        }
        const entry = categoryTotals.get(key)!;
        entry.amount += receipt.amount;
        entry.count += 1;
      }
    });
    
    const topCategories = Array.from(categoryTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(entry => ({
        ...entry,
        percentage: totalAmount > 0 ? (entry.amount / totalAmount) * 100 : 0
      }));
    
    return {
      totalAmount,
      totalReceipts,
      averagePerReceipt,
      averagePerMonth,
      topCategories,
      monthsCount: monthlyReports.length
    };
  }, [receipts, categories, monthlyReports]);

  // Advanced analytics: Spending pattern analysis
  const spendingPattern = useMemo((): SpendingPattern => {
    if (monthlyReports.length < 3) {
      return {
        pattern: 'stable',
        description: 'Not enough data for pattern analysis',
        confidence: 0
      };
    }

    const amounts = monthlyReports.map(r => r.totalAmount);
    const changes = [];
    
    for (let i = 1; i < amounts.length; i++) {
      const change = amounts[i] - amounts[i - 1];
      const changePercent = amounts[i - 1] > 0 ? (change / amounts[i - 1]) * 100 : 0;
      changes.push(changePercent);
    }

    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const volatility = Math.sqrt(changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length);

    let pattern: SpendingPattern['pattern'];
    let description: string;
    let recommendation: string | undefined;
    let confidence: number;

    if (volatility > 20) {
      pattern = 'volatile';
      description = 'Your spending varies significantly month to month';
      recommendation = 'Consider creating a more consistent budget to reduce spending volatility';
      confidence = Math.min(95, 60 + volatility);
    } else if (avgChange > 5) {
      pattern = 'increasing';
      description = `Your spending is trending upward by ${avgChange.toFixed(1)}% per month on average`;
      recommendation = 'Review your budget and identify areas where you can reduce expenses';
      confidence = Math.min(95, 70 + Math.abs(avgChange));
    } else if (avgChange < -5) {
      pattern = 'decreasing';
      description = `Your spending is trending downward by ${Math.abs(avgChange).toFixed(1)}% per month on average`;
      recommendation = 'Great job reducing expenses! Consider allocating savings to emergency fund or investments';
      confidence = Math.min(95, 70 + Math.abs(avgChange));
    } else {
      pattern = 'stable';
      description = 'Your spending is relatively consistent month to month';
      recommendation = 'Your spending pattern is healthy. Focus on optimizing category allocations';
      confidence = Math.min(95, 80 - volatility);
    }

    return {
      pattern,
      description,
      confidence: Math.round(confidence),
      recommendation
    };
  }, [monthlyReports]);

  // Advanced analytics: Category performance analysis
  const categoryPerformance = useMemo((): CategoryPerformance[] => {
    if (monthlyReports.length < 2) return [];

    const currentMonth = monthlyReports[monthlyReports.length - 1];
    const previousMonth = monthlyReports[monthlyReports.length - 2];

    const performance: CategoryPerformance[] = [];

    categories.forEach(category => {
      const currentAmount = currentMonth.categories.find(c => c.category.id === category.id)?.amount || 0;
      const previousAmount = previousMonth.categories.find(c => c.category.id === category.id)?.amount || 0;
      
      const changeAmount = currentAmount - previousAmount;
      const changePercentage = previousAmount > 0 ? (changeAmount / previousAmount) * 100 : 0;
      
      let trend: CategoryPerformance['trend'];
      if (Math.abs(changePercentage) < 5) {
        trend = 'stable';
      } else if (changePercentage > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }

      // Calculate average monthly spending for this category
      const categoryAmounts = monthlyReports.map(report => 
        report.categories.find(c => c.category.id === category.id)?.amount || 0
      );
      const averageMonthly = categoryAmounts.reduce((sum, amount) => sum + amount, 0) / categoryAmounts.length;

      if (currentAmount > 0 || previousAmount > 0 || averageMonthly > 0) {
        performance.push({
          category,
          currentMonth: currentAmount,
          previousMonth: previousAmount,
          trend,
          changePercentage,
          averageMonthly
        });
      }
    });

    return performance.sort((a, b) => b.currentMonth - a.currentMonth);
  }, [monthlyReports, categories]);

  // Export functions
  const generateReceiptsCSV = (): string => {
    const headers = [
      'Date', 'Title', 'Amount', 'Category', 'Notes', 'Household', 
      'Receipt_ID', 'Category_ID', 'Created_Date'
    ];
    
    const data = receipts.map(receipt => ({
      'Date': new Date(receipt.receipt_date).toLocaleDateString(),
      'Title': receipt.title || '',
      'Amount': receipt.amount,
      'Category': receipt.category?.name || 'Uncategorized',
      'Notes': receipt.notes || '',
      'Household': receipt.household?.name || '',
      'Receipt_ID': receipt.id,
      'Category_ID': receipt.category_id,
      'Created_Date': receipt.created_at ? new Date(receipt.created_at).toLocaleDateString() : ''
    }));
    
    return convertToCSV(data, headers);
  };

  const generateMonthlyReportsCSV = (): string => {
    const headers = [
      'Month', 'Year', 'Total_Amount', 'Receipt_Count', 'Average_Amount',
      'Change_From_Previous', 'Change_Percentage', 'Top_Category', 'Top_Category_Amount'
    ];
    
    const data = monthlyReports.map(report => ({
      'Month': report.monthName,
      'Year': report.year,
      'Total_Amount': report.totalAmount,
      'Receipt_Count': report.receiptCount,
      'Average_Amount': report.averageAmount.toFixed(2),
      'Change_From_Previous': report.previousMonth?.changeAmount?.toFixed(2) || 'N/A',
      'Change_Percentage': report.previousMonth?.changePercentage?.toFixed(2) || 'N/A',
      'Top_Category': report.categories[0]?.category.name || 'N/A',
      'Top_Category_Amount': report.categories[0]?.amount?.toFixed(2) || 'N/A'
    }));
    
    return convertToCSV(data, headers);
  };

  const generateCategoryAnalysisCSV = (): string => {
    const headers = [
      'Category', 'Total_Amount', 'Receipt_Count', 'Percentage_of_Total',
      'Average_Monthly', 'Current_Month_Trend', 'Change_Percentage'
    ];
    
    const categoryData = overallSummary.topCategories.map(cat => {
      const perf = categoryPerformance.find(p => p.category.id === cat.category.id);
      return {
        'Category': cat.category.name,
        'Total_Amount': cat.amount,
        'Receipt_Count': cat.count,
        'Percentage_of_Total': cat.percentage.toFixed(2),
        'Average_Monthly': perf?.averageMonthly.toFixed(2) || 'N/A',
        'Current_Month_Trend': perf?.trend || 'N/A',
        'Change_Percentage': perf?.changePercentage.toFixed(2) || 'N/A'
      };
    });
    
    return convertToCSV(categoryData, headers);
  };

  const generateSpendingPatternsCSV = (): string => {
    const headers = [
      'Analysis_Type', 'Pattern', 'Description', 'Confidence_Percentage', 'Recommendation'
    ];
    
    const data = [{
      'Analysis_Type': 'Spending Pattern Analysis',
      'Pattern': spendingPattern.pattern,
      'Description': spendingPattern.description,
      'Confidence_Percentage': spendingPattern.confidence,
      'Recommendation': spendingPattern.recommendation || 'N/A'
    }];
    
    return convertToCSV(data, headers);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const householdName = households.find(h => h.id === selectedHousehold)?.name || 'household';
      const baseFilename = `${householdName.replace(/[^a-zA-Z0-9]/g, '_')}_report_${timestamp}`;

      let csvContent = '';
      let filename = '';

      if (exportOptions.includeReceiptDetails && exportOptions.includeMonthlyBreakdown && 
          exportOptions.includeCategoryAnalysis && exportOptions.includeSpendingPatterns) {
        // Combined export
        csvContent = `# Complete Expense Report - ${householdName}\n# Generated on ${new Date().toLocaleString()}\n\n`;
        
        if (exportOptions.includeReceiptDetails) {
          csvContent += `# Receipt Details\n${generateReceiptsCSV()}\n\n`;
        }
        
        if (exportOptions.includeMonthlyBreakdown) {
          csvContent += `# Monthly Summary\n${generateMonthlyReportsCSV()}\n\n`;
        }
        
        if (exportOptions.includeCategoryAnalysis) {
          csvContent += `# Category Analysis\n${generateCategoryAnalysisCSV()}\n\n`;
        }
        
        if (exportOptions.includeSpendingPatterns) {
          csvContent += `# Spending Patterns\n${generateSpendingPatternsCSV()}\n\n`;
        }
        
        filename = `${baseFilename}_complete.csv`;
      } else {
        // Individual exports
        if (exportOptions.includeReceiptDetails) {
          csvContent = generateReceiptsCSV();
          filename = `${baseFilename}_receipts.csv`;
        } else if (exportOptions.includeMonthlyBreakdown) {
          csvContent = generateMonthlyReportsCSV();
          filename = `${baseFilename}_monthly.csv`;
        } else if (exportOptions.includeCategoryAnalysis) {
          csvContent = generateCategoryAnalysisCSV();
          filename = `${baseFilename}_categories.csv`;
        } else if (exportOptions.includeSpendingPatterns) {
          csvContent = generateSpendingPatternsCSV();
          filename = `${baseFilename}_patterns.csv`;
        }
      }

      if (csvContent && filename) {
        downloadCSV(csvContent, filename);
        setMessage({ 
          type: 'success', 
          text: `Report exported successfully as ${filename}` 
        });
        setShowExportModal(false);
      } else {
        throw new Error('No data selected for export');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export data' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <LoadingPage 
        title="Loading Reports" 
        subtitle="Please wait while we load your expense reports..." 
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Expense Reports">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Expense Reports & Analytics
                  </h1>
                  <p className="text-slate-600 text-lg">
                    Comprehensive analysis of your household spending patterns and trends
                  </p>
                </div>
                
                {selectedHousehold && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setShowExportModal(true)}
                      className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300"
                    >
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Data
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Household Selection */}
            {households.length > 0 && (
              <div className="mb-8">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">
                  <label htmlFor="household-select" className="block text-sm font-semibold text-slate-700 mb-3">
                    Select Household
                  </label>
                  <select
                    id="household-select"
                    value={selectedHousehold}
                    onChange={(e) => setSelectedHousehold(e.target.value)}
                    className="w-full sm:w-auto px-4 py-3 bg-white/90 backdrop-blur-sm border border-slate-300 rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300"
                  >
                    <option value="">Select a household...</option>
                    {households.map((household) => (
                      <option key={household.id} value={household.id}>
                        {household.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {message && (
              <div className={`mb-8 p-4 backdrop-blur-sm rounded-2xl border shadow-sm ${
                message.type === 'error' 
                  ? 'bg-red-50/80 text-red-800 border-red-200/50' 
                  : 'bg-green-50/80 text-green-800 border-green-200/50'
              }`}>
                <div className="flex items-center">
                  <svg className={`w-5 h-5 mr-3 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {selectedHousehold && (
              <>
                {/* Report Type Selection & Filters */}
                <div className="mb-8">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Report Type Tabs */}
                      <div className="flex space-x-1 bg-slate-100/80 rounded-xl p-1">
                        <button
                          onClick={() => setSelectedReport('monthly')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            selectedReport === 'monthly'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Monthly Reports
                        </button>
                        <button
                          onClick={() => setSelectedReport('yearly')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            selectedReport === 'yearly'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Yearly Overview
                        </button>
                        <button
                          onClick={() => setSelectedReport('comparison')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            selectedReport === 'comparison'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Trend Analysis
                        </button>
                      </div>

                      {/* Date Range Filters */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Date Range Type</label>
                          <select
                            value={filters.dateRangeType}
                            onChange={(e) => setFilters({...filters, dateRangeType: e.target.value as 'monthly' | 'custom'})}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90"
                          >
                            <option value="monthly">Monthly Range</option>
                            <option value="custom">Custom Date Range</option>
                          </select>
                        </div>
                        
                        {filters.dateRangeType === 'monthly' ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">From Month</label>
                              <input
                                type="month"
                                value={filters.startMonth}
                                onChange={(e) => setFilters({...filters, startMonth: e.target.value})}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">To Month</label>
                              <input
                                type="month"
                                value={filters.endMonth}
                                onChange={(e) => setFilters({...filters, endMonth: e.target.value})}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                              <input
                                type="date"
                                value={filters.customStartDate || ''}
                                onChange={(e) => setFilters({...filters, customStartDate: e.target.value})}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                              <input
                                type="date"
                                value={filters.customEndDate || ''}
                                onChange={(e) => setFilters({...filters, customEndDate: e.target.value})}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="mt-6 pt-6 border-t border-slate-200/50">
                      <h4 className="text-sm font-medium text-slate-700 mb-4">Advanced Filters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Filter */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">Filter by Categories</label>
                          <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-lg p-2 bg-white/90">
                            {categories.map((category) => (
                              <label key={category.id} className="flex items-center space-x-2 py-1 hover:bg-slate-50 rounded px-2">
                                <input
                                  type="checkbox"
                                  checked={filters.categoryIds?.includes(category.id) || false}
                                  onChange={(e) => {
                                    const currentIds = filters.categoryIds || [];
                                    if (e.target.checked) {
                                      setFilters({...filters, categoryIds: [...currentIds, category.id]});
                                    } else {
                                      setFilters({...filters, categoryIds: currentIds.filter(id => id !== category.id)});
                                    }
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">{category.icon}</span>
                                <span className="text-sm text-slate-700">{category.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Member Filter */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">Filter by Members</label>
                          <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-lg p-2 bg-white/90">
                            {householdMembers.length > 0 ? (
                              householdMembers.map((member) => (
                                <label key={member.id} className="flex items-center space-x-2 py-1 hover:bg-slate-50 rounded px-2">
                                  <input
                                    type="checkbox"
                                    checked={filters.memberIds?.includes(member.id) || false}
                                    onChange={(e) => {
                                      const currentIds = filters.memberIds || [];
                                      if (e.target.checked) {
                                        setFilters({...filters, memberIds: [...currentIds, member.id]});
                                      } else {
                                        setFilters({...filters, memberIds: currentIds.filter(id => id !== member.id)});
                                      }
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-semibold text-white">
                                      {member.user?.user_metadata?.full_name?.[0] || member.user?.email?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-sm text-slate-700">
                                    {member.user?.user_metadata?.full_name || member.user?.email?.split('@')[0] || 'Unknown'}
                                  </span>
                                </label>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500 p-2">No members found</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingReports ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <LoadingSkeleton key={i} width="w-full" height="h-32" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Overall Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 backdrop-blur-xl rounded-2xl border border-white/30 p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Total Spent</p>
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(overallSummary.totalAmount)}</p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl font-bold text-white">₪</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 backdrop-blur-xl rounded-2xl border border-white/30 p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Total Receipts</p>
                            <p className="text-2xl font-bold text-slate-900">{overallSummary.totalReceipts}</p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 backdrop-blur-xl rounded-2xl border border-white/30 p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Avg per Month</p>
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(overallSummary.averagePerMonth)}</p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500/10 to-red-600/10 backdrop-blur-xl rounded-2xl border border-white/30 p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Avg per Receipt</p>
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(overallSummary.averagePerReceipt)}</p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Report Content */}
                    {selectedReport === 'monthly' && (
                      <div className="space-y-6">
                        {monthlyReports.map((report) => (
                          <div key={report.month} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                              {/* Month Header */}
                              <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">{report.monthName}</h3>
                                <div className="flex items-center space-x-4">
                                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(report.totalAmount)}</span>
                                  <span className="text-slate-600">{report.receiptCount} receipts</span>
                                  {report.previousMonth && (
                                    <div className="flex items-center">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        report.previousMonth.changePercentage >= 0
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {report.previousMonth.changePercentage >= 0 ? '↑' : '↓'}
                                        {Math.abs(report.previousMonth.changePercentage).toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Category Breakdown */}
                              <div className="flex-1 max-w-lg">
                                <h4 className="text-sm font-medium text-slate-700 mb-3">Top Categories</h4>
                                <div className="space-y-2">
                                  {report.categories.slice(0, 3).map((categoryEntry) => (
                                    <div key={categoryEntry.category.id} className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm">{categoryEntry.category.icon}</span>
                                        <span className="text-sm font-medium text-slate-700">{categoryEntry.category.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-slate-900">{formatCurrency(categoryEntry.amount)}</span>
                                        <span className="text-xs text-slate-500">({categoryEntry.percentage.toFixed(1)}%)</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Top Categories Overall */}
                    <div className="mt-8">
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Top Categories Overall</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {overallSummary.topCategories.map((categoryData, index) => (
                            <div key={categoryData.category.id} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/50">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{categoryData.category.name}</p>
                                  <p className="text-sm text-slate-600">{categoryData.count} receipts</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900">{formatCurrency(categoryData.amount)}</p>
                                <p className="text-sm text-slate-600">{categoryData.percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Advanced Analytics */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Spending Pattern Analysis */}
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Spending Pattern Analysis</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Pattern Type</span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              spendingPattern.pattern === 'increasing' ? 'bg-red-100 text-red-800' :
                              spendingPattern.pattern === 'decreasing' ? 'bg-green-100 text-green-800' :
                              spendingPattern.pattern === 'volatile' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {spendingPattern.pattern.charAt(0).toUpperCase() + spendingPattern.pattern.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Confidence</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${spendingPattern.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-slate-900">{spendingPattern.confidence}%</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200/50">
                            <p className="text-sm text-slate-700 mb-3">{spendingPattern.description}</p>
                            {spendingPattern.recommendation && (
                              <div className="bg-blue-50/80 border border-blue-200/50 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-sm text-blue-800">{spendingPattern.recommendation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Category Performance Analysis */}
                      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Category Performance</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {categoryPerformance.slice(0, 8).map((perf) => (
                            <div key={perf.category.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{perf.category.icon}</span>
                                <div>
                                  <p className="font-medium text-slate-900 text-sm">{perf.category.name}</p>
                                  <p className="text-xs text-slate-600">Avg: {formatCurrency(perf.averageMonthly)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-slate-900 text-sm">{formatCurrency(perf.currentMonth)}</p>
                                <div className="flex items-center space-x-1">
                                  <span className={`inline-flex items-center text-xs ${
                                    perf.trend === 'up' ? 'text-red-600' :
                                    perf.trend === 'down' ? 'text-green-600' :
                                    'text-slate-600'
                                  }`}>
                                    {perf.trend === 'up' ? '↗' : perf.trend === 'down' ? '↘' : '→'}
                                    {Math.abs(perf.changePercentage).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-green-900 bg-clip-text text-transparent">
                    Export Report Data
                  </h2>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Export Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Export Format
                    </label>
                    <div className="bg-slate-50/80 rounded-xl p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">CSV (Comma Separated Values)</div>
                          <div className="text-sm text-slate-600">Compatible with Excel, Google Sheets, and other spreadsheet applications</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Select Data to Export
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start space-x-3 p-4 bg-slate-50/80 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeReceiptDetails}
                          onChange={(e) => setExportOptions({...exportOptions, includeReceiptDetails: e.target.checked})}
                          className="mt-1 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Receipt Details</div>
                          <div className="text-sm text-slate-600">Individual receipt data including dates, amounts, categories, and notes</div>
                          <div className="text-xs text-slate-500 mt-1">{receipts.length} receipts in current filter</div>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 p-4 bg-slate-50/80 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeMonthlyBreakdown}
                          onChange={(e) => setExportOptions({...exportOptions, includeMonthlyBreakdown: e.target.checked})}
                          className="mt-1 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Monthly Summary</div>
                          <div className="text-sm text-slate-600">Monthly totals, averages, and month-over-month comparisons</div>
                          <div className="text-xs text-slate-500 mt-1">{monthlyReports.length} months of data</div>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 p-4 bg-slate-50/80 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeCategoryAnalysis}
                          onChange={(e) => setExportOptions({...exportOptions, includeCategoryAnalysis: e.target.checked})}
                          className="mt-1 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Category Analysis</div>
                          <div className="text-sm text-slate-600">Spending breakdown by category with trends and performance metrics</div>
                          <div className="text-xs text-slate-500 mt-1">{overallSummary.topCategories.length} categories analyzed</div>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 p-4 bg-slate-50/80 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeSpendingPatterns}
                          onChange={(e) => setExportOptions({...exportOptions, includeSpendingPatterns: e.target.checked})}
                          className="mt-1 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Spending Pattern Analysis</div>
                          <div className="text-sm text-slate-600">AI-powered insights and recommendations based on spending patterns</div>
                          <div className="text-xs text-slate-500 mt-1">Pattern: {spendingPattern.pattern} ({spendingPattern.confidence}% confidence)</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Export Summary */}
                  <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-blue-900 mb-1">Export Summary</div>
                        <div className="text-sm text-blue-800 space-y-1">
                          <div>• Date Range: {filters.dateRangeType === 'custom' && filters.customStartDate && filters.customEndDate ? 
                            `${new Date(filters.customStartDate).toLocaleDateString()} - ${new Date(filters.customEndDate).toLocaleDateString()}` :
                            `${new Date(filters.startMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${new Date(filters.endMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                          }</div>
                          <div>• Household: {households.find(h => h.id === selectedHousehold)?.name}</div>
                          <div>• Total Data Points: {receipts.length} receipts across {monthlyReports.length} months</div>
                          {filters.categoryIds && filters.categoryIds.length > 0 && (
                            <div>• Filtered Categories: {filters.categoryIds.map(id => categories.find(c => c.id === id)?.name).join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handleExportData}
                      disabled={isExporting || (!exportOptions.includeReceiptDetails && !exportOptions.includeMonthlyBreakdown && !exportOptions.includeCategoryAnalysis && !exportOptions.includeSpendingPatterns)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exporting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export to CSV
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowExportModal(false)}
                      disabled={isExporting}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 shadow-none h-12"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </RequireHousehold>
  );
} 