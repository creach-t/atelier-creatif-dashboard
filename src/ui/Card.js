import React from 'react';

export const Card = ({ children, className = '', hover = false, onClick }) => {
  const classes = `bg-white rounded-2xl shadow-sm border border-purple-100 ${
    hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  } ${onClick ? 'w-full text-left cursor-pointer' : ''} ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
};
