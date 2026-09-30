import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { countField, periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useData } from '../core/data/DataProvider';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { rankProducts } from '../utils/productRanking';
import { TopProducts } from '../components/products/TopProducts';
import { EmptyState, ScrollArea } from '../core/widgets/parts';

const TopProductsView = ({ config }) => {
  const { orders, period } = useWidgetOrders(config.period);
  const { products } = useData();
  const { openProduct } = useOverlays();

  const { items, totalRevenue } = useMemo(
    () => rankProducts(orders, products, { limit: config.count, by: config.by }),
    [orders, products, config.count, config.by]
  );

  if (items.length === 0) return <EmptyState icon={Trophy}>Aucune vente de produit sur {period.short}.</EmptyState>;
  return (
    <ScrollArea>
      <TopProducts items={items} totalRevenue={totalRevenue} by={config.by} bare onView={openProduct} />
    </ScrollArea>
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
