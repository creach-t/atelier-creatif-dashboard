import React, { useMemo } from 'react';
import { Layers, Crown, Package } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useData } from '../data/DataProvider';
import { useOverlays } from '../features/overlays/OverlayProvider';
import { computeReportStats } from '../utils/computeReportStats';
import { OverviewReport } from '../features/reports/OverviewReport';
import { CustomersReport } from '../features/reports/CustomersReport';
import { ProductsReport } from '../features/reports/ProductsReport';
import { EmptyState } from '../core/widgets/parts';
import { ScaleToFit } from '../core/widgets/ScaleToFit';

// Les trois rapports détaillés (features/reports) sous forme de widgets indépendants :
// chacun se place, se dimensionne et suit la période comme n'importe quel autre.
const useReportStats = (configPeriod) => {
  const { orders, period } = useWidgetOrders(configPeriod);
  const stats = useMemo(() => computeReportStats(orders), [orders]);
  return { orders, period, stats };
};

const OverviewView = ({ config }) => {
  const { orders, period, stats } = useReportStats(config.period);
  if (orders.length === 0) return <EmptyState icon={Layers}>Aucune commande sur {period.short}.</EmptyState>;
  return <ScaleToFit min={0.25}><OverviewReport stats={stats} orders={orders} /></ScaleToFit>;
};

const CustomersReportView = ({ config }) => {
  const { orders: all } = useData();
  const { openCustomer } = useOverlays();
  const { orders, period, stats } = useReportStats(config.period);
  // « Depuis » reste la 1re commande sur tout l'historique, indépendamment de la période affichée.
  const firstOrderByName = useMemo(() => {
    const map = {};
    all.forEach((o) => {
      if (!o.customer_name || !o.order_date) return;
      if (!map[o.customer_name] || o.order_date < map[o.customer_name]) map[o.customer_name] = o.order_date;
    });
    return map;
  }, [all]);
  if (orders.length === 0) return <EmptyState icon={Crown}>Aucune commande sur {period.short}.</EmptyState>;
  return <ScaleToFit min={0.25}><CustomersReport stats={stats} firstOrderByName={firstOrderByName} onSelectCustomer={openCustomer} /></ScaleToFit>;
};

const ProductsReportView = ({ config }) => {
  const { products } = useData();
  const { openProduct } = useOverlays();
  const { orders, period } = useReportStats(config.period);
  if (orders.length === 0) return <EmptyState icon={Package}>Aucune commande sur {period.short}.</EmptyState>;
  return <ScaleToFit min={0.25}><ProductsReport products={products} orders={orders} onSelectProduct={openProduct} /></ScaleToFit>;
};

const common = { category: 'Rapports', schema: [periodField()], defaultConfig: { period: 'page' } };

defineWidget({
  ...common,
  type: 'report-overview',
  title: 'Rapport : évolution',
  description: 'Courbes mensuelles, cumul, répartition par canal et jours de la semaine.',
  icon: Layers,
  size: { w: 12, h: 24, minW: 4, minH: 14, maxW: 12, maxH: 44 },
  component: OverviewView,
});

defineWidget({
  ...common,
  type: 'report-customers',
  title: 'Rapport : clients',
  description: 'Classement détaillé de vos clients avec recherche.',
  icon: Crown,
  size: { w: 6, h: 20, minW: 4, minH: 12, maxW: 12, maxH: 44 },
  component: CustomersReportView,
});

defineWidget({
  ...common,
  type: 'report-products',
  title: 'Rapport : produits',
  description: 'Ventes par produit, y compris les articles sans fiche.',
  icon: Package,
  size: { w: 6, h: 20, minW: 4, minH: 12, maxW: 12, maxH: 44 },
  component: ProductsReportView,
});
