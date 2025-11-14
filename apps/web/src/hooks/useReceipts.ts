import { useState, useRef } from 'react';
import { useApiClient } from './useApiClient';
import { Receipt, CreateReceiptRequest, UpdateReceiptRequest } from '@homebudget/types';

interface ReceiptFilters {
    startDate?: string;
    endDate?: string;
    categoryIds?: string[];
    minAmount?: number;
    maxAmount?: number;
    search?: string;
}

interface UseReceiptsResult {
    receipts: Receipt[];
    isLoading: boolean;
    isSubmitting: boolean;
    message: { type: 'success' | 'error'; text: string } | null;
    currentPage: number;
    totalPages: number;
    filters: ReceiptFilters;
    loadReceipts: () => Promise<void>;
    createReceipt: (data: CreateReceiptRequest, photo?: File) => Promise<Receipt>;
    updateReceipt: (id: string, data: UpdateReceiptRequest, photo?: File) => Promise<Receipt>;
    deleteReceipt: (id: string) => Promise<void>;
    setFilters: (filters: ReceiptFilters) => void;
    setCurrentPage: (page: number) => void;
    clearMessage: () => void;
}

// Module-level cache to prevent duplicate API calls
let cachedReceipts: Map<string, { receipts: Receipt[]; totalPages: number }> = new Map();
let fetchPromises: Map<string, Promise<any>> = new Map();

export function useReceipts(): UseReceiptsResult {
    const client = useApiClient();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<ReceiptFilters>({});
    const hasFetchedRef = useRef(false);

    const clearMessage = () => setMessage(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadReceipts = async () => {
        const searchParams = new URLSearchParams({
            page: currentPage.toString(),
            limit: '20',
            ...Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== undefined && value !== ''),
            ),
        });
        const cacheKey = searchParams.toString();

        // Check cache first
        if (cachedReceipts.has(cacheKey) && hasFetchedRef.current) {
            const cached = cachedReceipts.get(cacheKey)!;
            setReceipts(cached.receipts);
            setTotalPages(cached.totalPages);
            setIsLoading(false);
            return;
        }

        // If already fetching this query, reuse the promise
        if (fetchPromises.has(cacheKey)) {
            try {
                const data = await fetchPromises.get(cacheKey)!;
                setReceipts(data.receipts);
                setTotalPages(data.totalPages);
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
            const fetchPromise = client.get<{ receipts: Receipt[]; total: number; page: number; totalPages: number }>(
                `/receipts?${searchParams}`
            );
            fetchPromises.set(cacheKey, fetchPromise);

            const data = await fetchPromise;

            // Update cache
            cachedReceipts.set(cacheKey, { receipts: data.receipts, totalPages: data.totalPages });
            hasFetchedRef.current = true;

            setReceipts(data.receipts);
            setTotalPages(data.totalPages);
        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Failed to load receipts');
        } finally {
            setIsLoading(false);
            fetchPromises.delete(cacheKey);
        }
    };

    const createReceipt = async (data: CreateReceiptRequest, photo?: File): Promise<Receipt> => {
        setIsSubmitting(true);
        try {
            let newReceipt: Receipt;
            if (photo) {
                const formData = new FormData();
                formData.append('photo', photo);
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        formData.append(key, value.toString());
                    }
                });
                newReceipt = await client.upload<Receipt>('/receipts', formData);
            } else {
                newReceipt = await client.post<Receipt>('/receipts', data);
            }

            showMessage('success', 'Receipt created successfully!');
            // Clear cache to force refresh
            cachedReceipts.clear();
            hasFetchedRef.current = false;
            await loadReceipts();
            return newReceipt;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create receipt';
            showMessage('error', errorMessage);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateReceipt = async (id: string, data: UpdateReceiptRequest, photo?: File): Promise<Receipt> => {
        setIsSubmitting(true);
        try {
            let updatedReceipt: Receipt;
            if (photo) {
                // For file uploads with PATCH, we need to construct FormData and use fetch directly
                // With SSR, cookies are automatically sent
                const formData = new FormData();
                formData.append('photo', photo);
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        formData.append(key, value.toString());
                    }
                });

                const householdIds = client['defaultConfig'].householdIds || [];
                const headers: HeadersInit = {};
                if (householdIds.length > 0) headers['x-household-ids'] = householdIds.join(',');

                const response = await fetch(`${client['baseUrl']}/receipts/${id}`, {
                    method: 'PATCH',
                    headers,
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `API Error: ${response.status}`);
                }

                updatedReceipt = await response.json();
            } else {
                updatedReceipt = await client.patch<Receipt>(`/receipts/${id}`, data);
            }

            showMessage('success', 'Receipt updated successfully!');
            // Clear cache to force refresh
            cachedReceipts.clear();
            hasFetchedRef.current = false;
            await loadReceipts();
            return updatedReceipt;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update receipt';
            showMessage('error', errorMessage);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteReceipt = async (id: string): Promise<void> => {
        if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
            return;
        }

        try {
            await client.delete(`/receipts/${id}`);
            showMessage('success', 'Receipt deleted successfully!');
            // Clear cache to force refresh
            cachedReceipts.clear();
            hasFetchedRef.current = false;
            await loadReceipts();
        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Failed to delete receipt');
        }
    };

    return {
        receipts,
        isLoading,
        isSubmitting,
        message,
        currentPage,
        totalPages,
        filters,
        loadReceipts,
        createReceipt,
        updateReceipt,
        deleteReceipt,
        setFilters,
        setCurrentPage,
        clearMessage,
    };
}
