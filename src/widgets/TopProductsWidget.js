import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { countField, periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useData } from '../core/data/DataProvider';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { rankProducts } from '../utils/productRanking';
import { TopProducts } from '../components/products/TopProducts';
import { EmptyState } from '../core/widgets/parts';

const TopProductsView = ({ config, size }) => {
  const { orders, period } = useWidgetOrders(config.period);
  const { products } = useData();
  const { openProduct } = useOverlays();

  const { items, totalRevenue } = useMemo(
    () => rankProducts(orders, products, { limit: config.count, by: config.by }),
    [orders, products, config.count, config.by]
  );

  if (items.length === 0) return <EmptyState emoji="🏆">Pas encore de podium sur {period.short} : votre prochain best-seller est peut-être en route !</EmptyState>;
  return (
    <TopProducts items={items} totalRevenue={totalRevenue} by={config.by} onView={openProduct} width={size.width} height={size.height} />
  );
};

defineWidget({
  type: 'top-products',
  title: 'Produits les plus rentables',
  description: 'Le classement de vos produits, variantes additionnées, avec leur part du revenu.',
  icon: Trophy,
  category: 'Produits',
  bleed: true,
  size: { w: 12, h: 10, minW: 3, minH: 5, maxW: 12, maxH: 30 },
  defaultConfig: { count: 5, by: 'revenue', period: 'page' },
  schema: [
    { key: 'by', label: 'Classer par', type: 'select', options: [{ value: 'revenue', label: 'Revenu' }, { value: 'sold', label: 'Unités vendues' }] },
    countField({ max: 12 }),
    periodField(),
  ],
  getTitle: (c) => (c.by === 'sold' ? 'Produits les plus vendus' : 'Produits les plus rentables'),
  presets: [{ label: 'Produits les plus vendus', description: 'Classés par nombre d’unités vendues.', config: { by: 'sold' } }],
  component: TopProductsView,
});
