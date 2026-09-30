import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { countField, periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { computeStatsByName } from '../utils/customerStats';
import { getInitials } from '../utils/customerBadges';
import { money } from '../core/metrics/format';
import { EmptyState, ScrollArea } from '../core/widgets/parts';
import { listItem } from '../core/ui/motion';

const MEDALS = ['🥇', '🥈', '🥉'];

const TopCustomersView = ({ config }) => {
  const { orders, period } = useWidgetOrders(config.period);
  const { openCustomer } = useOverlays();

  const ranked = useMemo(() => Object.entries(computeStatsByName(orders))
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => (config.by === 'count' ? b.count - a.count || b.total - a.total : b.total - a.total))
    .slice(0, config.count), [orders, config.by, config.count]);

  if (ranked.length === 0) return <EmptyState icon={Crown}>Aucune commande sur {period.short}.</EmptyState>;
  const value = (c) => (config.by === 'count' ? c.count : c.total);
  const max = value(ranked[0]) || 1;

  return (
    <ScrollArea>
      <ul className="divide-y divide-purple-50">
        {ranked.map((c, i) => (
          <motion.li key={c.name} custom={i} variants={listItem} initial="hidden" animate="visible">
            <button type="button" onClick={() => openCustomer(c.name)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-25 transition-colors">
              <span className="w-6 text-center text-base shrink-0">{MEDALS[i] || <span className="text-xs font-bold text-gray-400">{i + 1}</span>}</span>
              <span className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{getInitials(c.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900 break-words">{c.name}</span>
                <span className="block h-1 bg-purple-50 rounded-full mt-1.5 overflow-hidden">
                  <motion.span
                    className={`block h-full rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-purple-300'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value(c) / max) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-sm font-bold text-gray-900 whitespace-nowrap">{config.by === 'count' ? `${c.count} cmd` : money(c.total)}</span>
                <span className="block text-[11px] text-gray-400 whitespace-nowrap">{config.by === 'count' ? money(c.total) : `${c.count} commande${c.count > 1 ? 's' : ''}`}</span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </ScrollArea>
  );
};

defineWidget({
  type: 'top-customers',
  title: 'Meilleur·es client·es',
  description: 'Le classement de vos clients par montant dépensé ou par nombre de commandes.',
  icon: Crown,
  category: 'Clients',
  bleed: true,
  size: { w: 6, h: 10, minW: 3, minH: 5, maxW: 12, maxH: 30 },
  defaultConfig: { count: 5, by: 'total', period: 'page' },
  schema: [
    { key: 'by', label: 'Classer par', type: 'select', options: [{ value: 'total', label: 'Montant' }, { value: 'count', label: 'Commandes' }] },
    countField({ max: 15 }),
    periodField(),
  ],
  component: TopCustomersView,
});
