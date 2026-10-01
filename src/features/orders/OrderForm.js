import React, { useMemo, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { AutocompleteField } from '../../ui/AutocompleteField';
import { ChannelLogo } from '../../ui/ChannelBadge';
import { FIELD_CLASS } from '../../ui/fieldClasses';
import { ORDER_STATUSES, STATUS_LABELS, defaultStatusFor, DEFAULT_PRODUCT_IMAGE, UNCATEGORIZED } from '../../domain/constants';
import { OrderItemsEditor } from './OrderItemsEditor';
import { OrderExtrasEditor } from './OrderExtrasEditor';
import { OrderTotals } from './OrderTotals';
import {
  initialDraft, orderTotals, validateDraft, newProducts, cleanItems,
  buildCreatePayload, buildUpdateChanges, rememberCommission,
} from './orderDraft';

const MAX_SUGGESTIONS = 8;

const ChannelButton = ({ channel, label, active, activeClass, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium ${active ? activeClass : 'border-gray-200 text-gray-600'}`}
  >
    <ChannelLogo channel={channel} size={15} className="inline mr-1.5 -mt-0.5" />{label}
  </button>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

// Création d'une commande, ou modification complète d'une commande existante (prop `order`).
// L'état saisi vit dans un brouillon (voir orderDraft.js) ; en modification, seuls les champs réellement changés sont envoyés.
export const OrderForm = ({ order, products, customers, createProduct, onCreate, onUpdate, onClose }) => {
  const isEditing = Boolean(order);
  const [draft, setDraft] = useState(() => initialDraft(order, products));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (changes) => setDraft((d) => ({ ...d, ...changes }));
  // Les lignes, le divers et l'écart sont marqués « touchés » : seuls eux réécrivent le total d'une commande existante.
  const setTouched = (key, changes) => setDraft((d) => ({ ...d, ...changes, touched: { ...d.touched, [key]: true } }));

  const totals = useMemo(() => orderTotals(draft), [draft]);

  const customerSuggestions = useMemo(() => {
    const q = draft.customerName.trim().toLowerCase();
    if (!q) return [];
    return (customers || []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  }, [customers, draft.customerName]);

  const changeChannel = (channel) => set({ channel, ...(!isEditing && { status: defaultStatusFor(channel) }) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const invalid = validateDraft(draft, { isEditing });
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    try {
      // Un article sans correspondance dans le catalogue devient un nouveau produit (catégorie à préciser plus tard).
      // Best effort : si la création échoue, la commande est quand même enregistrée.
      if (createProduct) {
        await Promise.all(
          newProducts(cleanItems(draft.items), products).map((item) =>
            createProduct({ name: item.name, category: UNCATEGORIZED, price: item.price, image: DEFAULT_PRODUCT_IMAGE }).catch(() => {})
          )
        );
      }

      // Un client sans correspondance existante est créé automatiquement côté serveur
      // (voir api/lib/customerSync.js) dès que customer_name est renseigné.
      const name = draft.customerName.trim().toLowerCase();
      const matched = (customers || []).find((c) => c.name.toLowerCase() === name);
      const email = draft.customerEmail.trim() || (matched && matched.email) || null;

      if (isEditing) {
        const changes = buildUpdateChanges(order, draft, email);
        if (Object.keys(changes).length > 0) await onUpdate(order.id, changes);
      } else {
        await onCreate(buildCreatePayload(draft, email));
        if (totals.commissionRate > 0) rememberCommission(totals.commissionRate);
      }
      onClose();
    } catch (err) {
      setError(err.message || (isEditing ? 'Impossible de modifier la commande.' : 'Impossible de créer la commande.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Modifier la commande' : 'Nouvelle commande'} onClose={onClose} dismissOnBackdrop={false}>
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
          <div className="flex gap-2">
            <ChannelButton channel="reel" label="Point de vente" active={draft.channel === 'reel'} activeClass="bg-pink-50 border-pink-300 text-pink-800" onClick={() => changeChannel('reel')} />
            <ChannelButton channel="kofi" label="Ko-fi (manuel)" active={draft.channel === 'kofi'} activeClass="bg-purple-50 border-purple-300 text-purple-800" onClick={() => changeChannel('kofi')} />
          </div>
        </div>

        <Field label="Client">
          <AutocompleteField
            value={draft.customerName}
            onChange={(customerName) => set({ customerName, ...(!isEditing && { customerEmail: '' }) })}
            onSelect={(customer) => set({ customerName: customer.name, customerEmail: customer.email || '' })}
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
          <input
            type="email"
            value={draft.customerEmail}
            onChange={(e) => set({ customerEmail: e.target.value })}
            placeholder="Email du client (optionnel)"
            className={`${FIELD_CLASS} mt-2`}
          />
        </Field>

        <OrderItemsEditor
          items={draft.items}
          products={products}
          canRemoveLast={draft.extras.length > 0}
          onChange={(items) => setTouched('items', { items })}
        />

        <OrderExtrasEditor extras={draft.extras} onChange={(extras) => setTouched('extras', { extras })} />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <input type="date" value={draft.orderDate} onChange={(e) => set({ orderDate: e.target.value })} className={FIELD_CLASS} />
          </Field>
          <Field label="Statut">
            <select value={draft.status} onChange={(e) => set({ status: e.target.value })} className={FIELD_CLASS}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
        </div>

        {draft.channel === 'reel' && (
          <div>
            <Field label="Commission de la boutique (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={draft.commission}
                onChange={(e) => set({ commission: e.target.value })}
                placeholder="Ex : 30"
                className={FIELD_CLASS}
              />
            </Field>
            <p className="text-xs text-gray-500 mt-1">Déduite automatiquement : tes revenus comptent le net. Préremplie avec la dernière utilisée.</p>
          </div>
        )}

        <Field label="N° de suivi (optionnel)">
          <input type="text" value={draft.tracking} onChange={(e) => set({ tracking: e.target.value })} placeholder="Numéro de suivi du colis" className={FIELD_CLASS} />
        </Field>

        <Field label="Notes (optionnel)">
          <textarea value={draft.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} placeholder="Ex : emballage cadeau, demande particulière..." className={FIELD_CLASS} />
        </Field>

        <OrderTotals gap={draft.gap} undetailed={draft.undetailed} totals={totals} onRemoveGap={() => setTouched('gap', { gap: 0 })} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full justify-center" disabled={submitting}>
          {submitting ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer la commande'}
        </Button>
      </form>
    </Modal>
  );
};
