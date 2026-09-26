import React from 'react';

export const Card = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-purple-100 ${
      hover ? 'hover:shadow-md transition-shadow duration-200' : ''
    } ${className}`}
  >
    {children}
  </div>
);
