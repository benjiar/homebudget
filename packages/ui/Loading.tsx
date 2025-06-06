import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-slate-200 border-t-slate-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function LoadingSkeleton({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4',
  rounded = false 
}: LoadingSkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-slate-200 ${width} ${height} ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
}

export function LoadingCard({ className = '', lines = 3, showAvatar = false }: LoadingCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 ${className}`}>
      <div className="animate-pulse">
        {showAvatar && (
          <div className="flex items-center space-x-4 mb-4">
            <LoadingSkeleton width="w-12" height="h-12" rounded />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton width="w-1/4" height="h-4" />
              <LoadingSkeleton width="w-1/3" height="h-3" />
            </div>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <LoadingSkeleton 
              key={i}
              width={i === lines - 1 ? 'w-3/4' : 'w-full'}
              height="h-4"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  subtitle?: string;
}

export function LoadingPage({ title = "Loading", subtitle }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
        {subtitle && (
          <p className="text-slate-600">{subtitle}</p>
        )}
      </div>
    </div>
  );
} 