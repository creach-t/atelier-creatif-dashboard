import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProductThumbnail } from '../ui/ProductThumbnail';

const emptyProduct = { name: '', category: '', price: '', image: '🎁', kofi_url: '' };

export const ProductForm = ({ product, initialName, onSave, onClose }) => {
  const isEditing = Boolean(product);
  const [form, setForm] = useState(
    product
      ? {
          name: product.name || '',
          category: product.category || '',
          price: String(product.price ?? ''),
          image: product.image || '🎁',
          kofi_url: product.kofi_url || '',
        }
      : { ...emptyProduct, name: initialName || '' }
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.category.trim()) {
      setError('Le nom et la catégorie sont obligatoires.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price) || 0,
      image: form.image.trim() || '🎁',
      kofi_url: form.kofi_url.trim() || null,
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-20 shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
              {form.image.startsWith('http') ? (
                <div>
                  <ProductThumbnail image={form.image} className="!w-12 !h-12" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image: '🎁' }))}
                    className="text-[10px] text-purple-600 hover:underline mt-1 w-full text-center"
                  >
                    Retirer la photo
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={form.image}
                  onChange={set('image')}
                  maxLength={4}
                  className="w-full px-3 py-2 border border-purple-200 rounded-xl text-center text-2xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Nom du produit"
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <input
              type="text"
              value={form.category}
              onChange={set('category')}
              placeholder="Ex: Stickers, Illustrations..."
              className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
              className="w-full px-3 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien Ko-fi (optionnel)</label>
            <input
              type="url"
              value={form.kofi_url}
              onChange={set('kofi_url')}
              placeholder="https://ko-fi.com/s/..."
              className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <p className="text-xs text-gray-500 mt-1">Laisse vide si le produit n'est plus en vente sur Ko-fi.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full justify-center" disabled={saving}>
            {saving ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
