import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarRange } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { metricField, periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { getMetric } from '../core/metrics/metrics';
import { formatValue } from '../core/metrics/format';
import { ChartBox, ChartTooltip, EmptyState } from '../core/widgets/parts';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const WeekdaysView = ({ config, size }) => {
  const { orders, allOrders } = useWidgetOrders(config.period);
  const metric = getMetric(config.metric);

  const data = useMemo(() => {
    const buckets = DAYS.map(() => []);
    orders.forEach((o) => {
      if (!o.order_date) return;
      buckets[(new Date(`${o.order_date}T12:00:00`).getDay() + 6) % 7].push(o);
    });
    return DAYS.map((name, i) => ({ name, value: Math.round(metric.compute(buckets[i], { allOrders }) * 100) / 100 }));
  }, [orders, allOrders, metric]);

  const best = data.reduce((m, d) => (d.value > m.value ? d : m), data[0]);
  if (orders.length === 0) return <EmptyState emoji="📅">Vos jours forts se révéleront avec les premières ventes.</EmptyState>;

  return (
    <ChartBox>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
          {!(size.measured && size.width < 260) && <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatValue(v, metric.format, true)} width={40} />}
          <Tooltip content={<ChartTooltip format={(n) => formatValue(n, metric.format)} />} cursor={{ fill: '#f3e8ff55' }} />
          <Bar dataKey="value" name={metric.short} radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((d) => <Cell key={d.name} fill={d.name === best.name && d.value > 0 ? '#f472b6' : '#c4b5fd'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
};

defineWidget({
  type: 'weekdays',
  title: 'Meilleurs jours de la semaine',
  description: 'Quels jours vous vendez le plus (le meilleur est en rose).',
  icon: CalendarRange,
  category: 'Rapports',
  size: { w: 6, h: 9, minW: 3, minH: 5, maxW: 12, maxH: 20 },
  defaultConfig: { metric: 'revenue', period: 'page' },
  schema: [metricField(['revenue', 'orders', 'items', 'gross']), periodField()],
  component: WeekdaysView,
});
