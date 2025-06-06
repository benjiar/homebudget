import React, { useState, useRef, useCallback } from 'react';
import { tokens } from './tokens';

export interface MobileReceiptFormProps {
  onSubmit: (data: ReceiptFormData) => Promise<void>;
  onCancel: () => void;
  categories: Array<{ id: string; name: string; icon: string }>;
  isLoading?: boolean;
  initialData?: Partial<ReceiptFormData>;
}

export interface ReceiptFormData {
  title: string;
  amount: number;
  category_id: string;
  receipt_date: string;
  notes?: string;
  photo?: File;
}

export const MobileReceiptForm: React.FC<MobileReceiptFormProps> = ({
  onSubmit,
  onCancel,
  categories,
  isLoading = false,
  initialData
}) => {
  const [formData, setFormData] = useState<ReceiptFormData>({
    title: initialData?.title || '',
    amount: initialData?.amount || 0,
    category_id: initialData?.category_id || '',
    receipt_date: initialData?.receipt_date || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
    photo: initialData?.photo
  });

  const [step, setStep] = useState<'photo' | 'details' | 'review'>('photo');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setUseCamera(true);
    } catch (error) {
      console.error('Camera access failed:', error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'receipt-photo.jpg', { type: 'image/jpeg' });
        setFormData(prev => ({ ...prev, photo: file }));
        setPhotoPreview(URL.createObjectURL(blob));
        stopCamera();
        setStep('details');
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
      setStep('details');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Receipt title is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit receipt:', error);
    }
  };

  const handleInputChange = (field: keyof ReceiptFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Quick amount buttons for common values
  const quickAmounts = [10, 20, 50, 100, 200, 500];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={step === 'photo' ? onCancel : () => setStep('photo')}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">Add Receipt</h1>
          </div>
          
          {/* Progress indicators */}
          <div className="flex space-x-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${
              step === 'photo' ? 'bg-white' : 'bg-white/50'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${
              step === 'details' ? 'bg-white' : 'bg-white/50'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${
              step === 'review' ? 'bg-white' : 'bg-white/50'
            }`} />
          </div>
        </div>
      </div>

      {/* Photo Step */}
      {step === 'photo' && (
        <div className="flex-1 flex flex-col">
          {useCamera ? (
            <div className="flex-1 relative bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera controls */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center space-x-8">
                <button
                  onClick={stopCamera}
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Capture button */}
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-white/50 flex items-center justify-center"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full" />
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Add Receipt Photo</h2>
                <p className="text-slate-600">Take a photo or upload from your gallery</p>
              </div>
              
              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={startCamera}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>Take Photo</span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-100 text-slate-700 py-4 px-6 rounded-xl font-medium flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Choose from Gallery</span>
                </button>
                
                <button
                  onClick={() => setStep('details')}
                  className="w-full text-slate-600 py-3 px-6 rounded-xl font-medium"
                >
                  Skip Photo
                </button>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Details Step */}
      {step === 'details' && (
        <div className="flex-1 overflow-y-auto">
          {/* Photo preview */}
          {photoPreview && (
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Receipt preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setPhotoPreview(null);
                    setFormData(prev => ({ ...prev, photo: undefined }));
                    setStep('photo');
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="p-4 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Receipt Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-lg ${
                  errors.title ? 'border-red-300' : 'border-slate-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="e.g., Grocery shopping, Gas, Restaurant"
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amount (₪) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg font-medium">
                  ₪
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl text-lg ${
                    errors.amount ? 'border-red-300' : 'border-slate-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
              
              {/* Quick amount buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleInputChange('amount', amount)}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    ₪{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleInputChange('category_id', category.id)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.category_id === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-sm font-medium text-slate-700">{category.name}</div>
                  </button>
                ))}
              </div>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.receipt_date}
                onChange={(e) => handleInputChange('receipt_date', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional details..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom button */}
      {step === 'details' && (
        <div className="border-t border-slate-200 p-4 safe-area-bottom">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Receipt</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}; 