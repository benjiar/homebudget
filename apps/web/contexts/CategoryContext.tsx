import { createContext, useContext, ReactNode } from 'react';
import { Category } from '../types';
import { useCategories } from '../hooks/useCategories';

interface CategoryContextType {
  categories: Category[];
  selectedCategory: Category | null;
  isLoading: boolean;
  error: Error | null;
  refreshCategories: () => Promise<Category[]>;
  createCategory: (data: {
    name: string;
    icon?: string;
    color?: string;
    isDefault?: boolean;
  }) => Promise<Category>;
  updateCategory: (
    id: string,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      isDefault?: boolean;
    }
  ) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  selectCategory: (category: Category | null) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const categoryState = useCategories();

  return (
    <CategoryContext.Provider value={categoryState}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
} 