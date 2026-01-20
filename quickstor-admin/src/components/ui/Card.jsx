import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ className, children, ...props }) => (
  <div className={cn("rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm", className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);