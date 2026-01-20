import React from 'react';
import * as Icons from 'lucide-react';

export const IconMapper = ({ name, className, size = 24 }) => {
  // Dynamically access the icon component from the imported object
  const IconComponent = Icons[name];

  if (!IconComponent) {
    // Silent fail or placeholder could go here
    return null;
  }

  // Using React.createElement to avoid JSX compilation issues in some build steps
  return React.createElement(IconComponent, { className, size });
};