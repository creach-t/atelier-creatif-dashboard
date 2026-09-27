import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AutocompleteField } from '../ui/AutocompleteField';

const emptyItem = () => ({ name: '', quantity: 1, price: 0 });

const defaultStatusFor = (channel) => (channel === 'reel' ? 'delivered' : 'pending');

const MAX_SUGGESTIONS = 8;

const FIELD_CLASS = 'w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400';
const ITEM_FIELD_CLASS = 'w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400';

export const OrderForm = ({ products, customers, createProduct, onCreate, onClose }) => {
  const [channel, setChannel] = useState('reel');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(defaultStatusFor('reel'));
  const [items, setItems] = useState([emptyItem()]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);

  const productSuggestions = (name) => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => p.name.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  };

  const customerSuggestions = (() => {
    const q = customerName.trim().toLowerCase();
    if (!q) return [];
    return (customers || []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  })();

  const handleChannelChange = (value) => {
    setChannel(value);
    setStatus(defaultStatusFor(value));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const selectProduct = (index, product) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { name: product.name, quantity: item.quantity || 1, price: Number(product.price) || 0 } : item))
    );
  };

  const selectCustomer = (customer) => {
    setCustomerName(customer.name);
    setCustomerEmail(customer.email || '');
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Le client est obligatoire.');
      return;
    }

    const cleanItems = items
      .filter((item) => item.name.trim())
      .map((item) => ({ name: item.name.trim(), quantity: Number(item.quantity) || 1, price: Number(item.price) || 0 }));

    if (cleanItems.length === 0) {
      setError('Ajoute au moins un article.');
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

      // Un client sans correspondance existante est créé automatiquement côté serveur
      // (voir api/lib/customerSync.js) dès que customer_name est renseigné.
      const matchedCustomer = (customers || []).find((c) => c.name.toLowerCase() === customerName.trim().toLowerCase());

      await onCreate({
        channel,
        customer_name: customerName.trim(),
        customer_email: (matchedCustomer && matchedCustomer.email) || customerEmail.trim() || null,
        items: cleanItems,
        total,
        status,
        order_date: orderDate,
        notes: notes.trim() || null,
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <AutocompleteField
              value={customerName}
              onChange={(value) => {
                setCustomerName(value);
                setCustomerEmail('');
              }}
              onSelect={selectCustomer}
              suggestions={customerSuggestions}
              getKey={(c) => c.id}
              renderOption={(c) => (
                <>
                  <span className="truncate">{c.name}</span>
                  {c.email && <span className="text-gray-500 shrink-0 ml-2 text-xs">{c.email}</span>}
                </>
              )}
              newLabel="Nouveau client — sera ajouté au carnet"
              placeholder="Nom du client"
              required
              inputClassName={FIELD_CLASS}
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
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                  <AutocompleteField
                    className="flex-1 min-w-0"
                    value={item.name}
                    onChange={(value) => updateItem(index, 'name', value)}
                    onSelect={(product) => selectProduct(index, product)}
                    suggestions={productSuggestions(item.name)}
                    getKey={(p) => p.id}
                    renderOption={(p) => (
                      <>
                        <span className="truncate">{p.name}</span>
                        <span className="text-gray-500 shrink-0 ml-2">{Number(p.price).toFixed(2)}€</span>
                      </>
                    )}
                    newLabel="Nouveau produit — sera ajouté au catalogue"
                    placeholder="Nom de l'article (recherche le catalogue)"
                    inputClassName={ITEM_FIELD_CLASS}
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
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="pending">En attente</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex : emballage cadeau, demande particulière..."
              className={FIELD_CLASS}
            />
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
