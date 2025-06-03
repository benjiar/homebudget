import { supabase } from './supabase';
import { Household, Transaction, Category } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token}`,
  };
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

// Household API
export const householdApi = {
  create: (data: { name: string }): Promise<Household> =>
    fetchApi<Household>('/households', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (): Promise<Household[]> => fetchApi<Household[]>('/households'),

  get: (id: string): Promise<Household> => fetchApi<Household>(`/households/${id}`),

  update: (id: string, data: { name?: string; settings?: any }): Promise<Household> =>
    fetchApi<Household>(`/households/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  inviteMember: (id: string, email: string): Promise<void> =>
    fetchApi<void>(`/households/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  removeMember: (id: string, memberId: string): Promise<void> =>
    fetchApi<void>(`/households/${id}/members/${memberId}`, {
      method: 'DELETE',
    }),

  leave: (id: string): Promise<void> =>
    fetchApi<void>(`/households/${id}/members`, {
      method: 'DELETE',
    }),
};

// Transaction API
export const transactionApi = {
  create: (householdId: string, data: {
    type: 'income' | 'expense';
    amount: number;
    categoryId?: string;
    description?: string;
    date: Date;
    receiptUrl?: string;
    metadata?: {
      tags?: string[];
      location?: string;
      paymentMethod?: string;
    };
  }): Promise<Transaction> =>
    fetchApi<Transaction>(`/households/${householdId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (householdId: string, filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    categoryId?: string;
  }): Promise<Transaction[]> =>
    fetchApi<Transaction[]>(
      `/households/${householdId}/transactions?${new URLSearchParams(
        filters as Record<string, string>
      )}`
    ),

  getStats: (householdId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    byCategory: {
      categoryId: string;
      category: Category;
      total: number;
    }[];
    byMonth: {
      month: string;
      income: number;
      expenses: number;
      balance: number;
    }[];
  }> => fetchApi(`/households/${householdId}/transactions/stats`),

  get: (householdId: string, id: string): Promise<Transaction> =>
    fetchApi<Transaction>(`/households/${householdId}/transactions/${id}`),

  update: (householdId: string, id: string, data: {
    type?: 'income' | 'expense';
    amount?: number;
    categoryId?: string;
    description?: string;
    date?: Date;
    receiptUrl?: string;
    metadata?: {
      tags?: string[];
      location?: string;
      paymentMethod?: string;
    };
  }): Promise<Transaction> =>
    fetchApi<Transaction>(`/households/${householdId}/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (householdId: string, id: string): Promise<void> =>
    fetchApi<void>(`/households/${householdId}/transactions/${id}`, {
      method: 'DELETE',
    }),
};

// Category API
export const categoryApi = {
  create: (householdId: string, data: {
    name: string;
    icon?: string;
    color?: string;
    isDefault?: boolean;
  }): Promise<Category> =>
    fetchApi<Category>(`/households/${householdId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (householdId: string): Promise<Category[]> =>
    fetchApi<Category[]>(`/households/${householdId}/categories`),

  update: (householdId: string, id: string, data: {
    name?: string;
    icon?: string;
    color?: string;
    isDefault?: boolean;
  }): Promise<Category> =>
    fetchApi<Category>(`/households/${householdId}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (householdId: string, id: string): Promise<void> =>
    fetchApi<void>(`/households/${householdId}/categories/${id}`, {
      method: 'DELETE',
    }),
}; 