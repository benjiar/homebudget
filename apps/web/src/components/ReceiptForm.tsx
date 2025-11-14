import React, { useState, useEffect, useRef } from 'react';
import { FormField, Button, Modal } from '@homebudget/ui';
import { Category, CreateReceiptRequest, CreateCategoryRequest } from '@homebudget/types';
import { CategoryForm } from './CategoryForm';
import { useOCR } from '../hooks/useOCR';

export interface ReceiptFormProps {
  households: Array<{ id: string; name: string }>;
  categories: Category[];
  isLoadingCategories?: boolean;
  onSubmit: (data: CreateReceiptRequest, photo?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialHouseholdId?: string;
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

  // Image upload and OCR state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing: isOCRProcessing, progress: ocrProgress, processImage, parseReceiptText } = useOCR();

  // Update household_id when initialHouseholdId changes
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

  const validateAndSetFile = async (file: File) => {
    // Validate file type (images and PDFs)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: 'Please select an image (PNG, JPG, GIF, WEBP) or PDF file' }));
      return false;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, image: 'File size must be less than 10MB' }));
      return false;
    }

    setSelectedImage(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      // For images, use FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDFs, generate thumbnail of first page
      setIsGeneratingThumbnail(true);
      try {
        const thumbnail = await generatePdfThumbnail(file);
        setImagePreview(thumbnail);
      } catch (error) {
        console.error('Failed to generate PDF thumbnail:', error);
        setImagePreview('pdf'); // Fallback to placeholder
      } finally {
        setIsGeneratingThumbnail(false);
      }
    }

    // Clear any previous image errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });

    return true;
  };

  // Generate thumbnail from PDF first page
  const generatePdfThumbnail = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Get first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });

    // Create canvas for thumbnail
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render page
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    // Convert to data URL
    return canvas.toDataURL('image/png');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await validateAndSetFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessOCR = async () => {
    if (!selectedImage) return;

    try {
      // Process image with OCR
      const ocrResult = await processImage(selectedImage);

      // Parse the text to extract receipt data
      const parsedData = parseReceiptText(ocrResult.text);

      // Update form with parsed data
      setFormData((prev) => ({
        ...prev,
        title: parsedData.title || prev.title,
        amount: parsedData.amount || prev.amount,
        receipt_date: parsedData.date || prev.receipt_date,
        notes: parsedData.notes || prev.notes,
      }));

      // Show success message or notification
      // You could add a toast/notification here
    } catch (error) {
      console.error('OCR processing error:', error);
      setErrors((prev) => ({
        ...prev,
        image: error instanceof Error ? error.message : 'Failed to process image',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData, selectedImage || undefined);
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

      {/* Receipt Image/PDF Upload with OCR */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Receipt Document
          <span className="ml-2 text-xs text-slate-500">(Optional - Upload to auto-fill with OCR)</span>
        </label>

        {!imagePreview && !isGeneratingThumbnail ? (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading || isOCRProcessing || isGeneratingThumbnail}
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center space-y-2">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium text-slate-600">Drop file here or click to upload</span>
                <span className="text-xs text-slate-400">PNG, JPG, PDF up to 10MB</span>
              </div>
            </div>
          </div>
        ) : isGeneratingThumbnail ? (
          <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-slate-300 rounded-lg bg-slate-50">
            <svg className="animate-spin h-12 w-12 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Generating preview...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File Preview */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              {imagePreview === 'pdf' ? (
                // Fallback if PDF thumbnail generation failed
                <div className="w-full h-64 flex flex-col items-center justify-center">
                  <svg className="w-16 h-16 text-red-500 mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-slate-700">PDF Document</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedImage?.name}</p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || ''}
                    alt="Receipt preview"
                    className="w-full h-64 object-contain"
                  />
                  {/* Show PDF badge if it's a PDF file */}
                  {selectedImage?.type === 'application/pdf' && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      PDF (Page 1)
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isLoading || isOCRProcessing}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* OCR Processing Button */}
            <button
              type="button"
              onClick={handleProcessOCR}
              disabled={isLoading || isOCRProcessing}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOCRProcessing ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing... {ocrProgress}%</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Extract Data from Image (OCR)</span>
                </span>
              )}
            </button>

            {isOCRProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Processing receipt image...</p>
                    <p className="text-blue-600 mt-1">Using OCR with Hebrew & English support to extract data.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {errors.image && (
          <p className="text-sm text-red-600">{errors.image}</p>
        )}
      </div>

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
                // Ensure data has household_id for creation
                const createData: CreateCategoryRequest = {
                  ...(data as CreateCategoryRequest),
                  household_id: selectedHouseholdId,
                };
                const newCategory = await onCreateCategory(createData);
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

