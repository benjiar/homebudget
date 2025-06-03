export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  settings: {
    currency: string;
    defaultCategories: string[];
  };
  members: {
    id: string;
    userId: string;
    role: 'owner' | 'member';
    user: User;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  householdId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  householdId: string;
  userId: string;
  categoryId?: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
  receiptUrl?: string;
  metadata?: {
    tags?: string[];
    location?: string;
    paymentMethod?: string;
  };
  category?: Category;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: Array<{ categoryId: string; category: Category | null; total: number }>;
}

export interface ApiError {
  message: string;
  code?: string;
} 