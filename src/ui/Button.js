import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', onClick, className = '', ...props }) => {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 flex items-center gap-2';
  const variants = {
    primary: 'bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    ghost: 'text-gray-600 hover:bg-gray-50',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
