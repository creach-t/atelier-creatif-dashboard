import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Wallet, ShoppingBag, Receipt, Package, Users, UserPlus, Clock, Gauge } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { metricField, periodField, tintField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { getMetric, variation } from '../core/metrics/metrics';
import { buildSeries } from '../core/metrics/series';
import { formatValue } from '../core/metrics/format';
import { AnimatedNumber } from '../core/ui/AnimatedNumber';
import { ChartBox, TintTile, Variation } from '../core/widgets/parts';
import { tintColor } from '../core/config/ConfigForm';

const ICONS = { wallet: Wallet, bag: ShoppingBag, receipt: Receipt, package: Package, users: Users, userplus: UserPlus, clock: Clock };

const MetricView = ({ config, size }) => {
  const { orders, prevOrders, allOrders, period } = useWidgetOrders(config.period);
  const metric = getMetric(config.metric);
  const tint = config.tint || metric.tint;
  const Icon = ICONS[metric.icon] || Gauge;
  const ctx = useMemo(() => ({ allOrders }), [allOrders]);

  const value = metric.compute(orders, ctx);
  const previous = prevOrders ? metric.compute(prevOrders, ctx) : null;
  const delta = config.compare && previous !== null ? variation(value, previous) : null;

  const series = useMemo(
    () => (config.sparkline ? buildSeries(orders, metric.id, period, 'auto', ctx).points : []),
    [config.sparkline, orders, metric.id, period, ctx]
  );
  const showSpark = config.sparkline && series.length > 1 && size.height > 120;
  const color = tintColor(tint);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-start gap-3">
        <TintTile tint={tint} size={size.compact ? 'w-9 h-9' : 'w-10 h-10'}><Icon size={size.compact ? 16 : 18} /></TintTile>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 truncate">{metric.short} · {period.short}</p>
          <p className={`font-bold text-gray-900 leading-tight ${size.width < 200 ? 'text-xl' : 'text-2xl @md:text-3xl'}`}>
            <AnimatedNumber value={value} format={(n) => formatValue(n, metric.format)} />
          </p>
        </div>
        {config.compare && <Variation value={delta} label={period.prev ? undefined : 'pas de comparaison'} />}
      </div>
      {showSpark && (
        <ChartBox className="mt-2 -mx-4 -mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${metric.id}-${tint}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#spark-${metric.id}-${tint})`} dot={false} isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>
      )}
    </div>
  );
};

const preset = (label, metric, tint, description) => ({ label, description, config: { metric, tint }, size: { w: 3, h: 4 } });

defineWidget({
  type: 'metric',
  title: 'Indicateur',
  description: 'Un chiffre clé (revenus, commandes, panier…) avec sa variation et une mini-courbe.',
  icon: Gauge,
  category: 'Ventes',
  size: { w: 3, h: 4, minW: 2, minH: 3, maxW: 12, maxH: 10 },
  defaultConfig: { metric: 'revenue', period: 'page', compare: true, sparkline: true, tint: 'purple', showTitle: false },
  schema: [
    metricField(),
    periodField(),
    { key: 'compare', label: 'Comparer à la période précédente', type: 'toggle' },
    { key: 'sparkline', label: 'Mini-courbe', type: 'toggle' },
    tintField(),
  ],
  getTitle: (c) => getMetric(c.metric).label,
  presets: [
    preset('Revenus', 'revenue', 'pink', 'Ce que vous touchez vraiment, net de commission.'),
    preset('Commandes', 'orders', 'purple', 'Nombre de commandes sur la période.'),
    preset('Panier moyen', 'basket', 'amber', 'Montant net moyen par commande.'),
    preset('Nouveaux clients', 'newCustomers', 'emerald', 'Clients dont la 1re commande tombe dans la période.'),
    preset('Articles vendus', 'items', 'sky', 'Total d’articles sur la période.'),
    preset('Commandes en attente', 'pending', 'amber', 'À traiter : commandes pas encore expédiées.'),
  ],
  component: MetricView,
});
