import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200',
    ghost: 'hover:bg-gray-100 text-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-gray-200 bg-transparent hover:bg-gray-50 text-gray-900'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-10 w-10 p-2 flex items-center justify-center'
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = 'Button';