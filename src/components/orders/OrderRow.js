import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge, OrderNumber, STATUS_LABELS } from '../ui/Badge';
import { ChannelBadge } from '../ui/ChannelBadge';
import { countOrderItems } from '../../utils/computeProductRevenue';
import { netOf, commissionRateOf } from '../../utils/orderAmounts';
import { money, formatDate, formatDateShort } from '../../core/metrics/format';

export const Avatar = ({ name, size = 'w-9 h-9' }) => (
  <div className={`${size} bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
    {(name || '?').charAt(0).toUpperCase()}
  </div>
);

export const NetAmount = ({ order }) => (
  <>
    <p className="font-bold text-gray-900 whitespace-nowrap">{money(netOf(order))}</p>
    {commissionRateOf(order) > 0 && (
      <p className="text-[10px] text-gray-400 leading-tight whitespace-nowrap" title="Net après commission de la boutique">
        −{commissionRateOf(order)} %<span className="hidden @md:inline"> commission</span>
      </p>
    )}
  </>
);

// Une commande sur une ligne. `compact` (widgets étroits, listes courtes) : avatar, nom, date, montant et statut.
// Complet (tableau) : colonnes date / canal / total à partir de sm.
export const OrderRow = ({ order, onClick, compact = false, showChannel = true, showStatus = true }) => {
  const items = countOrderItems(order);

  if (compact) {
    return (
      <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-25 transition-colors text-left">
        <Avatar name={order.customer_name} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 break-words leading-tight">{order.customer_name || 'Client anonyme'}</p>
          <p className="text-xs text-gray-500 whitespace-nowrap">{formatDateShort(order.order_date)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 @md:flex-row @md:items-center @md:gap-3">
          <p className="font-semibold text-gray-900 whitespace-nowrap">{money(netOf(order))}</p>
          {showChannel && <span className="hidden @md:inline"><ChannelBadge channel={order.channel} /></span>}
          {showStatus && <Badge variant={order.status}>{STATUS_LABELS[order.status] || order.status}</Badge>}
        </div>
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 @md:gap-4 px-4 py-3.5 text-left hover:bg-purple-25 transition-colors">
      <Avatar name={order.customer_name} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 break-words">{order.customer_name || 'Anonyme'}</p>
        <p className="text-xs text-gray-500">
          <span className="@md:hidden">{formatDateShort(order.order_date)} · </span>
          <OrderNumber order={order} /> · {items} article{items > 1 ? 's' : ''}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-2 @md:hidden">
          <ChannelBadge channel={order.channel} />
          <div className="text-right"><NetAmount order={order} /></div>
        </div>
      </div>
      <p className="hidden @md:block w-28 shrink-0 text-sm text-gray-500">{formatDate(order.order_date)}</p>
      <div className="hidden @md:block w-36 shrink-0"><ChannelBadge channel={order.channel} /></div>
      <div className="hidden @md:block shrink-0 w-24 text-right"><NetAmount order={order} /></div>
      <ChevronRight size={16} className="hidden @md:block text-gray-300 shrink-0" />
    </button>
  );
};
