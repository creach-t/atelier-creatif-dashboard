import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Search, Edit, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProductForm } from './ProductForm';
import { ProductDetailModal } from './ProductDetailModal';
import { ProductThumbnail } from '../ui/ProductThumbnail';
import { computeSoldByName } from '../../utils/computeSoldByName';

const SORTS = {
  best_selling: { label: 'Plus vendus', fn: (a, b, sold) => (sold[b.name] || 0) - (sold[a.name] || 0) },
  least_selling: { label: 'Moins vendus', fn: (a, b, sold) => (sold[a.name] || 0) - (sold[b.name] || 0) },
  name: { label: 'Nom (A-Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  price_desc: { label: 'Prix décroissant', fn: (a, b) => Number(b.price) - Number(a.price) },
  price_asc: { label: 'Prix croissant', fn: (a, b) => Number(a.price) - Number(b.price) },
  newest: { label: 'Plus récents', fn: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) },
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg text-sm border border-purple-100 bg-white max-w-[220px]">
      <p className="text-xs font-semibold text-gray-500 truncate">{p.payload.name}</p>
      <p className="font-bold text-purple-600">{p.value} vendu{p.value > 1 ? 's' : ''}</p>
    </div>
  );
};

export const Products = ({
  products,
  orders,
  createProduct,
  updateProduct,
  selectedProductName,
  onClearSelectedProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortKey, setSortKey] = useState('best_selling');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);

  const soldByName = useMemo(() => computeSoldByName(orders), [orders]);

  const categories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => SORTS[sortKey].fn(a, b, soldByName));
  }, [products, searchTerm, categoryFilter, sortKey, soldByName]);

  const topProducts = useMemo(
    () =>
      [...products]
        .map((p) => ({ name: p.name, sold: soldByName[p.name] || 0 }))
        .filter((p) => p.sold > 0)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .reverse(),
    [products, soldByName]
  );

  const openCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setViewingProduct(null);
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await createProduct(payload);
    }
  };

  // Ouvre la fiche (vue) d'un produit sélectionné depuis le détail d'une commande ou le Dashboard —
  // la modification reste une étape volontaire supplémentaire, pas la conséquence directe du clic.
  useEffect(() => {
    if (!selectedProductName) return;
    const match = products.find((p) => p.name === selectedProductName);
    if (match) setViewingProduct(match);
    onClearSelectedProduct && onClearSelectedProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductName, products]);

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
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 des ventes</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, topProducts.length * 40)}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fill: '#4b5563', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(name) => (name.length > 22 ? `${name.slice(0, 22)}…` : name)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3e8ff' }} />
              <Bar dataKey="sold" radius={[0, 6, 6, 0]}>
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={i === topProducts.length - 1 ? '#fbbf24' : '#c4b5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
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
          <select
            className="w-full md:w-auto px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>Trier : {label}</option>
            ))}
          </select>
        </div>
      </Card>

      <p className="text-sm text-gray-500">
        <strong className="text-gray-900">{filteredProducts.length}</strong> produit{filteredProducts.length > 1 ? 's' : ''}
        {categoryFilter !== 'all' || searchTerm ? ` sur ${products.length}` : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const sold = soldByName[product.name] || 0;
          const hasPrice = Number(product.price) > 0;
          return (
            <Card key={product.id} className="p-6" hover>
              <button type="button" onClick={() => setViewingProduct(product)} className="w-full text-center">
                <ProductThumbnail image={product.image} className="mb-4" />
                <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{product.category}</p>
                <div className="flex items-center justify-between mb-4 gap-2">
                  {hasPrice ? (
                    <span className="text-lg font-bold text-purple-600">{Number(product.price).toFixed(2)}€</span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Prix à définir
                    </span>
                  )}
                  <span className="text-sm px-2 py-1 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap">
                    {sold} vendu{sold > 1 ? 's' : ''}
                  </span>
                </div>
              </button>
              {product.kofi_url && (
                <a
                  href={product.kofi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-xs text-purple-600 hover:underline mb-2"
                >
                  <ExternalLink size={12} />
                  Voir sur Ko-fi
                </a>
              )}
              <Button variant="ghost" size="sm" className="w-full" onClick={() => openEdit(product)}>
                <Edit size={14} />
                Modifier
              </Button>
            </Card>
          );
        })}
        {filteredProducts.length === 0 && (
          <p className="text-sm text-gray-500 col-span-full text-center py-6">Aucun produit trouvé.</p>
        )}
      </div>

      {viewingProduct && (
        <ProductDetailModal
          product={viewingProduct}
          sold={soldByName[viewingProduct.name] || 0}
          onEdit={() => openEdit(viewingProduct)}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
