import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { STATUS_LABELS } from '../ui/Badge';
import { CHANNELS, ChannelLogo } from '../ui/ChannelBadge';
import { netOf, commissionRateOf } from '../../utils/orderAmounts';
import { money, relativeDay, itemsSummary } from '../../core/metrics/format';
import { listItem } from '../../core/ui/motion';

// Un rail de couleur + une pastille : le statut se lit avant même le texte.
const STATUS_STYLE = {
  pending: { bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700' },
  shipped: { bar: 'bg-sky-400', pill: 'bg-sky-50 text-sky-700' },
  delivered: { bar: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700' },
  cancelled: { bar: 'bg-gray-300', pill: 'bg-gray-100 text-gray-500' },
};
// Hauteurs fixes : la pagination calcule combien de lignes tiennent dans le widget.
export const ORDER_ROW_H = { compact: 64, full: 84 };

const FALLBACK_STATUS = { bar: 'bg-purple-300', pill: 'bg-purple-50 text-purple-700' };

const CHANNEL_TILE = {
  kofi: 'bg-purple-100 text-purple-700',
  reel: 'bg-pink-100 text-pink-700',
};

export const Avatar = ({ name, size = 'w-9 h-9' }) => (
  <div className={`${size} bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
    {(name || '?').charAt(0).toUpperCase()}
  </div>
);

export const NetAmount = ({ order }) => {
  const net = netOf(order);
  const cancelled = order.status === 'cancelled';
  return (
    <>
      <p className={`font-bold whitespace-nowrap leading-tight ${cancelled ? 'text-gray-400 line-through' : 'text-gray-900'} ${net === 0 && !cancelled ? 'text-purple-600' : ''}`}>
        {net === 0 && !cancelled ? 'Offert 🎁' : money(net)}
      </p>
      {commissionRateOf(order) > 0 && (
        <p className="text-[10px] text-gray-400 leading-tight whitespace-nowrap" title="Net après commission de la boutique">
          −{commissionRateOf(order)} %<span className="hidden @md:inline"> commission</span>
        </p>
      )}
    </>
  );
};

// Une commande = un petit ticket : pastille du canal, numéro + statut, client et date relative, aperçu des
// articles, montant net à droite. Volontairement différent d'une ligne de client (pas d'avatar rond, pas de
// colonnes) pour qu'on ne confonde jamais les deux listes. `compact` : pour les widgets courts.
export const OrderRow = ({ order, onClick, compact = false, showChannel = true, showStatus = true, index = 0 }) => {
  const style = STATUS_STYLE[order.status] || FALLBACK_STATUS;
  const channel = CHANNELS[order.channel];
  const { text, more } = itemsSummary(order);
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      custom={index}
      variants={listItem}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      style={{ height: compact ? ORDER_ROW_H.compact : ORDER_ROW_H.full }}
      className="group relative w-full shrink-0 flex items-center gap-3 text-left bg-white border border-purple-100 rounded-2xl overflow-hidden pl-4 pr-3 hover:border-purple-300 hover:shadow-md transition-colors"
    >
      <span className={`absolute left-0 inset-y-2.5 w-1 rounded-r-full ${style.bar}`} aria-hidden="true" />

      {showChannel && (
        <span
          title={channel ? channel.label : order.channel}
          className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl flex items-center justify-center shrink-0 ${CHANNEL_TILE[order.channel] || 'bg-gray-100 text-gray-600'}`}
        >
          <ChannelLogo channel={order.channel} size={compact ? 16 : 18} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-gray-900 shrink-0">#{order.id.slice(0, 6)}</span>
          {showStatus && <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full whitespace-nowrap ${style.pill}`}>{statusLabel}</span>}
        </div>
        <p className="text-sm text-gray-600 truncate leading-snug">
          {order.customer_name || 'Client anonyme'}
          <span className="text-gray-300"> · </span>
          <span className="text-gray-500">{relativeDay(order.order_date)}</span>
        </p>
        {!compact && text && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {text}{more > 0 && <span className="font-semibold text-purple-500"> +{more}</span>}
          </p>
        )}
      </div>

      <div className="text-right shrink-0"><NetAmount order={order} /></div>
      <ChevronRight size={16} className="hidden @md:block text-gray-300 group-hover:text-purple-400 group-hover:translate-x-0.5 transition shrink-0" />
    </motion.button>
  );
};
