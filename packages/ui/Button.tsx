import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button = ({
  children,
  onClick,
  disabled,
  className,
  type = 'button',
  ...props
}: ButtonProps) => {
  const baseClasses = `
    px-4 py-2 rounded-xl font-medium 
    focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-offset-2
    transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95 transform
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};
