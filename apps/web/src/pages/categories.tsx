import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, LoadingPage, LoadingCard, LoadingSkeleton } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { getCachedHouseholdsSync, hasCachedHouseholds } from '@/hooks/useHouseholdGuard';
import { 
  Category, 
  Household, 
  CreateCategoryRequest,
  UpdateCategoryRequest,
  formatCurrency
} from '@homebudget/types';

interface CreateCategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  monthly_budget: string;
  household_id: string;
}

const DEFAULT_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', 
  '#FFEB3B', '#E91E63', '#607D8B', '#9E9E9E', '#795548'
];

const DEFAULT_ICONS = [
  'utensils', 'zap', 'home', 'car', 'heart', 'baby', 'play', 
  'shopping-bag', 'more-horizontal', 'dollar-sign', 'book', 'music'
];

export default function CategoriesPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const { household: householdId } = router.query;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create category form state
  const [categoryForm, setCategoryForm] = useState<CreateCategoryFormData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS[0],
    monthly_budget: '',
    household_id: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadHouseholds();
    }
  }, [user]);

  // Set default household from URL param
  useEffect(() => {
    if (householdId && typeof householdId === 'string') {
      setSelectedHousehold(householdId);
      setCategoryForm(prev => ({ ...prev, household_id: householdId }));
    }
  }, [householdId]);

  // Load categories when household changes
  useEffect(() => {
    if (selectedHousehold) {
      loadCategories();
    }
  }, [selectedHousehold]);

  const loadHouseholds = async () => {
    setIsLoadingHouseholds(true);
    try {
      // Use cached households instead of API call
      if (user && hasCachedHouseholds(user.id)) {
        const cachedHouseholds = getCachedHouseholdsSync(user.id);
        setHouseholds(cachedHouseholds);
        console.log(`⚡ CATEGORIES: Using ${cachedHouseholds.length} cached households`);
        
        // If no household selected and we have households, select the first one
        if (!selectedHousehold && cachedHouseholds.length > 0) {
          setSelectedHousehold(cachedHouseholds[0].id);
          setCategoryForm(prev => ({ ...prev, household_id: cachedHouseholds[0].id }));
        }
      } else {
        console.log('⚠️ CATEGORIES: No cached households, will wait for guard to fetch');
        setHouseholds([]);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load households' 
      });
    } finally {
      setIsLoadingHouseholds(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedHousehold) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories/household/${selectedHousehold}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load categories' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.household_id) return;

    setIsSubmitting(true);
    try {
      const categoryData: CreateCategoryRequest = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        color: categoryForm.color,
        icon: categoryForm.icon,
        monthly_budget: categoryForm.monthly_budget ? parseFloat(categoryForm.monthly_budget) : undefined,
        household_id: categoryForm.household_id,
      };

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }

      setMessage({ type: 'success', text: 'Category created successfully!' });
      setCategoryForm({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
        icon: DEFAULT_ICONS[0],
        monthly_budget: '',
        household_id: selectedHousehold,
      });
      setShowAddForm(false);
      loadCategories();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create category' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !categoryForm.name) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateCategoryRequest = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        color: categoryForm.color,
        icon: categoryForm.icon,
        monthly_budget: categoryForm.monthly_budget ? parseFloat(categoryForm.monthly_budget) : undefined,
      };

      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }

      setMessage({ type: 'success', text: 'Category updated successfully!' });
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
        icon: DEFAULT_ICONS[0],
        monthly_budget: '',
        household_id: selectedHousehold,
      });
      setShowAddForm(false);
      loadCategories();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update category' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      setMessage({ type: 'success', text: 'Category deleted successfully!' });
      loadCategories();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete category' 
      });
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || DEFAULT_COLORS[0],
      icon: category.icon || DEFAULT_ICONS[0],
      monthly_budget: category.monthly_budget ? category.monthly_budget.toString() : '',
      household_id: category.household_id,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0],
      monthly_budget: '',
      household_id: selectedHousehold,
    });
    setShowAddForm(false);
  };

  const getCategoryIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'utensils': '🍽️',
      'zap': '⚡',
      'home': '🏠',
      'car': '🚗',
      'heart': '❤️',
      'baby': '👶',
      'play': '🎮',
      'shopping-bag': '🛍️',
      'more-horizontal': '⚫',
      'dollar-sign': '💰',
      'book': '📚',
      'music': '🎵'
    };
    return iconMap[iconName] || '📂';
  };

  if (loading) {
    return (
      <LoadingPage 
        title="Loading Categories" 
        subtitle="Please wait while we load your categories..." 
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Categories">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Categories</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Organize your expenses and set budgets for better tracking
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                disabled={!selectedHousehold || isLoadingHouseholds}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
              >
                Add Category
              </Button>
            </div>

            {/* Household Selector */}
            {isLoadingHouseholds ? (
              <div className="mb-6">
                <LoadingSkeleton width="w-32" height="h-4" className="mb-2" />
                <LoadingSkeleton width="w-48" height="h-10" />
              </div>
            ) : households.length > 1 ? (
              <div className="mb-6">
                <label htmlFor="household" className="block text-sm font-medium text-slate-700 mb-2">
                  Select Household
                </label>
                <select
                  id="household"
                  value={selectedHousehold}
                  onChange={(e) => setSelectedHousehold(e.target.value)}
                  className="block w-full max-w-xs px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a household...</option>
                  {households.map((household) => (
                    <option key={household.id} value={household.id}>
                      {household.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl border ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 text-sm">{message.text}</div>
                </div>
              </div>
            )}

            {selectedHousehold ? (
              <>
                {/* Categories Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <LoadingCard key={i} lines={4} showAvatar />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                      <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-200">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-medium shadow-sm"
                                style={{ backgroundColor: category.color }}
                              >
                                <span className="text-lg">
                                  {getCategoryIcon(category.icon || 'more-horizontal')}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 truncate">{category.name}</h3>
                                {category.is_system && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    System
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {category.description && (
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{category.description}</p>
                          )}

                          {category.monthly_budget && (
                            <div className="mb-4">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Monthly Budget:</span>
                                <span className="font-medium text-emerald-600">
                                  {formatCurrency(category.monthly_budget)}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                            <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              category.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              onClick={() => startEditCategory(category)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
                            >
                              Edit
                            </Button>
                            {!category.is_system && (
                              <Button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-600 hover:bg-red-700 text-white h-10 px-4"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && categories.length === 0 && (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No categories found</h3>
                    <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                      Default categories should have been created automatically. Try refreshing the page.
                    </p>
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Add Category
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No household selected</h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                  Please select a household to view and manage categories.
                </p>
                <Button
                  onClick={() => router.push('/households')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Manage Households
                </Button>
              </div>
            )}

            {/* Add/Edit Category Modal */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/60 max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-6">
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    
                    <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                          disabled={editingCategory?.is_system || isSubmitting}
                          required
                        />
                        {editingCategory?.is_system && (
                          <p className="mt-1 text-xs text-slate-500">System categories cannot be renamed</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Color
                          </label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {DEFAULT_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setCategoryForm({ ...categoryForm, color })}
                                disabled={isSubmitting}
                                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                  categoryForm.color === color ? 'border-slate-900 scale-110' : 'border-slate-300 hover:border-slate-400'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="icon" className="block text-sm font-medium text-slate-700 mb-2">
                            Icon
                          </label>
                          <select
                            id="icon"
                            value={categoryForm.icon}
                            onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                          >
                            {DEFAULT_ICONS.map((icon) => (
                              <option key={icon} value={icon}>
                                {getCategoryIcon(icon)} {icon}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="monthly_budget" className="block text-sm font-medium text-slate-700 mb-2">
                          Monthly Budget (Optional)
                        </label>
                        <input
                          type="number"
                          id="monthly_budget"
                          step="0.01"
                          value={categoryForm.monthly_budget}
                          onChange={(e) => setCategoryForm({ ...categoryForm, monthly_budget: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting || !categoryForm.name}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
                        >
                          {isSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                        </Button>
                        <Button
                          type="button"
                          onClick={resetForm}
                          disabled={isSubmitting}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 shadow-none h-12"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </RequireHousehold>
  );
} 