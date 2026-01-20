import React from 'react';
import { cn } from '../../utils/cn';

export const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 mb-2 block",
        className
      )}
      {...props}
    />
  );
});

Label.displayName = "Label";