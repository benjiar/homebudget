import { useState, useEffect } from 'react';
import { Button, Input } from '@homebudget/ui';
import { BudgetPeriod, Category } from '@homebudget/types';

export interface BudgetFormData {
  name: string;
  description?: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  category_id?: string;
  is_recurring?: boolean;
}

interface BudgetFormProps {
  initialData?: Partial<BudgetFormData>;
  categories: Category[];
  onSubmit: (data: BudgetFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BudgetForm({ initialData, categories, onSubmit, onCancel, isLoading }: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    description: '',
    amount: 0,
    period: BudgetPeriod.MONTHLY,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    category_id: '',
    is_recurring: false,
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormData, string>>>({});

  // Auto-calculate end date based on period
  useEffect(() => {
    if (formData.start_date && formData.period !== BudgetPeriod.CUSTOM) {
      const startDate = new Date(formData.start_date);
      let endDate = new Date(startDate);

      if (formData.period === BudgetPeriod.MONTHLY) {
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
      } else if (formData.period === BudgetPeriod.YEARLY) {
        endDate.setFullYear(startDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // Day before next year
      }

      setFormData((prev) => ({
        ...prev,
        end_date: endDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.start_date, formData.period]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BudgetFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleChange = (field: keyof BudgetFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Budget Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Budget Name <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Monthly Groceries Budget"
          disabled={isLoading}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Optional description..."
          rows={3}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Amount and Period Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            step="0.01"
            min="0"
            disabled={isLoading}
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Period <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.period}
            onChange={(e) => handleChange('period', e.target.value as BudgetPeriod)}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value={BudgetPeriod.MONTHLY}>Monthly</option>
            <option value={BudgetPeriod.YEARLY}>Yearly</option>
            <option value={BudgetPeriod.CUSTOM}>Custom Period</option>
          </select>
          {errors.period && <p className="mt-1 text-sm text-red-600">{errors.period}</p>}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            disabled={isLoading}
          />
          {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            End Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            disabled={isLoading || formData.period !== BudgetPeriod.CUSTOM}
          />
          {formData.period !== BudgetPeriod.CUSTOM && (
            <p className="mt-1 text-xs text-slate-500">Auto-calculated from period</p>
          )}
          {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select
          value={formData.category_id || ''}
          onChange={(e) => handleChange('category_id', e.target.value || undefined)}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
        >
          <option value="">All Categories (General Budget)</option>
          {categories
            .filter((cat) => cat.is_active)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">Leave empty for general household budget</p>
        {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
      </div>

      {/* Recurring Option */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_recurring}
            onChange={(e) => handleChange('is_recurring', e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">
            Recurring budget (automatically create for next period)
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Budget' : 'Create Budget'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
