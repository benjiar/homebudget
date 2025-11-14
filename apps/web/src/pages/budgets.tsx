import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useApiClient } from '../hooks/useApiClient';
import { Button, LoadingPage, Modal } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { MessageAlert } from '../components/common/MessageAlert';
import { BudgetForm, BudgetFormData } from '../components/BudgetForm';
import { Budget, BudgetPeriod, BudgetSummary as BudgetSummaryType, BudgetOverviewItem, Category, formatCurrency, formatDisplayDate } from '@homebudget/types';

export default function BudgetsPage() {
    const { user, loading } = useAuth();
    const { isLoading: isLoadingHouseholds, households, selectedHouseholdIds } = useHousehold();
    const client = useApiClient();

    const [budgetSummary, setBudgetSummary] = useState<BudgetSummaryType | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reload data when household selection changes
    useEffect(() => {
        if (user && !loading && !isLoadingHouseholds && households.length > 0) {
            loadData();
        }
    }, [user, loading, isLoadingHouseholds, households.length, selectedHouseholdIds.join(',')]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [summaryData, categoriesData] = await Promise.all([
                client.get<BudgetSummaryType>('/budgets/overview'),
                client.get<Category[]>('/categories'),
            ]);

            setBudgetSummary(summaryData);
            setCategories(categoriesData);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to load budgets',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const loadSuggestions = async () => {
        try {
            const data = await client.get<any[]>('/budgets/suggestions');
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to load suggestions',
            });
        }
    };

    const handleCreateBudget = async (data: BudgetFormData) => {
        setIsSubmitting(true);
        try {
            // Validate household_id is provided
            if (!data.household_id) {
                setMessage({ type: 'error', text: 'Please select a household for this budget' });
                setIsSubmitting(false);
                return;
            }

            // Clean up the data - convert empty strings to undefined
            const cleanData = {
                ...data,
                category_id: data.category_id || undefined,
                description: data.description || undefined,
            };

            console.log('Creating budget with data:', cleanData);

            // Pass the household ID in the API call config so it goes to the correct household
            await client.post('/budgets', cleanData, { householdIds: [data.household_id] });

            setMessage({ type: 'success', text: 'Budget created successfully!' });
            setShowCreateModal(false);
            await loadData();
        } catch (error) {
            console.error('Failed to create budget:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to create budget',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBudget = async (data: BudgetFormData) => {
        if (!editingBudget) return;

        setIsSubmitting(true);
        try {
            // Clean up the data - convert empty strings to undefined
            const cleanData = {
                ...data,
                category_id: data.category_id || undefined,
                description: data.description || undefined,
            };

            console.log('Updating budget with data:', cleanData);

            // Pass the household ID in the API call config
            const householdId = data.household_id || editingBudget.household_id;
            await client.patch(`/budgets/${editingBudget.id}`, cleanData, { householdIds: [householdId] });

            setMessage({ type: 'success', text: 'Budget updated successfully!' });
            setEditingBudget(null);
            await loadData();
        } catch (error) {
            console.error('Failed to update budget:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to update budget',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBudget = async (budgetId: string) => {
        if (!confirm('Are you sure you want to delete this budget?')) {
            return;
        }

        try {
            await client.delete(`/budgets/${budgetId}`);
            setMessage({ type: 'success', text: 'Budget deleted successfully!' });
            await loadData();
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to delete budget',
            });
        }
    };

    const handleApplySuggestion = async (suggestion: any) => {
        const budgetData: BudgetFormData = {
            name: `${suggestion.category.name} Budget`,
            description: `Suggested based on last 3 months average (${formatCurrency(suggestion.historical_spending.average_monthly)}/month)`,
            amount: suggestion.suggestions.monthly,
            period: BudgetPeriod.MONTHLY,
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            category_id: suggestion.category.id,
            is_recurring: true,
        };

        await handleCreateBudget(budgetData);
        setShowSuggestions(false);
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

    const getStatusBadge = (item: BudgetOverviewItem) => {
        if (item.is_over_budget) {
            return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Over Budget</span>;
        }
        if (!item.on_track) {
            return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Off Track</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">On Track</span>;
    };

    if (loading) {
        return <LoadingPage title="Loading Budgets" subtitle="Please wait..." />;
    }

    if (!user) {
        return null;
    }

    return (
        <RequireHousehold>
            <Layout title="Budgets">
                <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Budget Management</h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    Set and track your spending budgets
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={loadSuggestions}
                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                                >
                                    💡 Smart Suggestions
                                </Button>
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    + Create Budget
                                </Button>
                            </div>
                        </div>

                        <MessageAlert message={message} />

                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-slate-600">Loading budgets...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                {budgetSummary && budgetSummary.total_budgets > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                                            <p className="text-sm text-slate-600">Total Budgets</p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">{budgetSummary.total_budgets}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                                            <p className="text-sm text-slate-600">Total Budget Amount</p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                                {formatCurrency(budgetSummary.total_budget_amount)}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                                            <p className="text-sm text-slate-600">Total Spent</p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                                {formatCurrency(budgetSummary.total_spent)}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                                            <p className="text-sm text-slate-600">Overall Progress</p>
                                            <p className={`text-2xl font-bold mt-1 ${budgetSummary.overall_percentage > 100 ? 'text-red-600' : 'text-slate-900'}`}>
                                                {budgetSummary.overall_percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Budgets List */}
                                {budgetSummary && budgetSummary.budgets.length > 0 ? (
                                    (() => {
                                        // Group budgets by household if there are multiple households
                                        const budgetsByHousehold = households.length > 1
                                            ? budgetSummary.budgets.reduce((acc, item) => {
                                                const householdId = item.budget.household_id;
                                                if (!acc[householdId]) {
                                                    acc[householdId] = [];
                                                }
                                                acc[householdId].push(item);
                                                return acc;
                                            }, {} as Record<string, typeof budgetSummary.budgets>)
                                            : null;

                                        // If grouping, render by household sections
                                        if (budgetsByHousehold) {
                                            return (
                                                <div className="space-y-8">
                                                    {Object.entries(budgetsByHousehold).map(([householdId, items]) => {
                                                        const household = households.find(h => h.id === householdId);
                                                        return (
                                                            <div key={householdId} className="space-y-4">
                                                                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                                                    <span className="text-2xl">🏠</span>
                                                                    {household?.name || 'Unknown Household'}
                                                                    <span className="text-sm font-normal text-slate-500">
                                                                        ({items.length} budget{items.length !== 1 ? 's' : ''})
                                                                    </span>
                                                                </h2>
                                                                {items.map((item) => (
                                                                    <div
                                                                        key={item.budget.id}
                                                                        className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow"
                                                                    >
                                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                                    <h3 className="text-lg font-semibold text-slate-900">
                                                                                        {item.budget.category?.icon && (
                                                                                            <span className="mr-2">{item.budget.category.icon}</span>
                                                                                        )}
                                                                                        {item.budget.name}
                                                                                    </h3>
                                                                                    {getStatusBadge(item)}
                                                                                </div>
                                                                                {item.budget.description && (
                                                                                    <p className="text-sm text-slate-600 mt-1">{item.budget.description}</p>
                                                                                )}
                                                                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                                                                                    <span>Period: {item.budget.period}</span>
                                                                                    <span>
                                                                                        {formatDisplayDate(item.budget.start_date)} - {formatDisplayDate(item.budget.end_date)}
                                                                                    </span>
                                                                                    <span>{item.days_remaining} days remaining</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    onClick={() => setEditingBudget(item.budget)}
                                                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 text-sm"
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                                <Button
                                                                                    onClick={() => handleDeleteBudget(item.budget.id)}
                                                                                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 text-sm"
                                                                                >
                                                                                    Delete
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Progress Bar */}
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-slate-700">
                                                                                    Spent: <strong>{formatCurrency(item.current_spending)}</strong> of{' '}
                                                                                    {formatCurrency(item.budget.amount)}
                                                                                </span>
                                                                                <span className={item.is_over_budget ? 'text-red-600 font-bold' : 'text-slate-700'}>
                                                                                    {item.percentage_used.toFixed(1)}%
                                                                                </span>
                                                                            </div>
                                                                            <div className={`w-full rounded-full h-3 ${getProgressBarBgColor(item.percentage_used)}`}>
                                                                                <div
                                                                                    className={`h-3 rounded-full transition-all ${getProgressBarColor(item.percentage_used)}`}
                                                                                    style={{ width: `${Math.min(100, item.percentage_used)}%` }}
                                                                                />
                                                                            </div>
                                                                            <div className="flex justify-between text-xs text-slate-500">
                                                                                <span>Remaining: {formatCurrency(item.remaining)}</span>
                                                                                <span>
                                                                                    Avg/day: {formatCurrency(item.average_daily_spending)} | Projected:{' '}
                                                                                    {formatCurrency(item.projected_spending)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }

                                        // Otherwise, render as a flat list (only one household)
                                        return (
                                            <div className="space-y-4">
                                                {budgetSummary.budgets.map((item) => {
                                                    return (
                                                        <div
                                                            key={item.budget.id}
                                                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <h3 className="text-lg font-semibold text-slate-900">
                                                                            {item.budget.category?.icon && (
                                                                                <span className="mr-2">{item.budget.category.icon}</span>
                                                                            )}
                                                                            {item.budget.name}
                                                                        </h3>
                                                                        {getStatusBadge(item)}
                                                                    </div>
                                                                    {item.budget.description && (
                                                                        <p className="text-sm text-slate-600 mt-1">{item.budget.description}</p>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                                                                        <span>Period: {item.budget.period}</span>
                                                                        <span>
                                                                            {formatDisplayDate(item.budget.start_date)} - {formatDisplayDate(item.budget.end_date)}
                                                                        </span>
                                                                        <span>{item.days_remaining} days remaining</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        onClick={() => setEditingBudget(item.budget)}
                                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 text-sm"
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleDeleteBudget(item.budget.id)}
                                                                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 text-sm"
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-slate-700">
                                                                        Spent: <strong>{formatCurrency(item.current_spending)}</strong> of{' '}
                                                                        {formatCurrency(item.budget.amount)}
                                                                    </span>
                                                                    <span className={item.is_over_budget ? 'text-red-600 font-bold' : 'text-slate-700'}>
                                                                        {item.percentage_used.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div className={`w-full rounded-full h-3 ${getProgressBarBgColor(item.percentage_used)}`}>
                                                                    <div
                                                                        className={`h-3 rounded-full transition-all ${getProgressBarColor(item.percentage_used)}`}
                                                                        style={{ width: `${Math.min(100, item.percentage_used)}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between text-xs text-slate-500">
                                                                    <span>Remaining: {formatCurrency(item.remaining)}</span>
                                                                    <span>
                                                                        Avg/day: {formatCurrency(item.average_daily_spending)} | Projected:{' '}
                                                                        {formatCurrency(item.projected_spending)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
                                        <div className="text-6xl mb-4">💰</div>
                                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Budgets Yet</h3>
                                        <p className="text-slate-600 mb-6">
                                            Create your first budget to start tracking your spending
                                        </p>
                                        <Button
                                            onClick={() => setShowCreateModal(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Create Your First Budget
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Create/Edit Budget Modal */}
                <Modal
                    isOpen={showCreateModal || editingBudget !== null}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingBudget(null);
                    }}
                    title={editingBudget ? 'Edit Budget' : 'Create New Budget'}
                >
                    <BudgetForm
                        initialData={editingBudget || undefined}
                        categories={categories}
                        households={households}
                        onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
                        onCancel={() => {
                            setShowCreateModal(false);
                            setEditingBudget(null);
                        }}
                        isLoading={isSubmitting}
                    />
                </Modal>

                {/* Suggestions Modal */}
                <Modal
                    isOpen={showSuggestions}
                    onClose={() => setShowSuggestions(false)}
                    title="Smart Budget Suggestions"
                >
                    <div className="space-y-4">
                        {suggestions.length > 0 ? (
                            <>
                                <p className="text-sm text-slate-600">
                                    Based on your spending history over the last 3 months, here are suggested budgets:
                                </p>
                                {suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.category.id}
                                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-900">
                                                    {suggestion.category.icon} {suggestion.category.name}
                                                </h4>
                                                <div className="text-sm text-slate-600 mt-1 space-y-1">
                                                    <p>
                                                        Last 3 months average: {formatCurrency(suggestion.historical_spending.average_monthly)}/month
                                                    </p>
                                                    <p className="font-medium text-blue-600">
                                                        Suggested monthly: {formatCurrency(suggestion.suggestions.monthly)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        (10% buffer included for flexibility)
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleApplySuggestion(suggestion)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-600">No suggestions available. Add some receipts first!</p>
                            </div>
                        )}
                    </div>
                </Modal>
            </Layout>
        </RequireHousehold>
    );
}
