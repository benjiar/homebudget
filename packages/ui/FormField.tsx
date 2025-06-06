import React, { forwardRef, useState } from 'react';
import { tokens } from './tokens';

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outline' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fieldType?: 'input' | 'textarea' | 'select';
  children?: React.ReactNode; // For select options
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(
  ({ 
    label,
    helperText,
    errorMessage,
    isRequired = false,
    isDisabled = false,
    isInvalid = false,
    leftIcon,
    rightIcon,
    variant = 'outline',
    size = 'md',
    fieldType = 'input',
    className = '',
    children,
    id,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // Generate unique ID if not provided
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
    
    // Size variants
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg'
    };
    
    // Variant styles
    const getVariantClasses = () => {
      const baseClasses = 'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
      
      if (isInvalid) {
        return `${baseClasses} border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-200`;
      }
      
      switch (variant) {
        case 'filled':
          return `${baseClasses} border-transparent bg-slate-100 hover:bg-slate-150 focus:bg-white focus:border-blue-500 focus:ring-blue-200`;
        case 'ghost':
          return `${baseClasses} border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-blue-200`;
        default: // outline
          return `${baseClasses} border-slate-300 bg-white hover:border-slate-400 focus:border-blue-500 focus:ring-blue-200 ${
            isFocused ? 'border-blue-500 ring-2 ring-blue-200' : ''
          }`;
      }
    };
    
    const inputClasses = `${getVariantClasses()} ${sizeClasses[size]} ${
      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`;

    const labelClasses = `block text-sm font-medium mb-2 ${
      isInvalid ? 'text-red-700' : 'text-slate-700'
    } ${isDisabled ? 'opacity-50' : ''}`;

    const helperTextClasses = `mt-1 text-sm ${
      isInvalid ? 'text-red-600' : 'text-slate-500'
    }`;

    const renderField = () => {
      const commonProps = {
        id: fieldId,
        disabled: isDisabled,
        required: isRequired,
        'aria-invalid': isInvalid,
        'aria-describedby': helperText || errorMessage ? `${fieldId}-helper` : undefined,
        onFocus: (e: React.FocusEvent) => {
          setIsFocused(true);
          props.onFocus?.(e as any);
        },
        onBlur: (e: React.FocusEvent) => {
          setIsFocused(false);
          props.onBlur?.(e as any);
        }
      };

      switch (fieldType) {
        case 'textarea':
          return (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              className={`${inputClasses} min-h-[80px] resize-y`}
              {...commonProps}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          );
          
        case 'select':
          return (
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              className={`${inputClasses} pr-8 appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")]`}
              {...commonProps}
              {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
            >
              {children}
            </select>
          );
          
        default: // input
          return (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              className={inputClasses}
              {...commonProps}
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          );
      }
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label htmlFor={fieldId} className={labelClasses}>
            {label}
            {isRequired && (
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            )}
          </label>
        )}
        
        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDisabled ? 'opacity-50' : 'text-slate-400'
            }`}>
              {leftIcon}
            </div>
          )}
          
          {/* Field */}
          {renderField()}
          
          {/* Right icon */}
          {rightIcon && (
            <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
              isDisabled ? 'opacity-50' : 'text-slate-400'
            }`}>
              {rightIcon}
            </div>
          )}
          
          {/* Invalid icon */}
          {isInvalid && !rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Helper text or error message */}
        {(helperText || errorMessage) && (
          <div id={`${fieldId}-helper`} className={helperTextClasses}>
            {isInvalid && errorMessage ? errorMessage : helperText}
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Additional form components
export interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  isRequired?: boolean;
  className?: string;
}

export const FormLabel: React.FC<FormLabelProps> = ({ 
  children, 
  htmlFor, 
  isRequired = false, 
  className = '' 
}) => (
  <label 
    htmlFor={htmlFor} 
    className={`block text-sm font-medium text-slate-700 mb-2 ${className}`}
  >
    {children}
    {isRequired && (
      <span className="text-red-500 ml-1" aria-label="required">*</span>
    )}
  </label>
);

export interface FormHelperTextProps {
  children: React.ReactNode;
  isError?: boolean;
  className?: string;
}

export const FormHelperText: React.FC<FormHelperTextProps> = ({ 
  children, 
  isError = false, 
  className = '' 
}) => (
  <div className={`mt-1 text-sm ${
    isError ? 'text-red-600' : 'text-slate-500'
  } ${className}`}>
    {children}
  </div>
);

export interface FormErrorMessageProps {
  children: React.ReactNode;
  className?: string;
}

export const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`mt-1 text-sm text-red-600 flex items-center ${className}`}>
    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {children}
  </div>
); 