import React, { useState, useEffect } from 'react';
import { FormField, Button, Modal } from '@homebudget/ui';
import { Household, Category, CreateReceiptRequest, CreateCategoryRequest } from '@homebudget/types';
import { CategoryForm } from './CategoryForm';

export interface ReceiptFormProps {
  households: Household[];
  categories: Category[];
  isLoadingCategories?: boolean;
  onSubmit: (data: CreateReceiptRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialHouseholdId?: string;
  onHouseholdChange?: (householdId: string) => void;
  onCreateCategory?: (data: CreateCategoryRequest) => Promise<Category>;
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({
  households,
  categories,
  isLoadingCategories = false,
  onSubmit,
  onCancel,
  isLoading = false,
  initialHouseholdId,
  onHouseholdChange,
  onCreateCategory,
}) => {
  const [formData, setFormData] = useState<CreateReceiptRequest>({
    title: '',
    amount: 0,
    receipt_date: new Date().toISOString().split('T')[0],
    notes: '',
    household_id: initialHouseholdId || '',
    category_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(initialHouseholdId || '');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Update selected household when initialHouseholdId changes
  useEffect(() => {
    if (initialHouseholdId) {
      setSelectedHouseholdId(initialHouseholdId);
      setFormData((prev) => ({ ...prev, household_id: initialHouseholdId }));
    }
  }, [initialHouseholdId]);

  // Filter categories by selected household
  const availableCategories = categories.filter(
    (cat) => cat.household_id === selectedHouseholdId && cat.is_active
  );

  // Reset category when household changes
  useEffect(() => {
    if (selectedHouseholdId && formData.category_id) {
      const categoryExists = availableCategories.some((cat) => cat.id === formData.category_id);
      if (!categoryExists) {
        setFormData((prev) => ({ ...prev, category_id: '' }));
      }
    }
  }, [selectedHouseholdId, availableCategories, formData.category_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'household_id') {
      setSelectedHouseholdId(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category_id: '', // Reset category when household changes
      }));
      // Notify parent to load categories for this household
      if (onHouseholdChange && value) {
        onHouseholdChange(value);
      }
    } else if (name === 'amount') {
      const numValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.receipt_date) {
      newErrors.receipt_date = 'Receipt date is required';
    }

    if (!formData.household_id) {
      newErrors.household_id = 'Please select a household';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting receipt:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create receipt',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Household Selector */}
      <FormField
        label="Household"
        name="household_id"
        value={formData.household_id}
        onChange={handleChange}
        isRequired
        isInvalid={!!errors.household_id}
        errorMessage={errors.household_id}
        fieldType="select"
      >
        <option value="">Select a household</option>
        {households.map((household) => (
          <option key={household.id} value={household.id}>
            {household.name}
          </option>
        ))}
      </FormField>

      {/* Category Selector - Only show if household is selected */}
      {selectedHouseholdId && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            {onCreateCategory && (
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                disabled={isLoading || isCreatingCategory}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Category
              </button>
            )}
          </div>
          <FormField
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            isRequired
            isInvalid={!!errors.category_id}
            errorMessage={errors.category_id}
            fieldType="select"
            isDisabled={isLoadingCategories || availableCategories.length === 0}
            helperText={
              isLoadingCategories
                ? 'Loading categories...'
                : availableCategories.length === 0
                ? 'No categories available for this household'
                : undefined
            }
          >
            <option value="">Select a category</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </FormField>
        </div>
      )}

      {/* Title */}
      <FormField
        label="Title"
        name="title"
        type="text"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g., Grocery Shopping at Supermarket"
        isRequired
        isInvalid={!!errors.title}
        errorMessage={errors.title}
      />

      {/* Amount */}
      <FormField
        label="Amount"
        name="amount"
        type="number"
        step="0.01"
        min="0"
        value={formData.amount || ''}
        onChange={handleChange}
        placeholder="0.00"
        isRequired
        isInvalid={!!errors.amount}
        errorMessage={errors.amount}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />

      {/* Receipt Date */}
      <FormField
        label="Receipt Date"
        name="receipt_date"
        type="date"
        value={formData.receipt_date}
        onChange={handleChange}
        isRequired
        isInvalid={!!errors.receipt_date}
        errorMessage={errors.receipt_date}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
      />

      {/* Notes */}
      <FormField
        label="Notes"
        name="notes"
        value={formData.notes || ''}
        onChange={handleChange}
        placeholder="Additional notes or details..."
        fieldType="textarea"
        helperText="Optional: Add any additional information about this receipt"
      />

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryForm && onCreateCategory && selectedHouseholdId && (
        <Modal
          isOpen={showCategoryForm}
          onClose={() => setShowCategoryForm(false)}
          title="Create New Category"
          size="md"
        >
          <CategoryForm
            householdId={selectedHouseholdId}
            onSubmit={async (data) => {
              setIsCreatingCategory(true);
              try {
                const newCategory = await onCreateCategory(data);
                // Auto-select the newly created category
                setFormData((prev) => ({ ...prev, category_id: newCategory.id }));
                setShowCategoryForm(false);
                return newCategory;
              } catch (error) {
                throw error; // Re-throw to let CategoryForm handle it
              } finally {
                setIsCreatingCategory(false);
              }
            }}
            onCancel={() => setShowCategoryForm(false)}
            isLoading={isCreatingCategory}
          />
        </Modal>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 shadow-none"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-blue-500/25"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating...
            </span>
          ) : (
            'Create Receipt'
          )}
        </Button>
      </div>
    </form>
  );
};

