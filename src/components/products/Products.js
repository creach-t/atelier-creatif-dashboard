import React, { useState } from 'react';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const Products = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Catalogue Produits</h3>
        <Button>
          <Plus size={16} />
          Nouveau Produit
        </Button>
      </div>

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
            className="px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes catégories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="p-6" hover>
            <div className="text-center">
              <div className="text-4xl mb-4">{product.image}</div>
              <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{product.category}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-purple-600">{Number(product.price).toFixed(2)}€</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  product.stock <= product.min_stock
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  Stock: {product.stock}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Edit size={14} />
                  Modifier
                </Button>
                <Button variant="secondary" size="sm" className="flex-1">
                  <Eye size={14} />
                  Voir
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <p className="text-sm text-gray-500 col-span-full text-center py-6">Aucun produit trouvé.</p>
        )}
      </div>
    </div>
  );
};
