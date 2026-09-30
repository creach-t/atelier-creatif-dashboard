import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { metricField, periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { getMetric } from '../core/metrics/metrics';
import { formatValue } from '../core/metrics/format';
import { ChartTooltip, EmptyState } from '../core/widgets/parts';
import { ScaleToFit } from '../core/widgets/ScaleToFit';
import { ChannelBadge, CHANNELS } from '../components/ui/ChannelBadge';

const PALETTE = ['#a78bfa', '#f472b6', '#fbbf24', '#34d399'];

const ChannelsView = ({ config, size }) => {
  const { orders, allOrders, period } = useWidgetOrders(config.period);
  const metric = getMetric(config.metric);
  const ctx = useMemo(() => ({ allOrders }), [allOrders]);

  const rows = useMemo(() => Object.keys(CHANNELS).map((channel, i) => {
    const list = orders.filter((o) => o.channel === channel);
    return { channel, name: CHANNELS[channel].label, value: metric.compute(list, ctx), count: list.length, color: PALETTE[i % PALETTE.length] };
  }), [orders, metric, ctx]);

  const withValue = rows.filter((r) => r.value > 0);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const fmt = (n) => formatValue(n, metric.format);
  const wide = size.width > 420;
  // Trop court pour un anneau lisible : on passe en barres.
  const style = size.measured && size.height < 150 ? 'bars' : config.style;
  const showCounts = !(size.measured && size.width < 260);

  if (withValue.length === 0) return <EmptyState emoji="✨">Pas encore de vente sur {period.short} : vos canaux se dessineront ici dès la première.</EmptyState>;

  const legend = (
    <div className="space-y-3 w-full min-w-0">
      {rows.map((r) => (
        <div key={r.channel}>
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
              <ChannelBadge channel={r.channel} />
            </span>
            <span className="text-gray-500 text-right whitespace-nowrap">
              <span className="font-semibold text-gray-900">{fmt(r.value)}</span>{showCounts && <> · {r.count}</>}
            </span>
          </div>
          {style === 'bars' && (
            <div className="h-1.5 bg-purple-50 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: r.color }}
                initial={{ width: 0 }}
                animate={{ width: `${total > 0 ? (r.value / total) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Contenu de taille naturelle (anneau fixe + légende) : s'il dépasse le widget, il est réduit, jamais scrollé.
  if (style === 'bars') return <ScaleToFit><div className="pt-1">{legend}</div></ScaleToFit>;

  return (
    <ScaleToFit>
      <div className={`flex ${wide ? 'flex-row items-center' : 'flex-col items-center'} gap-4`}>
        <div className="shrink-0" style={{ width: 150, height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={withValue} cx="50%" cy="50%" innerRadius="58%" outerRadius="92%" paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
                {withValue.map((r) => <Cell key={r.channel} fill={r.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip format={fmt} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 w-full">{legend}</div>
      </div>
    </ScaleToFit>
  );
};

defineWidget({
  type: 'channels',
  title: 'Répartition par canal',
  description: 'Ko-fi ou point de vente : d’où viennent vos ventes.',
  icon: PieIcon,
  category: 'Ventes',
  size: { w: 5, h: 9, minW: 3, minH: 5, maxW: 12, maxH: 20 },
  defaultConfig: { metric: 'revenue', style: 'donut', period: 'page' },
  schema: [
    metricField(['revenue', 'gross', 'orders', 'items', 'commission']),
    periodField(),
    { key: 'style', label: 'Affichage', type: 'select', options: [{ value: 'donut', label: 'Anneau' }, { value: 'bars', label: 'Barres' }] },
  ],
  getTitle: (c) => `${getMetric(c.metric).short} par canal`,
  component: ChannelsView,
});
