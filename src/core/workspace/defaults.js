import { createPage, WORKSPACE_VERSION } from './model';

// Espace de travail livré par défaut : les mêmes 5 pages qu'avant, mais entièrement composées de widgets
// que l'utilisatrice peut déplacer, redimensionner, reconfigurer, supprimer.
// Positions en grille 12 colonnes (x, y, w, h) ; les versions tablette et mobile en sont déduites.
export const defaultPages = () => [
  createPage({
    id: 'home', title: "Vue d'ensemble", icon: 'home', period: 'month',
    widgets: [
      { type: 'chart', config: { metric: 'revenue', chartType: 'area', period: 'page', showTotal: true }, x: 0, y: 0, w: 8, h: 9 },
      { type: 'metric', config: { metric: 'orders', tint: 'purple' }, x: 8, y: 0, w: 4, h: 3 },
      { type: 'metric', config: { metric: 'basket', tint: 'pink' }, x: 8, y: 3, w: 4, h: 3 },
      { type: 'metric', config: { metric: 'newCustomers', tint: 'emerald' }, x: 8, y: 6, w: 4, h: 3 },
      { type: 'top-products', config: { count: 3, by: 'revenue', period: 'page' }, x: 0, y: 9, w: 12, h: 11 },
      { type: 'channels', config: { metric: 'revenue', style: 'donut', period: 'page' }, x: 0, y: 20, w: 5, h: 9 },
      { type: 'recent-orders', config: { count: 5, status: 'all', channel: 'all', period: 'all' }, x: 5, y: 20, w: 7, h: 9 },
    ],
  }),
  createPage({
    id: 'orders', title: 'Commandes', icon: 'cart', period: 'all',
    widgets: [
      { type: 'quick-actions', config: { actions: ['order', 'product', 'customer'] }, x: 0, y: 0, w: 12, h: 3 },
      { type: 'activity-calendar', config: { weeks: 26, channel: 'all' }, x: 0, y: 3, w: 12, h: 9 },
      { type: 'orders-table', config: { showSearch: true, showFilters: true, period: 'all' }, x: 0, y: 12, w: 12, h: 20 },
    ],
  }),
  createPage({
    id: 'products', title: 'Produits', icon: 'palette', period: 'all',
    widgets: [
      { type: 'top-products', config: { count: 5, by: 'revenue', period: 'all' }, x: 0, y: 0, w: 12, h: 12 },
      { type: 'products-catalog', config: { view: 'grid' }, x: 0, y: 12, w: 12, h: 26 },
    ],
  }),
  createPage({
    id: 'customers', title: 'Clients', icon: 'users', period: 'all',
    widgets: [
      { type: 'top-customers', config: { count: 5, by: 'total', period: 'page' }, x: 0, y: 0, w: 12, h: 10 },
      { type: 'customers-list', config: {}, x: 0, y: 10, w: 12, h: 22 },
    ],
  }),
  createPage({
    id: 'reports', title: 'Rapports', icon: 'chart', period: 'all',
    widgets: [
      { type: 'metric', config: { metric: 'revenue', tint: 'pink', compare: true }, x: 0, y: 0, w: 3, h: 4 },
      { type: 'metric', config: { metric: 'orders', tint: 'purple', compare: true }, x: 3, y: 0, w: 3, h: 4 },
      { type: 'metric', config: { metric: 'customers', tint: 'amber', compare: true }, x: 6, y: 0, w: 3, h: 4 },
      { type: 'metric', config: { metric: 'basket', tint: 'emerald', compare: true }, x: 9, y: 0, w: 3, h: 4 },
      { type: 'chart', config: { metric: 'revenue', chartType: 'bar', period: 'page', showTotal: true, cumulative: false }, x: 0, y: 4, w: 12, h: 10 },
      { type: 'channels', config: { metric: 'revenue', style: 'bars', period: 'page' }, x: 0, y: 14, w: 5, h: 9 },
      { type: 'weekdays', config: { period: 'page' }, x: 5, y: 14, w: 7, h: 9 },
      { type: 'report-customers', config: { period: 'page' }, x: 0, y: 23, w: 6, h: 20 },
      { type: 'report-products', config: { period: 'page' }, x: 6, y: 23, w: 6, h: 20 },
    ],
  }),
];

export const defaultWorkspace = () => ({ version: WORKSPACE_VERSION, updatedAt: 0, pages: defaultPages() });
