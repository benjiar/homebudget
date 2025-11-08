import { useState } from 'react';
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

export function useReceipts(): UseReceiptsResult {
    const client = useApiClient();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<ReceiptFilters>({});

    const clearMessage = () => setMessage(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadReceipts = async () => {
        setIsLoading(true);
        try {
            const searchParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== ''),
                ),
            });

            const data = await client.get<{ receipts: Receipt[]; total: number; page: number; totalPages: number }>(
                `/receipts?${searchParams}`
            );

            setReceipts(data.receipts);
            setTotalPages(data.totalPages);
        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Failed to load receipts');
        } finally {
            setIsLoading(false);
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
                    if (value !== undefined && value !== null) {
                        formData.append(key, value.toString());
                    }
                });
                newReceipt = await client.upload<Receipt>('/receipts', formData);
            } else {
                newReceipt = await client.post<Receipt>('/receipts', data);
            }

            showMessage('success', 'Receipt created successfully!');
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
                const formData = new FormData();
                formData.append('photo', photo);
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        formData.append(key, value.toString());
                    }
                });

                const token = client['defaultConfig'].token;
                const householdIds = client['defaultConfig'].householdIds || [];
                const headers: HeadersInit = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
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
