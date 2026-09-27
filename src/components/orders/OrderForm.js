import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X, Search, Library } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const emptyItem = () => ({ name: '', quantity: 1, price: 0 });

const defaultStatusFor = (channel) => (channel === 'reel' ? 'delivered' : 'pending');

export const OrderForm = ({ products, onCreate, onRequestCreateProduct, onClose }) => {
  const [channel, setChannel] = useState('reel');
  const [customerName, setCustomerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(defaultStatusFor('reel'));
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);

  const filteredCatalog = useMemo(
    () => (products || []).filter((p) => p.name.toLowerCase().includes(catalogSearch.toLowerCase())),
    [products, catalogSearch]
  );

  const addFromCatalog = (product) => {
    setItems((prev) => {
      const isOnlyEmptyRow = prev.length === 1 && !prev[0].name.trim();
      const newItem = { name: product.name, quantity: 1, price: Number(product.price) || 0 };
      return isOnlyEmptyRow ? [newItem] : [...prev, newItem];
    });
    setCatalogSearch('');
  };

  const handleCreateProduct = () => {
    onRequestCreateProduct && onRequestCreateProduct(catalogSearch.trim());
  };

  const handleChannelChange = (value) => {
    setChannel(value);
    setStatus(defaultStatusFor(value));
    if (value !== 'reel') setShopName('');
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanItems = items
      .filter((item) => item.name.trim())
      .map((item) => ({ name: item.name.trim(), quantity: Number(item.quantity) || 1, price: Number(item.price) || 0 }));

    if (cleanItems.length === 0) {
      setError('Ajoute au moins un article.');
      return;
    }
    if (channel === 'reel' && !shopName.trim()) {
      setError('Indique la boutique partenaire pour une vente Reel.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        channel,
        customer_name: customerName.trim() || null,
        shop_name: channel === 'reel' ? shopName.trim() : null,
        items: cleanItems,
        total,
        status,
        order_date: orderDate,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Impossible de créer la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900">Nouvelle Commande</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChannelChange('reel')}
                className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium ${
                  channel === 'reel' ? 'bg-pink-50 border-pink-300 text-pink-800' : 'border-gray-200 text-gray-600'
                }`}
              >
                🏪 Reel (boutique)
              </button>
              <button
                type="button"
                onClick={() => handleChannelChange('kofi')}
                className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium ${
                  channel === 'kofi' ? 'bg-purple-50 border-purple-300 text-purple-800' : 'border-gray-200 text-gray-600'
                }`}
              >
                💜 Ko-fi (manuel)
              </button>
            </div>
          </div>

          {channel === 'reel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Boutique partenaire</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Nom de la boutique"
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client (optionnel)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nom du client"
              className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="block text-sm font-medium text-gray-700">Articles</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatalogPicker((v) => !v)}
                  className="text-sm text-purple-600 font-medium flex items-center gap-1"
                >
                  <Library size={14} /> Depuis le catalogue
                </button>
                <button type="button" onClick={addItem} className="text-sm text-purple-600 font-medium flex items-center gap-1">
                  <Plus size={14} /> Article libre
                </button>
              </div>
            </div>

            {showCatalogPicker && (
              <div className="mb-3 p-3 border border-purple-200 rounded-xl bg-purple-25 space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Rechercher un produit du catalogue..."
                    className="w-full pl-9 pr-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                {filteredCatalog.length > 0 && (
                  <p className="text-[11px] text-gray-400 px-1">
                    {filteredCatalog.length} produit{filteredCatalog.length > 1 ? 's' : ''}
                  </p>
                )}
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredCatalog.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addFromCatalog(p)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-purple-100 text-left"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-gray-500 shrink-0 ml-2">{Number(p.price).toFixed(2)}€</span>
                    </button>
                  ))}
                  {filteredCatalog.length === 0 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 mb-2">
                        Aucun produit ne correspond{catalogSearch.trim() ? ` à « ${catalogSearch.trim()} »` : ''}.
                      </p>
                      {catalogSearch.trim() && onRequestCreateProduct && (
                        <button
                          type="button"
                          onClick={handleCreateProduct}
                          className="text-xs font-semibold text-purple-600 hover:underline"
                        >
                          Créer « {catalogSearch.trim()} » comme nouveau produit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                  <input
                    type="text"
                    placeholder="Nom de l'article"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-16 shrink-0 px-2 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Prix"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                      className="flex-1 sm:flex-none sm:w-20 min-w-0 px-2 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="pending">En attente</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-purple-100">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900">{total.toFixed(2)}€</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full justify-center" disabled={submitting}>
            {submitting ? 'Création...' : 'Créer la commande'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
