import { useState, useRef } from 'react';
import { useApiClient } from './useApiClient';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@homebudget/types';

interface UseCategoriesResult {
    categories: Category[];
    isLoading: boolean;
    isSubmitting: boolean;
    message: { type: 'success' | 'error'; text: string } | null;
    loadCategories: (force?: boolean) => Promise<void>;
    createCategory: (data: CreateCategoryRequest) => Promise<Category>;
    updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<Category>;
    deleteCategory: (id: string) => Promise<void>;
    clearMessage: () => void;
}

// Module-level cache to prevent duplicate API calls
let cachedCategories: Category[] | null = null;
let fetchPromise: Promise<Category[]> | null = null;

export function useCategories(): UseCategoriesResult {
    const client = useApiClient();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const hasFetchedRef = useRef(false);

    const clearMessage = () => setMessage(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadCategories = async (force = false) => {
        // Return cached data if available and not forcing refresh
        if (cachedCategories && !force && hasFetchedRef.current) {
            setCategories(cachedCategories);
            setIsLoading(false);
            return;
        }

        // If already fetching, reuse the existing promise
        if (fetchPromise) {
            try {
                const data = await fetchPromise;
                setCategories(data);
                setIsLoading(false);
                return;
            } catch (error) {
                showMessage('error', error instanceof Error ? error.message : 'Failed to load categories');
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(true);
        try {
            // Create a shared promise for concurrent calls
            fetchPromise = client.get<Category[]>('/categories');
            const data = await fetchPromise;

            // Update cache
            cachedCategories = data;
            hasFetchedRef.current = true;

            setCategories(data);
        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Failed to load categories');
        } finally {
            setIsLoading(false);
            fetchPromise = null; // Clear promise after completion
        }
    };

    const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
        setIsSubmitting(true);
        try {
            const newCategory = await client.post<Category>('/categories', data);
            showMessage('success', 'Category created successfully!');
            await loadCategories(true); // Force refresh after create
            return newCategory;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
            showMessage('error', errorMessage);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateCategory = async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
        setIsSubmitting(true);
        try {
            const updatedCategory = await client.patch<Category>(`/categories/${id}`, data);
            showMessage('success', 'Category updated successfully!');
            await loadCategories(true); // Force refresh after update
            return updatedCategory;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
            showMessage('error', errorMessage);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteCategory = async (id: string): Promise<void> => {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }

        try {
            await client.delete(`/categories/${id}`);
            showMessage('success', 'Category deleted successfully!');
            await loadCategories(true); // Force refresh after delete
        } catch (error) {
            showMessage('error', error instanceof Error ? error.message : 'Failed to delete category');
        }
    };

    return {
        categories,
        isLoading,
        isSubmitting,
        message,
        loadCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        clearMessage,
    };
}
