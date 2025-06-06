import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, LoadingPage, LoadingCard, LoadingSkeleton } from '@homebudget/ui';
import { Layout } from '../components/Layout';
import { RequireHousehold } from '../components/HouseholdGuard';
import { householdsCache } from '@/lib/householdsCache';
import { 
  Receipt, 
  Household, 
  Category,
  CreateReceiptRequest,
  UpdateReceiptRequest,
  CreateCategoryRequest,
  formatCurrency
} from '@homebudget/types';

interface ReceiptFilters {
  startDate?: string;
  endDate?: string;
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: ReceiptFilters;
  createdAt: string;
}

interface CreateReceiptFormData {
  title: string;
  amount: string;
  receipt_date: string;
  notes: string;
  category_id: string;
  household_id: string;
  photo?: File;
}

interface CreateCategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  monthly_budget: string;
}

const DEFAULT_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', 
  '#FFEB3B', '#E91E63', '#607D8B', '#9E9E9E', '#795548'
];

const DEFAULT_ICONS = [
  'utensils', 'zap', 'home', 'car', 'heart', 'baby', 'play', 
  'shopping-bag', 'more-horizontal', 'dollar-sign', 'book', 'music'
];

export default function ReceiptsPage() {
  const { user, getAccessToken, loading } = useAuth();
  const router = useRouter();
  const { household: householdId } = router.query;
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filters, setFilters] = useState<ReceiptFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Create receipt form state
  const [receiptForm, setReceiptForm] = useState<CreateReceiptFormData>({
    title: '',
    amount: '',
    receipt_date: new Date().toISOString().split('T')[0],
    notes: '',
    category_id: '',
    household_id: '',
  });

  // Create category form state
  const [categoryForm, setCategoryForm] = useState<CreateCategoryFormData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS[0],
    monthly_budget: '',
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
      setReceiptForm(prev => ({ ...prev, household_id: householdId }));
    }
  }, [householdId]);

  // Load receipts when household changes
  useEffect(() => {
    if (selectedHousehold) {
      loadReceipts();
      loadCategories();
    }
  }, [selectedHousehold, filters, currentPage]);

  const loadHouseholds = async () => {
    setIsLoadingHouseholds(true);
    try {
      // Use the new households cache system
      if (user) {
        const accessToken = getAccessToken();
        if (accessToken) {
          const cachedHouseholds = await householdsCache.get(user.id, accessToken);
          setHouseholds(cachedHouseholds);
          console.log(`⚡ RECEIPTS: Using ${cachedHouseholds.length} households from cache`);
          
          // If no household selected and we have households, select the first one
          if (!selectedHousehold && cachedHouseholds.length > 0) {
            setSelectedHousehold(cachedHouseholds[0].id);
            setReceiptForm(prev => ({ ...prev, household_id: cachedHouseholds[0].id }));
          }
        } else {
          console.warn('⚠️ RECEIPTS: No access token available');
          setHouseholds([]);
        }
      } else {
        console.log('⚠️ RECEIPTS: No user available');
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

  const loadReceipts = async () => {
    if (!selectedHousehold) return;

    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/receipts/household/${selectedHousehold}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to load receipts');
      }

      const data = await response.json();
      setReceipts(data.receipts || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load receipts' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedHousehold) return;

    setIsLoadingCategories(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/categories/household/${selectedHousehold}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to load categories');
      }

      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load categories' 
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptForm.title || !receiptForm.amount || !receiptForm.category_id || !receiptForm.household_id) return;

    setIsSubmitting(true);
    try {
      const receiptData: CreateReceiptRequest = {
        title: receiptForm.title,
        amount: parseFloat(receiptForm.amount),
        receipt_date: new Date(receiptForm.receipt_date).toISOString(),
        notes: receiptForm.notes || undefined,
        household_id: receiptForm.household_id,
        category_id: receiptForm.category_id,
      };

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to create receipt');
      }

      const newReceipt = await response.json();

      // Upload photo if provided
      if (receiptForm.photo) {
        try {
          await handlePhotoUpload(newReceipt.id, receiptForm.photo);
        } catch (photoError) {
          console.error('Failed to upload photo:', photoError);
          setMessage({ 
            type: 'error', 
            text: 'Receipt created but photo upload failed. You can add the photo later.' 
          });
        }
      } else {
        setMessage({ type: 'success', text: 'Receipt created successfully!' });
      }

      setReceiptForm({
        title: '',
        amount: '',
        receipt_date: new Date().toISOString().split('T')[0],
        notes: '',
        category_id: '',
        household_id: selectedHousehold,
        photo: undefined,
      });
      setShowAddForm(false);
      loadReceipts();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create receipt' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt || !receiptForm.title || !receiptForm.amount || !receiptForm.category_id) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateReceiptRequest = {
        title: receiptForm.title,
        amount: parseFloat(receiptForm.amount),
        receipt_date: new Date(receiptForm.receipt_date).toISOString(),
        notes: receiptForm.notes || undefined,
        category_id: receiptForm.category_id,
      };

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/receipts/${editingReceipt.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to update receipt');
      }

      setMessage({ type: 'success', text: 'Receipt updated successfully!' });
      setEditingReceipt(null);
      setReceiptForm({
        title: '',
        amount: '',
        receipt_date: new Date().toISOString().split('T')[0],
        notes: '',
        category_id: '',
        household_id: selectedHousehold,
      });
      loadReceipts();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update receipt' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return;

    setIsSubmitting(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }

      setMessage({ type: 'success', text: 'Receipt deleted successfully!' });
      loadReceipts();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete receipt' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (receiptId: string, file: File) => {
    setUploadingPhoto(receiptId);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/receipts/${receiptId}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to upload photo');
      }

      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      loadReceipts();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload photo' 
      });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handlePhotoDelete = async (receiptId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/receipts/${receiptId}/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to delete photo');
      }

      setMessage({ type: 'success', text: 'Photo deleted successfully!' });
      loadReceipts();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete photo' 
      });
    }
  };

  const startEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setReceiptForm({
      title: receipt.title,
      amount: receipt.amount.toString(),
      receipt_date: new Date(receipt.receipt_date).toISOString().split('T')[0],
      notes: receipt.notes || '',
      category_id: receipt.category_id,
      household_id: receipt.household_id,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingReceipt(null);
    setReceiptForm({
      title: '',
      amount: '',
      receipt_date: new Date().toISOString().split('T')[0],
      notes: '',
      category_id: '',
      household_id: selectedHousehold,
    });
    setShowAddForm(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !selectedHousehold) return;

    setIsSubmitting(true);
    try {
      const categoryData: CreateCategoryRequest = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        color: categoryForm.color,
        icon: categoryForm.icon,
        monthly_budget: categoryForm.monthly_budget ? parseFloat(categoryForm.monthly_budget) : undefined,
        household_id: selectedHousehold,
      };

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to create category');
      }

      const newCategory = await response.json();
      setMessage({ type: 'success', text: 'Category created successfully!' });
      setShowCategoryForm(false);
      resetCategoryForm();
      
      // Reload categories and auto-select the new category
      await loadCategories();
      setReceiptForm(prev => ({ ...prev, category_id: newCategory.id }));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create category' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0],
      monthly_budget: '',
    });
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

  const applyFilters = () => {
    setCurrentPage(1);
    loadReceipts();
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Filter preset management
  const loadFilterPresets = () => {
    try {
      const saved = localStorage.getItem(`receipt-filter-presets-${user?.id}`);
      if (saved) {
        setFilterPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }
  };

  const saveFilterPresets = (presets: FilterPreset[]) => {
    try {
      localStorage.setItem(`receipt-filter-presets-${user?.id}`, JSON.stringify(presets));
      setFilterPresets(presets);
    } catch (error) {
      console.error('Failed to save filter presets:', error);
    }
  };

  const saveCurrentFiltersAsPreset = () => {
    if (!presetName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a preset name' });
      return;
    }

    const hasActiveFilters = Object.values(filters).some(value => 
      value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
    );

    if (!hasActiveFilters) {
      setMessage({ type: 'error', text: 'Please set some filters before saving as preset' });
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updatedPresets = [...filterPresets, newPreset];
    saveFilterPresets(updatedPresets);
    setPresetName('');
    setShowPresetForm(false);
    setMessage({ type: 'success', text: `Filter preset "${newPreset.name}" saved successfully` });
  };

  const applyFilterPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    setCurrentPage(1);
    setMessage({ type: 'success', text: `Applied filter preset "${preset.name}"` });
  };

  const deleteFilterPreset = (presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (preset && confirm(`Delete filter preset "${preset.name}"?`)) {
      const updatedPresets = filterPresets.filter(p => p.id !== presetId);
      saveFilterPresets(updatedPresets);
      setMessage({ type: 'success', text: `Filter preset "${preset.name}" deleted` });
    }
  };

  // Load presets when component mounts
  useEffect(() => {
    if (user) {
      loadFilterPresets();
    }
  }, [user]);

  if (loading) {
    return (
      <LoadingPage 
        title="Loading Receipts" 
        subtitle="Please wait while we load your receipts..." 
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RequireHousehold>
      <Layout title="Receipts">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Receipt Management
                  </h1>
                  <p className="text-slate-600 text-lg">
                    Organize and track all your family&apos;s expenses with intelligent receipt management
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                  >
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Receipt
                    </span>
                  </Button>
                  {receipts.length > 0 && (
                    <Button
                      onClick={() => setShowExportModal(true)}
                      className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300"
                    >
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Household Selection */}
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        id="amount"
                        step="0.01"
                        value={receiptForm.amount}
                        onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="receipt_date" className="block text-sm font-medium text-slate-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        id="receipt_date"
                        value={receiptForm.receipt_date}
                        onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-2">
                        Category *
                      </label>
                      {isLoadingCategories ? (
                        <LoadingSkeleton width="w-full" height="h-[46px]" />
                      ) : (
                        <div className="space-y-2">
                          <select
                            id="category_id"
                            value={receiptForm.category_id}
                            onChange={(e) => setReceiptForm({ ...receiptForm, category_id: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                            disabled={isSubmitting}
                            required
                          >
                            <option value="">Select a category...</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowCategoryForm(true)}
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Create New Category</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        value={receiptForm.notes}
                        onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label htmlFor="photo" className="block text-sm font-medium text-slate-700 mb-2">
                        Receipt Photo (Optional)
                      </label>
                      <div className="space-y-3">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-600">
                              {receiptForm.photo ? receiptForm.photo.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-slate-500">PNG, JPG, WebP up to 5MB</p>
                          </div>
                          <input
                            id="photo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isSubmitting}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file size (5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  setMessage({ type: 'error', text: 'File size must be less than 5MB' });
                                  return;
                                }
                                // Validate file type
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                if (!allowedTypes.includes(file.type)) {
                                  setMessage({ type: 'error', text: 'Only JPEG, PNG, and WebP files are allowed' });
                                  return;
                                }
                                setReceiptForm({ ...receiptForm, photo: file });
                              }
                            }}
                          />
                        </label>
                        {receiptForm.photo && (
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-green-800">{receiptForm.photo.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReceiptForm({ ...receiptForm, photo: undefined })}
                              disabled={isSubmitting}
                              className="text-green-600 hover:text-green-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !receiptForm.title || !receiptForm.amount || !receiptForm.category_id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
                      >
                        {isSubmitting ? 'Saving...' : 'Add Receipt'}
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

          {/* Edit Receipt Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                      Edit Receipt
                    </h2>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateReceipt} className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={receiptForm.title}
                        onChange={(e) => setReceiptForm({ ...receiptForm, title: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        id="amount"
                        step="0.01"
                        value={receiptForm.amount}
                        onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="receipt_date" className="block text-sm font-medium text-slate-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        id="receipt_date"
                        value={receiptForm.receipt_date}
                        onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-2">
                        Category *
                      </label>
                      {isLoadingCategories ? (
                        <LoadingSkeleton width="w-full" height="h-[46px]" />
                      ) : (
                        <div className="space-y-2">
                          <select
                            id="category_id"
                            value={receiptForm.category_id}
                            onChange={(e) => setReceiptForm({ ...receiptForm, category_id: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                            disabled={isSubmitting}
                            required
                          >
                            <option value="">Select a category...</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowCategoryForm(true)}
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Create New Category</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        value={receiptForm.notes}
                        onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label htmlFor="photo" className="block text-sm font-medium text-slate-700 mb-2">
                        Receipt Photo (Optional)
                      </label>
                      <div className="space-y-3">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-600">
                              {receiptForm.photo ? receiptForm.photo.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-slate-500">PNG, JPG, WebP up to 5MB</p>
                          </div>
                          <input
                            id="photo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isSubmitting}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file size (5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  setMessage({ type: 'error', text: 'File size must be less than 5MB' });
                                  return;
                                }
                                // Validate file type
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                if (!allowedTypes.includes(file.type)) {
                                  setMessage({ type: 'error', text: 'Only JPEG, PNG, and WebP files are allowed' });
                                  return;
                                }
                                setReceiptForm({ ...receiptForm, photo: file });
                              }
                            }}
                          />
                        </label>
                        {receiptForm.photo && (
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-green-800">{receiptForm.photo.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReceiptForm({ ...receiptForm, photo: undefined })}
                              disabled={isSubmitting}
                              className="text-green-600 hover:text-green-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !receiptForm.title || !receiptForm.amount || !receiptForm.category_id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Receipt'}
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

          {/* Create Category Modal */}
          {showCategoryForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/60 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">
                    Create New Category
                  </h3>
                  
                  <form onSubmit={handleCreateCategory} className="space-y-6">
                    <div>
                      <label htmlFor="category_name" className="block text-sm font-medium text-slate-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="category_name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category_description" className="block text-sm font-medium text-slate-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="category_description"
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
                        <label htmlFor="category_icon" className="block text-sm font-medium text-slate-700 mb-2">
                          Icon
                        </label>
                        <select
                          id="category_icon"
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
                      <label htmlFor="category_budget" className="block text-sm font-medium text-slate-700 mb-2">
                        Monthly Budget (Optional)
                      </label>
                      <input
                        type="number"
                        id="category_budget"
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
                        {isSubmitting ? 'Creating...' : 'Create Category'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          resetCategoryForm();
                        }}
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

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-green-900 bg-clip-text text-transparent">
                    Export Receipts
                  </h2>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Export Summary */}
                  <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-blue-900 mb-1">Export Summary</div>
                        <div className="text-sm text-blue-800 space-y-1">
                          <div>• Total Receipts: {receipts.length}</div>
                          <div>• Total Amount: {formatCurrency(receipts.reduce((sum, receipt) => sum + receipt.amount, 0))}</div>
                          <div>• Household: {households.find(h => h.id === selectedHousehold)?.name}</div>
                          {Object.values(filters).some(value => value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) && (
                            <div>• Current filters applied</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Format Info */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Export Format
                    </label>
                    <div className="bg-slate-50/80 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">CSV (Comma Separated Values)</div>
                          <div className="text-sm text-slate-600">
                            Includes: Date, Title, Amount, Category, Notes, Household, Receipt ID, and Photo status
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fields Included */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Fields Included in Export
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Date', 'Title', 'Amount', 'Category', 'Notes', 'Household', 'Receipt ID', 'Has Photo'].map((field) => (
                        <div key={field} className="flex items-center space-x-2 p-2 bg-slate-50/80 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-slate-700">{field}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handleExportReceipts}
                      disabled={isExporting || receipts.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exporting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export {receipts.length} Receipts to CSV
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowExportModal(false)}
                      disabled={isExporting}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 shadow-none h-12"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </RequireHousehold>
  );
} 