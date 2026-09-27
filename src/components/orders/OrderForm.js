import React, { useState } from 'react';
import { Plus, Trash2, X, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const emptyItem = () => ({ name: '', quantity: 1, price: 0 });

const defaultStatusFor = (channel) => (channel === 'reel' ? 'delivered' : 'pending');

const MAX_SUGGESTIONS = 8;

export const OrderForm = ({ products, createProduct, onCreate, onClose }) => {
  const [channel, setChannel] = useState('reel');
  const [customerName, setCustomerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(defaultStatusFor('reel'));
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(null);

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);

  const suggestionsFor = (name) => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => p.name.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  };

  const handleChannelChange = (value) => {
    setChannel(value);
    setStatus(defaultStatusFor(value));
    if (value !== 'reel') setShopName('');
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const selectSuggestion = (index, product) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { name: product.name, quantity: item.quantity || 1, price: Number(product.price) || 0 } : item))
    );
    setActiveSuggestIndex(null);
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
      // Un article sans correspondance dans le catalogue devient un nouveau produit
      // (catégorie à préciser plus tard), plutôt que de rester une simple ligne de commande.
      const existingNames = new Set((products || []).map((p) => p.name.toLowerCase()));
      const newProductNames = [...new Set(cleanItems.filter((i) => !existingNames.has(i.name.toLowerCase())).map((i) => i.name))];
      if (newProductNames.length > 0 && createProduct) {
        await Promise.all(
          newProductNames.map((name) => {
            const item = cleanItems.find((i) => i.name === name);
            return createProduct({ name, category: 'Sans catégorie', price: item.price, image: '🎁' }).catch(() => {});
          })
        );
      }

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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Articles</label>
              <button type="button" onClick={addItem} className="text-sm text-purple-600 font-medium flex items-center gap-1">
                <Plus size={14} /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => {
                const suggestions = suggestionsFor(item.name);
                const showDropdown = activeSuggestIndex === index && item.name.trim();
                return (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Nom de l'article (recherche le catalogue)"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        onFocus={() => setActiveSuggestIndex(index)}
                        onBlur={() => setTimeout(() => setActiveSuggestIndex((v) => (v === index ? null : v)), 150)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      {showDropdown && (
                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.length > 0 ? (
                            suggestions.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectSuggestion(index, p);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-purple-50 text-left"
                              >
                                <span className="truncate">{p.name}</span>
                                <span className="text-gray-500 shrink-0 ml-2">{Number(p.price).toFixed(2)}€</span>
                              </button>
                            ))
                          ) : (
                            <p className="flex items-center gap-1.5 px-3 py-2 text-xs text-purple-600">
                              <Sparkles size={12} />
                              Nouveau produit — sera ajouté au catalogue
                            </p>
                          )}
                        </div>
                      )}
                    </div>
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
                );
              })}
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
