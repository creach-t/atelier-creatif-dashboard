import React from 'react';
import { STATUS_LABELS } from '../../domain/constants';

export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    shipped: 'bg-blue-100 text-blue-800 border-blue-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Le statut n'est plus un badge dans les fiches de commande : c'est une couleur d'accent sur le numéro.
export const STATUS_ACCENT = {
  pending: 'text-amber-500',
  shipped: 'text-blue-500',
  delivered: 'text-emerald-500',
  cancelled: 'text-rose-400 line-through',
};

export const OrderNumber = ({ order, className = '' }) => (
  <span
    className={`font-bold ${STATUS_ACCENT[order.status] || 'text-gray-500'} ${className}`}
    title={STATUS_LABELS[order.status] || order.status}
  >
    #{order.id.slice(0, 6)}
  </span>
);
