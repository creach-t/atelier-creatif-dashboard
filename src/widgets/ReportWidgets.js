import React, { useMemo } from 'react';
import { Layers, Crown, Package } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { periodField } from '../core/widgets/common';
import { useWidgetOrders } from '../core/widgets/hooks';
import { useData } from '../core/data/DataProvider';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { computeReportStats } from '../utils/computeReportStats';
import { OverviewTab } from '../components/reports/OverviewTab';
import { CustomersTab } from '../components/reports/CustomersTab';
import { ProductsReportTab } from '../components/reports/ProductsReportTab';
import { EmptyState, ScrollArea } from '../core/widgets/parts';

// Les trois vues détaillées de l'ancien onglet « Rapports », désormais des widgets indépendants :
// chacun se place, se dimensionne et suit la période comme n'importe quel autre.
const useReportStats = (configPeriod) => {
  const { orders, period } = useWidgetOrders(configPeriod);
  const stats = useMemo(() => computeReportStats(orders), [orders]);
  return { orders, period, stats };
};

const OverviewView = ({ config }) => {
  const { orders, period, stats } = useReportStats(config.period);
  if (orders.length === 0) return <EmptyState icon={Layers}>Aucune commande sur {period.short}.</EmptyState>;
  return <ScrollArea><OverviewTab stats={stats} orders={orders} /></ScrollArea>;
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
  return <ScrollArea><CustomersTab stats={stats} firstOrderByName={firstOrderByName} onSelectCustomer={openCustomer} /></ScrollArea>;
};

const ProductsReportView = ({ config }) => {
  const { products } = useData();
  const { openProduct } = useOverlays();
  const { orders, period } = useReportStats(config.period);
  if (orders.length === 0) return <EmptyState icon={Package}>Aucune commande sur {period.short}.</EmptyState>;
  return <ScrollArea><ProductsReportTab products={products} orders={orders} onSelectProduct={openProduct} /></ScrollArea>;
};

const common = { category: 'Rapports', schema: [periodField()], defaultConfig: { period: 'page' } };

defineWidget({
  ...common,
  type: 'report-overview',
  title: 'Rapport : évolution',
  description: 'Courbes mensuelles, cumul, répartition par canal et jours de la semaine.',
  icon: Layers,
  size: { w: 12, h: 24, minW: 4, minH: 8, maxW: 12, maxH: 44 },
  component: OverviewView,
});

defineWidget({
  ...common,
  type: 'report-customers',
  title: 'Rapport : clients',
  description: 'Classement détaillé de vos clients avec recherche.',
  icon: Crown,
  size: { w: 6, h: 20, minW: 3, minH: 8, maxW: 12, maxH: 44 },
  component: CustomersReportView,
});

defineWidget({
  ...common,
  type: 'report-products',
  title: 'Rapport : produits',
  description: 'Ventes par produit, y compris les articles sans fiche.',
  icon: Package,
  size: { w: 6, h: 20, minW: 3, minH: 8, maxW: 12, maxH: 44 },
  component: ProductsReportView,
});
