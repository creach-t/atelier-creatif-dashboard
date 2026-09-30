import React, { useMemo, useState } from 'react';
import { Plus, LayoutGrid, List, Palette } from 'lucide-react';
import { defineWidget } from '../core/widgets/registry';
import { useData } from '../core/data/DataProvider';
import { useOverlays } from '../core/overlays/OverlayProvider';
import { ProductCard } from '../components/products/ProductCard';
import { ProductCover } from '../components/ui/ProductThumbnail';
import { GroupPrice } from '../components/ui/PriceTag';
import { SortHeader, SortChip } from '../components/ui/SortHeader';
import { useSort, sortRows } from '../hooks/useSort';
import { priceRange, groupKind } from '../utils/productVariants';
import { EmptyState, ScrollArea, SearchBox } from '../core/widgets/parts';

const SELECT = 'px-3 py-2.5 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400';

const CatalogView = ({ config, updateConfig }) => {
  const { products, productGroups: groups, soldByName, revenueByName } = useData();
  const { openProduct, newProduct } = useOverlays();
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [kind, setKind] = useState('all');
  const [sort, toggleSort] = useSort('sold', 'desc');
  const view = config.view;

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const supportsFlags = products.length === 0 || 'kind' in products[0];

  // Variantes regroupées : une carte par produit, ventes additionnées (le détail par variante est dans la fiche).
  const statsOf = useMemo(() => {
    const map = new Map();
    groups.forEach((g) => map.set(g.key, {
      sold: g.variants.reduce((s, v) => s + (soldByName[v.product.name] || 0), 0),
      revenue: g.variants.reduce((s, v) => s + (revenueByName[v.product.name] || 0), 0),
    }));
    return map;
  }, [groups, soldByName, revenueByName]);

  const rows = useMemo(() => {
    const q = term.toLowerCase();
    const visible = groups.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(q) || g.variants.some((v) => v.product.name.toLowerCase().includes(q));
      const matchesCategory = category === 'all' || g.variants.some((v) => v.product.category === category);
      const k = groupKind(g);
      return matchesSearch && matchesCategory && (kind === 'all' || k === kind || k === 'both');
    });
    return sortRows(visible, sort, {
      name: (g) => g.name,
      category: (g) => g.category,
      price: (g) => priceRange(g).min,
      sold: (g) => statsOf.get(g.key).sold,
      revenue: (g) => statsOf.get(g.key).revenue,
      created: (g) => g.variants.map((v) => v.product.created_at || '').sort().pop(),
    });
  }, [groups, term, category, kind, sort, statsOf]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-4 pt-2 pb-3 space-y-3 shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 min-w-0"><SearchBox value={term} onChange={setTerm} placeholder="Rechercher un produit…" /></div>
          <button onClick={newProduct} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl shrink-0">
            <Plus size={16} /><span className="hidden @md:inline">Nouveau produit</span><span className="@md:hidden">Nouveau</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={SELECT} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Catégorie">
            <option value="all">Toutes catégories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {supportsFlags && (
            <select className={SELECT} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
              <option value="all">Tous types</option>
              <option value="physical">Physiques</option>
              <option value="digital">Numériques</option>
            </select>
          )}
          <div className="flex rounded-xl border border-purple-200 bg-white p-1 ml-auto">
            {[{ id: 'grid', label: 'Grille', Icon: LayoutGrid }, { id: 'list', label: 'Liste', Icon: List }].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateConfig({ view: id })}
                aria-pressed={view === id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
              >
                <Icon size={15} /><span className="hidden @md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        {view === 'grid' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Trier</span>
            <SortChip label="Vendus" sortKey="sold" firstDir="desc" sort={sort} onSort={toggleSort} />
            <SortChip label="Revenu" sortKey="revenue" firstDir="desc" sort={sort} onSort={toggleSort} />
            <SortChip label="Prix" sortKey="price" sort={sort} onSort={toggleSort} />
            <SortChip label="Nom" sortKey="name" sort={sort} onSort={toggleSort} />
            <SortChip label="Récents" sortKey="created" firstDir="desc" sort={sort} onSort={toggleSort} />
          </div>
        )}
        <p className="text-sm text-gray-500">
          <strong className="text-gray-900">{rows.length}</strong> produit{rows.length > 1 ? 's' : ''}
          {category !== 'all' || term ? ` sur ${groups.length}` : ''}
        </p>
      </div>

      {rows.length === 0 && <EmptyState icon={Palette}>Aucun produit trouvé.</EmptyState>}

      {rows.length > 0 && view === 'grid' && (
        <ScrollArea className="px-4 pb-4">
          {/* auto-fill : le nombre de colonnes suit la largeur du widget, pas celle de l'écran. */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(8.5rem, 1fr))' }}>
            {rows.map((group) => {
              const { sold, revenue } = statsOf.get(group.key);
              return <ProductCard key={group.key} group={group} sold={sold} revenue={revenue} onClick={() => openProduct(group.variants[0].product.name)} />;
            })}
          </div>
        </ScrollArea>
      )}

      {rows.length > 0 && view === 'list' && (
        <ScrollArea>
          <table className="w-full">
            <thead className="bg-purple-50/60 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-2.5"><SortHeader label="Produit" sortKey="name" sort={sort} onSort={toggleSort} /></th>
                <th className="text-left px-4 py-2.5 hidden @lg:table-cell"><SortHeader label="Catégorie" sortKey="category" sort={sort} onSort={toggleSort} /></th>
                <th className="text-left px-4 py-2.5"><SortHeader label="Prix" sortKey="price" sort={sort} onSort={toggleSort} /></th>
                <th className="text-left px-4 py-2.5"><SortHeader label="Vendus" sortKey="sold" firstDir="desc" sort={sort} onSort={toggleSort} /></th>
                <th className="text-left px-4 py-2.5 hidden @md:table-cell"><SortHeader label="Revenu" sortKey="revenue" firstDir="desc" sort={sort} onSort={toggleSort} /></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((group) => {
                const { sold, revenue } = statsOf.get(group.key);
                return (
                  <tr key={group.key} onClick={() => openProduct(group.variants[0].product.name)} className="border-t border-purple-50 hover:bg-purple-25 cursor-pointer transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 shrink-0"><ProductCover image={group.image} rounded="rounded-lg" /></div>
                        <div className="min-w-0">
                          <span className="block font-medium text-gray-900 break-words max-w-[16rem]">{group.name}</span>
                          {group.isFamily && <span className="text-xs text-purple-600">{group.variants.length} variantes</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden @lg:table-cell text-sm text-gray-600">{group.category}</td>
                    <td className="px-4 py-2.5"><GroupPrice group={group} compact /></td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">{sold}</td>
                    <td className="px-4 py-2.5 hidden @md:table-cell text-sm font-semibold text-gray-900">{revenue > 0 ? `${revenue.toFixed(2)}€` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
};

defineWidget({
  type: 'products-catalog',
  title: 'Catalogue produits',
  description: 'Tous vos produits en grille ou en liste, avec recherche, filtres et tri.',
  icon: Palette,
  category: 'Produits',
  bleed: true,
  size: { w: 12, h: 26, minW: 4, minH: 9, maxW: 12, maxH: 44 },
  defaultConfig: { view: 'grid' },
  schema: [{ key: 'view', label: 'Affichage par défaut', type: 'select', options: [{ value: 'grid', label: 'Grille' }, { value: 'list', label: 'Liste' }] }],
  component: CatalogView,
});
