import { useState } from 'react';
import { Category } from '../types';
import { categoryApi } from '../lib/api';
import { useApi } from './useApi';
import { useHousehold } from '../contexts/HouseholdContext';

interface CreateCategoryData {
  name: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export function useCategories() {
  const { currentHousehold } = useHousehold();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const {
    data: categories = [],
    error,
    isLoading,
    execute: refreshCategories,
  } = useApi<Category[], []>(
    () => categoryApi.getAll(currentHousehold?.id || ''),
    {
      successMessage: 'Categories refreshed successfully',
    }
  );

  const { execute: createCategory } = useApi<Category, [CreateCategoryData]>(
    (data) => categoryApi.create(currentHousehold?.id || '', data),
    {
      successMessage: 'Category created successfully',
      onSuccess: () => {
        refreshCategories();
      },
    }
  );

  const { execute: updateCategory } = useApi<Category, [string, UpdateCategoryData]>(
    (id: string, data: UpdateCategoryData) =>
      categoryApi.update(currentHousehold?.id || '', id, data),
    {
      successMessage: 'Category updated successfully',
      onSuccess: (updatedCategory) => {
        refreshCategories();
        if (selectedCategory?.id === updatedCategory.id) {
          setSelectedCategory(null);
        }
      },
    }
  );

  const { execute: deleteCategory } = useApi<void, [string]>(
    (id: string) => categoryApi.delete(currentHousehold?.id || '', id),
    {
      successMessage: 'Category deleted successfully',
      onSuccess: () => {
        refreshCategories();
        setSelectedCategory(null);
      },
    }
  );

  const selectCategory = (category: Category | null) => {
    setSelectedCategory(category);
  };

  return {
    categories: categories || [],
    selectedCategory,
    isLoading,
    error,
    refreshCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    selectCategory,
  };
} 