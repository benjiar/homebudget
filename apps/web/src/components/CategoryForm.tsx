import React, { useState, useEffect } from 'react';
import { FormField, Button } from '@homebudget/ui';
import { CreateCategoryRequest, UpdateCategoryRequest, Category } from '@homebudget/types';

export interface CategoryFormProps {
  householdId: string;
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<Category>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Category; // For edit mode
  isEditMode?: boolean;
}

const DEFAULT_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', 
  '#FFEB3B', '#E91E63', '#607D8B', '#9E9E9E', '#795548'
];

const DEFAULT_ICONS = [
  'utensils', 'zap', 'home', 'car', 'heart', 'baby', 'play', 
  'shopping-bag', 'more-horizontal', 'dollar-sign', 'book', 'music'
];

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

export const CategoryForm: React.FC<CategoryFormProps> = ({
  householdId,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    color: initialData?.color || DEFAULT_COLORS[0],
    icon: initialData?.icon || DEFAULT_ICONS[0],
    monthly_budget: initialData?.monthly_budget?.toString() || '',
  });

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        color: initialData.color || DEFAULT_COLORS[0],
        icon: initialData.icon || DEFAULT_ICONS[0],
        monthly_budget: initialData.monthly_budget?.toString() || '',
      });
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
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
      if (isEditMode) {
        const updateData: UpdateCategoryRequest = {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          icon: formData.icon,
          monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : undefined,
        };
        await onSubmit(updateData);
      } else {
        const categoryData: CreateCategoryRequest = {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          icon: formData.icon,
          monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : undefined,
          household_id: householdId,
        };
        await onSubmit(categoryData);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error);
      setErrors({
        submit: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} category`,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <FormField
        label="Category Name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., Groceries, Utilities, Entertainment"
        isRequired
        isInvalid={!!errors.name}
        errorMessage={errors.name}
        isDisabled={isEditMode && initialData?.is_system}
        helperText={isEditMode && initialData?.is_system ? 'System categories cannot be renamed' : undefined}
      />

      {/* Description */}
      <FormField
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Optional description for this category"
        fieldType="textarea"
      />

      {/* Color and Icon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                disabled={isLoading}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  formData.color === color
                    ? 'border-slate-900 scale-110 ring-2 ring-offset-2 ring-slate-300'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div>
          <FormField
            label="Icon"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            fieldType="select"
            isDisabled={isLoading}
          >
            {DEFAULT_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {getCategoryIcon(icon)} {icon}
              </option>
            ))}
          </FormField>
        </div>
      </div>

      {/* Monthly Budget */}
      <FormField
        label="Monthly Budget (Optional)"
        name="monthly_budget"
        type="number"
        step="0.01"
        min="0"
        value={formData.monthly_budget}
        onChange={handleChange}
        placeholder="0.00"
        isDisabled={isLoading}
        helperText="Set a monthly budget limit for this category"
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

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
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
          disabled={isLoading || !formData.name.trim()}
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
              {isEditMode ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            isEditMode ? 'Update Category' : 'Create Category'
          )}
        </Button>
      </div>
    </form>
  );
};

