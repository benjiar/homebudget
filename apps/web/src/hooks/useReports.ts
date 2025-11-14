import { useState } from 'react';
import { useApiClient } from './useApiClient';
import { Category, Receipt } from '@homebudget/types';

interface MonthlyReport {
    month: string;
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
}

interface UseReportsResult {
    categories: Category[];
    receipts: Receipt[];
    monthlyReports: MonthlyReport[];
    isLoading: boolean;
    message: { type: 'success' | 'error'; text: string } | null;
    loadCategories: () => Promise<void>;
    loadReceipts: (params?: { startDate?: string; endDate?: string }) => Promise<void>;
    generateMonthlyReports: (receipts: Receipt[], categories: Category[]) => MonthlyReport[];
    clearMessage: () => void;
}

// Module-level cache for reports data
let cachedReportsData: Map<string, { receipts: Receipt[]; categories: Category[] }> = new Map();
let fetchPromises: Map<string, Promise<any>> = new Map();

export function useReports(): UseReportsResult {
    const client = useApiClient();
    const [categories, setCategories] = useState<Category[]>([]);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const clearMessage = () => setMessage(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadCategories = async () => {
        const cacheKey = 'categories';

        // Check cache first
        const cachedData = cachedReportsData.get(cacheKey);
        if (cachedData?.categories) {
            setCategories(cachedData.categories);
            return;
        }

        // If already fetching, reuse the promise
        if (fetchPromises.has(cacheKey)) {
            try {
                const data = await fetchPromises.get(cacheKey)!;
                setCategories(data);
                return;
            } catch (error) {
                showMessage('error', error instanceof Error ? error.message : 'Failed to load categories');
                return;
            }
        }

        try {
            const fetchPromise = client.get<Category[]>('/categories');
            fetchPromises.set(cacheKey, fetchPromise);

            const data = await fetchPromise;
            setCategories(data);

            // Update cache
            const existing = cachedReportsData.get(cacheKey) || { receipts: [], categories: [] };
            cachedReportsData.set(cacheKey, { ...existing, categories: data });
        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Failed to load categories');
        } finally {
            fetchPromises.delete(cacheKey);
        }
    };

    const loadReceipts = async (params?: { startDate?: string; endDate?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.startDate) searchParams.append('startDate', params.startDate);
        if (params?.endDate) searchParams.append('endDate', params.endDate);
        const cacheKey = `receipts-${searchParams.toString()}`;

        // Check cache first
        const cachedData = cachedReportsData.get(cacheKey);
        if (cachedData?.receipts) {
            setReceipts(cachedData.receipts);
            setIsLoading(false);
            return;
        }

        // If already fetching, reuse the promise
        if (fetchPromises.has(cacheKey)) {
            try {
                const data = await fetchPromises.get(cacheKey)!;
                setReceipts(data.receipts);
                setIsLoading(false);
                return;
            } catch (error) {
                showMessage('error', error instanceof Error ? error.message : 'Failed to load receipts');
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(true);
        try {
            const fetchPromise = client.get<{ receipts: Receipt[] }>(
                `/receipts${searchParams.toString() ? '?' + searchParams.toString() : ''}`
            );
            fetchPromises.set(cacheKey, fetchPromise);

            const data = await fetchPromise;
            setReceipts(data.receipts);

            // Update cache
            cachedReportsData.set(cacheKey, { receipts: data.receipts, categories: [] });
        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Failed to load receipts');
        } finally {
            setIsLoading(false);
            fetchPromises.delete(cacheKey);
        }
    };

    const generateMonthlyReports = (receipts: Receipt[], categories: Category[]): MonthlyReport[] => {
        const monthlyData = new Map<string, { receipts: Receipt[]; categories: Map<string, Receipt[]> }>();

        receipts.forEach(receipt => {
            const date = new Date(receipt.receipt_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, { receipts: [], categories: new Map() });
            }

            const monthData = monthlyData.get(monthKey)!;
            monthData.receipts.push(receipt);

            const categoryId = receipt.category_id;
            if (!monthData.categories.has(categoryId)) {
                monthData.categories.set(categoryId, []);
            }
            monthData.categories.get(categoryId)!.push(receipt);
        });

        const reports: MonthlyReport[] = [];
        const sortedMonths = Array.from(monthlyData.keys()).sort();

        sortedMonths.forEach(monthKey => {
            const monthData = monthlyData.get(monthKey)!;
            const [year, month] = monthKey.split('-').map(Number);
            const totalAmount = monthData.receipts.reduce((sum, r) => sum + r.amount, 0);
            const receiptCount = monthData.receipts.length;

            const categoriesData = Array.from(monthData.categories.entries()).map(([categoryId, receipts]) => {
                const category = categories.find(c => c.id === categoryId);
                const amount = receipts.reduce((sum, r) => sum + r.amount, 0);

                return {
                    category: category || { id: categoryId, name: 'Unknown', color: '#888' } as Category,
                    amount,
                    count: receipts.length,
                    percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
                };
            }).sort((a, b) => b.amount - a.amount);

            reports.push({
                month: monthKey,
                year,
                monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
                totalAmount,
                receiptCount,
                averageAmount: receiptCount > 0 ? totalAmount / receiptCount : 0,
                categories: categoriesData,
            });
        });

        setMonthlyReports(reports);
        return reports;
    };

    return {
        categories,
        receipts,
        monthlyReports,
        isLoading,
        message,
        loadCategories,
        loadReceipts,
        generateMonthlyReports,
        clearMessage,
    };
}
