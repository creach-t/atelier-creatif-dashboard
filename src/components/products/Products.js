import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProductForm } from './ProductForm';
import { ProductCover } from '../ui/ProductThumbnail';
import { ProductCard } from './ProductCard';
import { TopProducts } from './TopProducts';
import { GroupPrice } from '../ui/PriceTag';
import { groupProducts, priceRange, groupKind } from '../../utils/productVariants';
import { computeSoldByName } from '../../utils/computeSoldByName';
import { computeProductRevenue } from '../../utils/computeProductRevenue';
import { catalogPrices } from '../../utils/estimatePrices';
import { useSort, sortRows } from '../../hooks/useSort';
import { SortHeader, SortChip } from '../ui/SortHeader';

export const Products = ({
  products,
  orders,
  createProduct,
  updateProduct,
  onViewProduct,
  editProductName,
  onClearEditProductName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, toggleSort] = useSort('sold', 'desc');
  const [view, setView] = useState('grid');
  const [kindFilter, setKindFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const soldByName = useMemo(() => computeSoldByName(orders), [orders]);
  // Revenu par produit au prix connu (saisi ou estimé) — le surplus / don n'est attribué à aucun produit.
  const revenueByName = useMemo(
    () => Object.fromEntries(computeProductRevenue(orders, catalogPrices(products)).map((r) => [r.name, r.revenue])),
    [orders, products]
  );

  const categories = [...new Set(products.map((p) => p.category))];

  // Une carte par produit : les variantes sont regroupées, leurs ventes additionnées (le détail par
  // variante est dans la fiche).
  const groups = useMemo(() => groupProducts(products), [products]);
  const statsOf = useMemo(() => {
    const map = new Map();
    groups.forEach((g) => {
      map.set(g.key, {
        sold: g.variants.reduce((s, v) => s + (soldByName[v.product.name] || 0), 0),
        revenue: g.variants.reduce((s, v) => s + (revenueByName[v.product.name] || 0), 0),
      });
    });
    return map;
  }, [groups, soldByName, revenueByName]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const visible = groups.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(term) || g.variants.some((v) => v.product.name.toLowerCase().includes(term));
      const matchesCategory = categoryFilter === 'all' || g.variants.some((v) => v.product.category === categoryFilter);
      const kind = groupKind(g);
      const matchesKind = kindFilter === 'all' || kind === kindFilter || kind === 'both';
      return matchesSearch && matchesCategory && matchesKind;
    });
    return sortRows(visible, sort, {
      name: (g) => g.name,
      category: (g) => g.category,
      price: (g) => priceRange(g).min,
      sold: (g) => statsOf.get(g.key).sold,
      revenue: (g) => statsOf.get(g.key).revenue,
      created: (g) => g.variants.map((v) => v.product.created_at || '').sort().pop(),
    });
  }, [groups, searchTerm, categoryFilter, kindFilter, sort, statsOf]);

  // Top 5 « depuis toujours » : les produits (variantes additionnées) qui ont généré le plus de revenu.
  const topProducts = useMemo(
    () =>
      groups
        .map((g) => ({ group: g, ...statsOf.get(g.key) }))
        .filter((t) => t.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    [groups, statsOf]
  );

  const totalProductRevenue = useMemo(
    () => [...statsOf.values()].reduce((sum, s) => sum + s.revenue, 0),
    [statsOf]
  );

  // Les colonnes is_free / kind viennent de la migration 0007 : sans elle, on l'indique dans le formulaire.
  const supportsFlags = products.length === 0 || 'kind' in products[0];

  const openCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    if (editingProduct) {
      // Prix estimé laissé tel quel dans le formulaire : on ne le fige pas en prix saisi à la main.
      const untouchedEstimate = editingProduct.price_estimated && Number(payload.price) === Number(editingProduct.price);
      if (untouchedEstimate) {
        const { price, ...rest } = payload;
        await updateProduct(editingProduct.id, rest);
        return;
      }
      await updateProduct(editingProduct.id, payload);
    } else {
      await createProduct(payload);
    }
  };

  // Ouvre directement l'édition d'un produit demandée depuis la fiche (vue) globale —
  // cliquer "Modifier" là-bas nous amène ici et saute droit à l'édition.
  useEffect(() => {
    if (!editProductName) return;
    const match = products.find((p) => p.name === editProductName);
    if (match) {
      setEditingProduct(match);
      setShowForm(true);
    }
    onClearEditProductName && onClearEditProductName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProductName, products]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-gray-900">Catalogue Produits</h3>
        <Button onClick={openCreate} className="justify-center">
          <Plus size={16} />
          Nouveau Produit
        </Button>
      </div>

      {topProducts.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Top 5 des produits les plus rentables</h3>
            <span className="text-sm text-gray-500">depuis le début</span>
          </div>
          <TopProducts items={topProducts} totalRevenue={totalProductRevenue} onView={onViewProduct} />
        </section>
      )}

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full md:w-auto px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes catégories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {supportsFlags && (
            <select
              className="w-full md:w-auto px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
            >
              <option value="all">Physiques et numériques</option>
              <option value="physical">Physiques</option>
              <option value="digital">Numériques</option>
            </select>
          )}
          <div className="flex rounded-xl border border-purple-200 bg-white p-1 self-start md:self-auto shrink-0">
            {[
              { id: 'grid', label: 'Grille', Icon: LayoutGrid },
              { id: 'list', label: 'Liste', Icon: List },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  view === id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <p className="text-sm text-gray-500">
        <strong className="text-gray-900">{filteredGroups.length}</strong> produit{filteredGroups.length > 1 ? 's' : ''}
        {categoryFilter !== 'all' || searchTerm ? ` sur ${groups.length}` : ''}
      </p>

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

      {view === 'grid' && (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredGroups.map((group) => {
          const { sold, revenue } = statsOf.get(group.key);
          return (
            <ProductCard
              key={group.key}
              group={group}
              sold={sold}
              revenue={revenue}
              onClick={() => onViewProduct(group.variants[0].product.name)}
            />
          );
        })}
        {filteredGroups.length === 0 && (
          <p className="text-sm text-gray-500 col-span-full text-center py-6">Aucun produit trouvé.</p>
        )}
      </div>
      )}

      {view === 'list' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scroll-soft">
            <table className="w-full min-w-[32rem]">
              <thead className="bg-purple-50/60">
                <tr>
                  <th className="text-left px-4 py-2.5"><SortHeader label="Produit" sortKey="name" sort={sort} onSort={toggleSort} /></th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell"><SortHeader label="Catégorie" sortKey="category" sort={sort} onSort={toggleSort} /></th>
                  <th className="text-left px-4 py-2.5"><SortHeader label="Prix" sortKey="price" sort={sort} onSort={toggleSort} /></th>
                  <th className="text-left px-4 py-2.5"><SortHeader label="Vendus" sortKey="sold" firstDir="desc" sort={sort} onSort={toggleSort} /></th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell"><SortHeader label="Revenu" sortKey="revenue" firstDir="desc" sort={sort} onSort={toggleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => {
                  const { sold, revenue } = statsOf.get(group.key);
                  return (
                    <tr
                      key={group.key}
                      onClick={() => onViewProduct(group.variants[0].product.name)}
                      className="border-t border-purple-50 hover:bg-purple-25 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 shrink-0"><ProductCover image={group.image} rounded="rounded-lg" /></div>
                          <div className="min-w-0">
                            <span className="block font-medium text-gray-900 truncate max-w-[16rem]">{group.name}</span>
                            {group.isFamily && <span className="text-xs text-purple-600">{group.variants.length} variantes</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-sm text-gray-600">{group.category}</td>
                      <td className="px-4 py-2.5"><GroupPrice group={group} compact /></td>
                      <td className="px-4 py-2.5 text-sm text-gray-700">{sold}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell text-sm font-semibold text-gray-900">{revenue > 0 ? `${revenue.toFixed(2)}€` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === 'list' && filteredGroups.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6">Aucun produit trouvé.</p>
      )}

      {showForm && (
        <ProductForm
          supportsFlags={supportsFlags}
          product={editingProduct}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
