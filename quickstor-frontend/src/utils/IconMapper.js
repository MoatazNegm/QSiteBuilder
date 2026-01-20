import React from 'react';
import * as Icons from 'lucide-react';

export const IconMapper = ({ name, className, size = 24 }) => {
  // Dynamically access the icon component from the imported object
  const IconComponent = Icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    // Return a fallback or null to prevent crashing
    return null;
  }

  return React.createElement(IconComponent, { className, size });
};