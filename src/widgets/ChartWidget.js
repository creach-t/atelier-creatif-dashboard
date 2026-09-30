import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart as LineChartIcon, BarChart3 } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { metricField, periodField, tintField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { getMetric, variation } from '../core/metrics/metrics';
import { buildSeries, cumulate, GRANULARITIES } from '../core/metrics/series';
import { formatValue } from '../core/metrics/format';
import { AnimatedNumber } from '../core/ui/AnimatedNumber';
import { ChartBox, ChartTooltip, EmptyState, Variation } from '../core/widgets/parts';
import { tintColor } from '../core/config/ConfigForm';

const AXIS = { fill: '#9ca3af', fontSize: 11 };

const ChartView = ({ config, size }) => {
  const { orders, prevOrders, allOrders, period } = useWidgetOrders(config.period);
  const metric = getMetric(config.metric);
  const ctx = useMemo(() => ({ allOrders }), [allOrders]);
  const color = tintColor(config.tint);

  const points = useMemo(() => {
    const { points: raw } = buildSeries(orders, metric.id, period, config.granularity, ctx);
    // Cumuler n'a pas de sens pour une moyenne (panier moyen).
    return config.cumulative && metric.id !== 'basket' ? cumulate(raw) : raw;
  }, [orders, metric, period, config.granularity, config.cumulative, ctx]);

  const total = metric.compute(orders, ctx);
  const delta = prevOrders ? variation(total, metric.compute(prevOrders, ctx)) : null;
  const fmt = (n) => formatValue(n, metric.format);
  const gradientId = `chart-${metric.id}-${config.tint}`;
  const narrow = size.width > 0 && size.width < 380;

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />
      <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={narrow ? 28 : 16} />
      <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatValue(v, metric.format, true)} width={narrow ? 38 : 46} />
      <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ fill: '#f3e8ff55' }} />
    </>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {config.showTotal && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
          <p className="text-2xl @md:text-3xl font-bold text-gray-900 leading-tight">
            <AnimatedNumber value={total} format={fmt} />
          </p>
          {config.compare && <Variation value={delta} label={period.prev ? undefined : period.label} />}
          <span className="text-xs text-gray-400">{metric.short} · {period.label}</span>
        </div>
      )}
      {points.length < 2 ? (
        <EmptyState icon={LineChartIcon}>Pas encore assez de données sur cette période.</EmptyState>
      ) : (
        <ChartBox>
          <ResponsiveContainer width="100%" height="100%">
            {config.chartType === 'bar' ? (
              <BarChart data={points} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
                {axes}
                <Bar dataKey="value" name={metric.short} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            ) : config.chartType === 'line' ? (
              <LineChart data={points} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                {axes}
                <Line type="monotone" dataKey="value" name={metric.short} stroke={color} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: color }} />
              </LineChart>
            ) : (
              <AreaChart data={points} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {axes}
                <Area type="monotone" dataKey="value" name={metric.short} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={points.length <= 40 ? { r: 3, strokeWidth: 0, fill: color } : false} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </ChartBox>
      )}
    </div>
  );
};

defineWidget({
  type: 'chart',
  title: 'Graphique',
  description: 'Évolution dans le temps d’un indicateur : courbe, aires ou barres.',
  icon: BarChart3,
  category: 'Ventes',
  size: { w: 8, h: 9, minW: 3, minH: 6, maxW: 12, maxH: 24 },
  defaultConfig: { metric: 'revenue', period: 'page', chartType: 'area', granularity: 'auto', showTotal: true, compare: true, cumulative: false, tint: 'pink' },
  schema: [
    metricField(),
    periodField(),
    { key: 'chartType', label: 'Forme', type: 'select', options: [{ value: 'area', label: 'Aires' }, { value: 'line', label: 'Courbe' }, { value: 'bar', label: 'Barres' }] },
    { key: 'granularity', label: 'Regroupement', type: 'select', options: GRANULARITIES },
    { key: 'cumulative', label: 'Cumuler (total qui monte)', type: 'toggle' },
    { key: 'showTotal', label: 'Afficher le total', type: 'toggle' },
    { key: 'compare', label: 'Variation vs période précédente', type: 'toggle', when: (c) => c.showTotal },
    tintField(),
  ],
  getTitle: (c) => `${getMetric(c.metric).label} dans le temps`,
  presets: [
    { label: 'Revenus par barres', description: 'Revenus regroupés par jour, semaine ou mois.', config: { metric: 'revenue', chartType: 'bar' } },
    { label: 'Commandes dans le temps', description: 'Le rythme de vos commandes.', config: { metric: 'orders', chartType: 'line', tint: 'purple' } },
    { label: 'Revenus cumulés', description: 'Le total qui grimpe au fil du temps.', config: { metric: 'revenue', chartType: 'area', cumulative: true, tint: 'emerald' } },
  ],
  component: ChartView,
});
