import { useState, useCallback } from 'react';
import { Transaction, TransactionStats } from '../types';
import { transactionApi } from '../lib/api';
import { useApi } from './useApi';
import { useHousehold } from '../contexts/HouseholdContext';

interface UseTransactionsOptions {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  categoryId?: string;
}

interface CreateTransactionData {
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
}

interface UpdateTransactionData {
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
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { currentHousehold } = useHousehold();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const {
    data: transactions = [],
    error,
    isLoading,
    execute: refreshTransactions,
  } = useApi<Transaction[], []>(
    () => transactionApi.getAll(currentHousehold?.id || '', options),
    {
      successMessage: 'Transactions refreshed successfully',
    }
  );

  const { data: stats, execute: refreshStats } = useApi<TransactionStats, []>(
    () => transactionApi.getStats(currentHousehold?.id || ''),
    {
      successMessage: 'Statistics refreshed successfully',
    }
  );

  const { execute: createTransaction } = useApi<Transaction, [CreateTransactionData]>(
    (data) => transactionApi.create(currentHousehold?.id || '', data),
    {
      successMessage: 'Transaction created successfully',
      onSuccess: () => {
        refreshTransactions();
        refreshStats();
      },
    }
  );

  const { execute: updateTransaction } = useApi<Transaction, [string, UpdateTransactionData]>(
    (id: string, data: UpdateTransactionData) =>
      transactionApi.update(currentHousehold?.id || '', id, data),
    {
      successMessage: 'Transaction updated successfully',
      onSuccess: (updatedTransaction) => {
        refreshTransactions();
        refreshStats();
        if (selectedTransaction?.id === updatedTransaction.id) {
          setSelectedTransaction(null);
        }
      },
    }
  );

  const { execute: deleteTransaction } = useApi<void, [string]>(
    (id: string) => transactionApi.delete(currentHousehold?.id || '', id),
    {
      successMessage: 'Transaction deleted successfully',
      onSuccess: () => {
        refreshTransactions();
        refreshStats();
        setSelectedTransaction(null);
      },
    }
  );

  const selectTransaction = useCallback((transaction: Transaction | null) => {
    setSelectedTransaction(transaction);
  }, []);

  return {
    transactions,
    stats,
    selectedTransaction,
    isLoading,
    error,
    refreshTransactions,
    refreshStats,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    selectTransaction,
  };
} 