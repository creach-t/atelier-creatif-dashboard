import React, { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { DEFAULT_PRODUCT_IMAGE } from '../../domain/constants';
import { parseKofiProductUrl } from '../../utils/kofiUrl';
import { isValidProductImage } from '../../utils/productImage';
import { fetchKofiPreview } from '../../services/productService';
import { ImagePicker } from './ImagePicker';
import { KofiChanges } from './KofiChanges';
import { planKofiSync, defaultSelection, applyChanges, describeKofiError } from './kofiSyncPlan';

const emptyProduct = { name: '', category: '', price: '', image: DEFAULT_PRODUCT_IMAGE, kofi_url: '', is_free: false, kind: '' };

const KIND_OPTIONS = [
  { id: '', label: 'Non précisé' },
  { id: 'physical', label: 'Physique' },
  { id: 'digital', label: 'Numérique' },
];

export const ProductForm = ({ product, onSave, onClose, supportsFlags = true }) => {
  const isEditing = Boolean(product);
  const [form, setForm] = useState(
    product
      ? {
          name: product.name || '',
          category: product.category || '',
          price: String(product.price ?? ''),
          image: product.image || DEFAULT_PRODUCT_IMAGE,
          kofi_url: product.kofi_url || '',
          is_free: Boolean(product.is_free),
          kind: product.kind || '',
        }
      : emptyProduct
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Resynchronisation Ko-fi en cours de relecture : { changes, selected, preview } — rien n'est appliqué avant confirmation.
  const [sync, setSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const canResync = Boolean(parseKofiProductUrl(form.kofi_url));

  // Aperçu reçu de Ko-fi (lien collé dans le sélecteur d'image, ou bouton « Resynchroniser ») : on compare aux valeurs
  // en cours de saisie et on propose les différences ; l'utilisatrice coche ce qu'elle veut appliquer.
  const handlePreview = (preview) => {
    setSyncError(null);
    const current = { name: form.name, price: form.is_free ? 0 : Number(form.price) || 0, image: form.image, is_free: form.is_free, price_estimated: product && product.price_estimated };
    const changes = planKofiSync(current, preview, { renameable: !isEditing });
    // Le lien collé est celui que l'utilisatrice vient de choisir : on le retient (forme canonique reconstruite par le serveur).
    setForm((f) => ({ ...f, kofi_url: preview.kofi_url || f.kofi_url }));
    setSync({ changes, selected: defaultSelection(changes), preview });
  };

  const resync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSync(null);
    try {
      handlePreview(await fetchKofiPreview(form.kofi_url.trim()));
    } catch (err) {
      setSyncError(describeKofiError(err));
    } finally {
      setSyncing(false);
    }
  };

  const toggle = (field) => setSync((s) => {
    const selected = new Set(s.selected);
    if (selected.has(field)) selected.delete(field); else selected.add(field);
    return { ...s, selected };
  });

  const applySync = () => {
    const patch = applyChanges(sync.changes, sync.selected, { is_free: form.is_free });
    setForm((f) => ({
      ...f,
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.price !== undefined && { price: String(patch.price) }),
      ...(patch.is_free !== undefined && { is_free: patch.is_free }),
      ...(patch.image !== undefined && { image: patch.image }),
    }));
    setSync(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.category.trim()) {
      setError('Le nom et la catégorie sont obligatoires.');
      return;
    }
    const image = form.image.trim() || DEFAULT_PRODUCT_IMAGE;
    if (!isValidProductImage(image)) {
      setError("L'image doit être un emoji ou une adresse https://.");
      return;
    }
    if (form.kofi_url.trim() && !/^https:\/\//i.test(form.kofi_url.trim())) {
      setError('Le lien Ko-fi doit commencer par https://');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: form.is_free ? 0 : Number(form.price) || 0,
      kofi_url: form.kofi_url.trim() || null,
    };
    // En modification, l'image n'est envoyée que si elle a changé : un produit ancien garde sa valeur d'origine telle quelle.
    if (!isEditing || image !== (product.image || DEFAULT_PRODUCT_IMAGE)) payload.image = image;
    if (supportsFlags) {
      payload.is_free = form.is_free;
      payload.kind = form.kind || null;
    }

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

  const inputClass = 'w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400';

  return (
    <Modal title={isEditing ? 'Modifier le produit' : 'Nouveau produit'} onClose={onClose} maxWidth="max-w-md" dismissOnBackdrop={false}>
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
          <ImagePicker
            image={form.image}
            kofiUrl={form.kofi_url}
            onChange={(image) => setForm((f) => ({ ...f, image }))}
            onKofiPreview={handlePreview}
          />
        </div>

        {sync && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3 space-y-3" role="region" aria-label="Données trouvées sur Ko-fi">
            <p className="text-sm font-semibold text-gray-800">Trouvé sur Ko-fi{sync.preview.name ? ` : « ${sync.preview.name} »` : ''}</p>
            {sync.changes.length === 0 ? (
              <p className="text-sm text-gray-600">Rien à changer : le produit est déjà à jour.</p>
            ) : (
              <KofiChanges changes={sync.changes} selected={sync.selected} onToggle={toggle} />
            )}
            <div className="flex gap-2">
              {sync.changes.length > 0 && (
                <button type="button" onClick={applySync} disabled={sync.selected.size === 0} className="flex-1 px-3 py-2 text-sm font-medium rounded-xl bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50">
                  Appliquer la sélection
                </button>
              )}
              <button type="button" onClick={() => setSync(null)} className="flex-1 px-3 py-2 text-sm font-medium rounded-xl bg-white border border-purple-200 text-gray-700 hover:bg-purple-50">
                {sync.changes.length > 0 ? 'Ignorer' : 'Fermer'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Rien n'est enregistré avant « {isEditing ? 'Enregistrer' : 'Créer le produit'} ».</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="Nom du produit" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <input type="text" value={form.category} onChange={set('category')} placeholder="Ex: Stickers, Illustrations..." className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.is_free ? '0' : form.price}
            onChange={set('price')}
            disabled={form.is_free}
            className="w-full px-3 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
          {supportsFlags && (
            <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-400"
              />
              Produit gratuit (0 € voulu, pas un prix manquant)
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          {supportsFlags ? (
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border border-purple-200 bg-white">
              {KIND_OPTIONS.map((o) => (
                <button
                  key={o.id || 'none'}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kind: o.id }))}
                  aria-pressed={form.kind === o.id}
                  className={`px-1 py-2 text-xs font-medium rounded-lg transition-colors ${form.kind === o.id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Le type (physique / numérique) et « gratuit » demandent la migration 0007 dans Supabase.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lien Ko-fi (optionnel)</label>
          <input type="url" value={form.kofi_url} onChange={set('kofi_url')} placeholder="https://ko-fi.com/s/..." className={inputClass} />
          <p className="text-xs text-gray-500 mt-1">Laisse vide si le produit n'est plus en vente sur Ko-fi.</p>
          {canResync && (
            <button type="button" onClick={resync} disabled={syncing} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:underline disabled:opacity-60">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {syncing ? 'Lecture de Ko-fi…' : 'Resynchroniser depuis Ko-fi'}
            </button>
          )}
          {syncError && <p role="alert" className="text-xs text-red-600 mt-1">{syncError}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full justify-center" disabled={saving}>
          {saving ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer le produit'}
        </Button>
      </form>
    </Modal>
  );
};
