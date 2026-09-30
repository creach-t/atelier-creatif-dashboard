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

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// L'indicateur s'adapte en continu à sa taille : le chiffre grossit avec la place (jusqu'à ce que son texte
// tienne tout juste en largeur), l'icône disparaît quand le bloc est très bas, la mini-courbe n'apparaît que
// s'il reste de la hauteur, et un bloc haut affiche en plus la valeur de la période précédente.
const MetricView = ({ config, size }) => {
  const { orders, prevOrders, allOrders, period } = useWidgetOrders(config.period);
  const metric = getMetric(config.metric);
  const tint = config.tint || metric.tint;
  const Icon = ICONS[metric.icon] || Gauge;
  const ctx = useMemo(() => ({ allOrders }), [allOrders]);

  const value = metric.compute(orders, ctx);
  const previous = prevOrders ? metric.compute(prevOrders, ctx) : null;
  const delta = config.compare && previous !== null ? variation(value, previous) : null;
  const text = formatValue(value, metric.format);

  const w = size.measured ? size.width : 280;
  const h = size.measured ? size.height : 140;
  const showTile = h >= 110;
  const tall = h >= 210;
  const rowH = showTile ? 40 : 18;
  // Taille du chiffre : limitée par la largeur (longueur du texte) et par la hauteur disponible.
  const fontPx = clamp(Math.min((w - 12) / (text.length * 0.7), (h - rowH) * 0.5), h < 70 ? 14 : 20, 64);
  const sparkH = h - rowH - fontPx * 1.25 - (tall ? 22 : 0) - 8;

  const series = useMemo(
    () => (config.sparkline ? buildSeries(orders, metric.id, period, 'auto', ctx).points : []),
    [config.sparkline, orders, metric.id, period, ctx]
  );
  const showSpark = config.sparkline && series.length > 1 && sparkH >= 36;
  const color = tintColor(tint);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* pr-7 : laisse la place au cadenas du widget (coin haut droit) */}
      <div className="flex items-start gap-3 pr-7">
        {showTile && <TintTile tint={tint} size={tall ? 'w-11 h-11' : 'w-10 h-10'}><Icon size={tall ? 20 : 18} /></TintTile>}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 truncate">{metric.short} · {period.short}</p>
          {!showTile && (
            <p className="font-bold text-gray-900 leading-none mt-0.5" style={{ fontSize: fontPx }}>
              <AnimatedNumber value={value} format={(n) => formatValue(n, metric.format)} />
            </p>
          )}
        </div>
        {config.compare && <Variation value={delta} label={period.prev ? undefined : 'pas de comparaison'} />}
      </div>
      {showTile && (
        <p className="font-bold text-gray-900 leading-none mt-2" style={{ fontSize: fontPx }}>
          <AnimatedNumber value={value} format={(n) => formatValue(n, metric.format)} />
        </p>
      )}
      {tall && previous !== null && config.compare && period.prev && (
        <p className="text-xs text-gray-400 mt-1.5">{period.prevLabel} : <span className="font-semibold text-gray-500">{formatValue(previous, metric.format)}</span></p>
      )}
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
