import * as React from 'react';
import { tokens } from './tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const isButtonDisabled = isDisabled || disabled || isLoading;

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
    xl: 'px-8 py-4 text-xl h-16'
  };

  // Variant styles
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-indigo-600 
      hover:from-blue-700 hover:to-indigo-700 
      active:from-blue-800 active:to-indigo-800
      focus:ring-blue-500
      text-white font-semibold
      shadow-lg hover:shadow-blue-500/25
    `,
    secondary: `
      bg-gradient-to-r from-slate-100 to-slate-200 
      hover:from-slate-200 hover:to-slate-300 
      active:from-slate-300 active:to-slate-400
      focus:ring-slate-500
      text-slate-700 font-medium
      border border-slate-300
      shadow-sm
    `,
    tertiary: `
      bg-white 
      hover:bg-slate-50 
      active:bg-slate-100
      focus:ring-slate-500
      text-slate-700 font-medium
      border border-slate-300
      shadow-sm
    `,
    ghost: `
      bg-transparent 
      hover:bg-slate-100 
      active:bg-slate-200
      focus:ring-slate-500
      text-slate-700 font-medium
    `,
    destructive: `
      bg-gradient-to-r from-red-600 to-red-700 
      hover:from-red-700 hover:to-red-800 
      active:from-red-800 active:to-red-900
      focus:ring-red-500
      text-white font-semibold
      shadow-lg hover:shadow-red-500/25
    `
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin h-4 w-4" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );

  const baseClasses = `
    inline-flex items-center justify-center
    rounded-xl font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
    active:scale-95 transform
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    ${fullWidth ? 'w-full' : ''}
  `.trim().replace(/\s+/g, ' ');

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isButtonDisabled}
      aria-disabled={isButtonDisabled}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {isLoading ? (
        <LoadingSpinner />
      ) : leftIcon ? (
        <span className="mr-2 flex-shrink-0">{leftIcon}</span>
      ) : null}
      
      {/* Button content */}
      <span className={isLoading ? 'ml-2' : ''}>{children}</span>
      
      {/* Right icon */}
      {rightIcon && !isLoading && (
        <span className="ml-2 flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Icon Button variant
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  // Square sizing for icon buttons
  const iconSizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
    xl: 'w-16 h-16 p-4'
  };

  return (
    <Button
      ref={ref}
      size={size}
      className={`${iconSizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// Button Group component
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'normal',
  className = ''
}) => {
  const spacingClasses = {
    tight: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
    normal: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    loose: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4'
  };

  const orientationClasses = {
    horizontal: 'flex flex-row items-center',
    vertical: 'flex flex-col items-stretch'
  };

  return (
    <div className={`${orientationClasses[orientation]} ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};
