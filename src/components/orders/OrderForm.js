import React, { useMemo, useState } from 'react';
import { money } from '../../core/metrics/format';
import { round2 } from '../../utils/money';
import { ORDER_STATUSES, STATUS_LABELS, defaultStatusFor, DEFAULT_PRODUCT_IMAGE, UNCATEGORIZED } from '../../domain/constants';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AutocompleteField } from '../ui/AutocompleteField';
import { ChannelLogo } from '../ui/ChannelBadge';
import { describeOrder } from '../../utils/computeProductRevenue';
import { catalogPrices, estimatedNames } from '../../utils/estimatePrices';
import { extrasSum } from '../../utils/orderAmounts';
import { todayLocal } from '../../utils/dates';

const emptyItem = () => ({ name: '', quantity: 1, price: 0 });
const emptyExtra = () => ({ label: '', amount: '' });

// Dernière commission saisie, pour préremplir la suivante (la boutique garde en général le même taux).
const LAST_COMMISSION_KEY = 'cashly.lastCommission';
const readLastCommission = () => {
  try { return window.localStorage.getItem(LAST_COMMISSION_KEY) || ''; } catch (e) { return ''; }
};
const rememberCommission = (value) => {
  try { window.localStorage.setItem(LAST_COMMISSION_KEY, String(value)); } catch (e) { /* stockage indisponible */ }
};

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const MAX_SUGGESTIONS = 8;

const FIELD_CLASS = 'w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400';
const ITEM_FIELD_CLASS = 'w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400';

// Création d'une commande, ou modification complète d'une commande existante (prop `order`).
// En modification, seuls les champs réellement changés sont envoyés.
export const OrderForm = ({ order, products, customers, createProduct, onCreate, onUpdate, onClose }) => {
  const isEditing = Boolean(order);
  const [channel, setChannel] = useState(order ? order.channel : 'reel');
  const [customerName, setCustomerName] = useState(order ? order.customer_name || '' : '');
  const [customerEmail, setCustomerEmail] = useState(order ? order.customer_email || '' : '');
  const [orderDate, setOrderDate] = useState(order ? order.order_date : todayLocal());
  const [status, setStatus] = useState(order ? order.status : defaultStatusFor('reel'));
  // En modification, chaque article reprend son prix (saisi, catalogue, ou déduit du total). Ce qui reste
  // pour retomber sur le total enregistré (don / prix libre, remise, ou montant jamais détaillé) est conservé
  // à part dans `gap` : le total n'est jamais saisi, il se calcule toujours.
  const initial = useMemo(() => {
    if (!order) return { items: [emptyItem()], gap: 0 };
    const { lines } = describeOrder(order, catalogPrices(products), estimatedNames(products));
    const rows = lines.map((l) => ({ name: l.item.name, quantity: Number(l.item.quantity) || 1, price: round2(l.unit) }));
    const listed = rows.reduce((sum, r) => sum + r.quantity * r.price, 0);
    const gap = round2((Number(order.total) || 0) - listed - extrasSum(order));
    return { items: rows.length > 0 ? rows : [emptyItem()], gap: Math.abs(gap) < 0.03 ? 0 : gap, noItems: rows.length === 0 };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [items, setItems] = useState(initial.items);
  const [gap, setGap] = useState(initial.gap);
  // Ce que l'utilisateur a réellement touché : le reste de la commande n'est pas réécrit.
  const [touched, setTouched] = useState({ items: false, extras: false, gap: false });
  const touch = (key) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));
  const [notes, setNotes] = useState(order ? order.notes || '' : '');
  const [tracking, setTracking] = useState(order ? order.tracking || '' : '');
  const [extras, setExtras] = useState(() => (order && Array.isArray(order.extras) ? order.extras.map((e) => ({ label: e.label, amount: String(e.amount) })) : []));
  const [commission, setCommission] = useState(() => (order ? (order.commission_rate ? String(order.commission_rate) : '') : readLastCommission()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const extrasTotal = extras.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const total = round2(itemsTotal + extrasTotal + gap); // ce que le client paie (brut) : toujours calculé
  const commissionRate = channel === 'reel' ? Math.min(Math.max(Number(commission) || 0, 0), 100) : 0;
  const commissionAmount = Math.round(total * commissionRate) / 100;
  const net = total - commissionAmount;

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
    if (!isEditing) setStatus(defaultStatusFor(value));
  };

  const updateItem = (index, field, value) => {
    touch('items');
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const selectProduct = (index, product) => {
    touch('items');
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { name: product.name, quantity: item.quantity || 1, price: Number(product.price) || 0 } : item))
    );
  };

  const selectCustomer = (customer) => {
    setCustomerName(customer.name);
    setCustomerEmail(customer.email || '');
  };

  const addItem = () => { touch('items'); setItems((prev) => [...prev, emptyItem()]); };
  const removeItem = (index) => { touch('items'); setItems((prev) => prev.filter((_, i) => i !== index)); };

  const updateExtra = (index, field, value) => { touch('extras'); setExtras((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))); };
  const addExtra = () => { touch('extras'); setExtras((prev) => [...prev, emptyExtra()]); };
  const removeExtra = (index) => { touch('extras'); setExtras((prev) => prev.filter((_, i) => i !== index)); };
  const removeGap = () => { touch('gap'); setGap(0); };

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

    // Lignes « divers » : ne créent ni article ni produit, comptent seulement dans le total.
    const cleanExtras = extras
      .filter((e) => e.label.trim() && Number(e.amount))
      .map((e) => ({ label: e.label.trim(), amount: Number(e.amount) }));

    // Une ligne divers à moitié remplie n'est pas ignorée en silence : on demande de la compléter.
    if (extras.some((x) => (x.label.trim() && !Number(x.amount)) || (!x.label.trim() && Number(x.amount)))) {
      setError('Complète la ligne divers : il faut un libellé et un montant.');
      return;
    }
    // Une commande existante peut n'avoir jamais été détaillée (simple montant) : on peut la modifier quand même.
    if (!isEditing && cleanItems.length === 0 && cleanExtras.length === 0) {
      setError('Ajoute au moins un article ou une ligne divers.');
      return;
    }
    if (total < 0) {
      setError('Le total ne peut pas être négatif.');
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
            return createProduct({ name, category: UNCATEGORIZED, price: item.price, image: DEFAULT_PRODUCT_IMAGE }).catch(() => {});
          })
        );
      }

      // Un client sans correspondance existante est créé automatiquement côté serveur
      // (voir api/lib/customerSync.js) dès que customer_name est renseigné.
      const matchedCustomer = (customers || []).find((c) => c.name.toLowerCase() === customerName.trim().toLowerCase());
      const email = customerEmail.trim() || (matchedCustomer && matchedCustomer.email) || null;

      if (isEditing) {
        const next = {
          channel,
          customer_name: customerName.trim(),
          customer_email: email,
          status,
          order_date: orderDate,
          tracking: tracking.trim() || null,
          notes: notes.trim() || null,
          commission_rate: commissionRate,
        };
        const before = {
          channel: order.channel,
          customer_name: order.customer_name || '',
          customer_email: order.customer_email || null,
          status: order.status,
          order_date: order.order_date,
          tracking: order.tracking || null,
          notes: order.notes || null,
          commission_rate: Number(order.commission_rate) || 0,
        };
        const changes = {};
        Object.keys(next).forEach((key) => { if (!sameJson(next[key], before[key])) changes[key] = next[key]; });
        if (touched.items) changes.items = cleanItems;
        if (touched.extras) changes.extras = cleanExtras;
        // Le total ne change que si les lignes ou l'écart ont changé (calculé, jamais saisi).
        if (touched.items || touched.extras || touched.gap) changes.total = total;
        if (Object.keys(changes).length > 0) await onUpdate(order.id, changes);
      } else {
        await onCreate({
          channel,
          customer_name: customerName.trim(),
          customer_email: email,
          items: cleanItems,
          total: round2(total),
          status,
          order_date: orderDate,
          notes: notes.trim() || null,
          ...(tracking.trim() && { tracking: tracking.trim() }),
          ...(cleanExtras.length > 0 && { extras: cleanExtras }),
          ...(commissionRate > 0 && { commission_rate: commissionRate }),
        });
        if (commissionRate > 0) rememberCommission(commissionRate);
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
              <button
                type="button"
                onClick={() => handleChannelChange('reel')}
                className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium ${
                  channel === 'reel' ? 'bg-pink-50 border-pink-300 text-pink-800' : 'border-gray-200 text-gray-600'
                }`}
              >
                <ChannelLogo channel="reel" size={15} className="inline mr-1.5 -mt-0.5" />Point de vente
              </button>
              <button
                type="button"
                onClick={() => handleChannelChange('kofi')}
                className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium ${
                  channel === 'kofi' ? 'bg-purple-50 border-purple-300 text-purple-800' : 'border-gray-200 text-gray-600'
                }`}
              >
                <ChannelLogo channel="kofi" size={15} className="inline mr-1.5 -mt-0.5" />Ko-fi (manuel)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <AutocompleteField
              value={customerName}
              onChange={(value) => {
                setCustomerName(value);
                if (!isEditing) setCustomerEmail('');
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
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email du client (optionnel)"
              className={`${FIELD_CLASS} mt-2`}
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
                        <span className="text-gray-500 shrink-0 ml-2">{money(p.price)}</span>
                      </>
                    )}
                    newLabel="Nouveau produit — sera ajouté au catalogue"
                    placeholder="Nom de l'article"
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
                      disabled={items.length === 1 && extras.length === 0}
                      className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Divers <span className="text-gray-400 font-normal">(ne crée pas d'article)</span>
              </label>
              <button type="button" onClick={addExtra} className="text-sm text-purple-600 font-medium flex items-center gap-1">
                <Plus size={14} /> Ajouter
              </button>
            </div>
            {extras.length === 0 ? (
              <p className="text-xs text-gray-400">Frais de port, emballage, don, remise (montant négatif)…</p>
            ) : (
              <div className="space-y-2">
                {extras.map((extra, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={extra.label}
                      onChange={(e) => updateExtra(index, 'label', e.target.value)}
                      placeholder="Ex : frais de port"
                      className={`${ITEM_FIELD_CLASS} flex-1 min-w-0`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={extra.amount}
                      onChange={(e) => updateExtra(index, 'amount', e.target.value)}
                      placeholder="€"
                      className="w-24 shrink-0 px-2 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button type="button" onClick={() => removeExtra(index)} className="p-2 text-gray-400 hover:text-red-600 shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          {channel === 'reel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission de la boutique (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="Ex : 30"
                className={FIELD_CLASS}
              />
              <p className="text-xs text-gray-500 mt-1">Déduite automatiquement : tes revenus comptent le net. Préremplie avec la dernière utilisée.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de suivi (optionnel)</label>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Numéro de suivi du colis"
              className={FIELD_CLASS}
            />
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

          <div className="pt-2 border-t border-purple-100 space-y-2">
            {gap !== 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {initial.noItems ? 'Montant non détaillé' : gap > 0 ? 'Don / prix libre' : 'Remise'}
                  <button type="button" onClick={removeGap} title="Retirer cet écart du total" className="ml-2 text-xs text-purple-600 hover:underline">
                    Retirer
                  </button>
                </span>
                <span className={`font-medium ${gap > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {gap > 0 ? '+' : '−'}{money(Math.abs(gap))}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total{commissionRate > 0 ? ' payé' : ''}</span>
              <span className={`${commissionRate > 0 ? 'text-sm font-semibold' : 'text-lg font-bold'} text-gray-900`}>{money(total)}</span>
            </div>
            {commissionRate > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Commission ({commissionRate} %)</span>
                  <span className="text-rose-500 font-medium">−{money(commissionAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Net perçu</span>
                  <span className="text-lg font-bold text-gray-900">{money(net)}</span>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full justify-center" disabled={submitting}>
            {submitting ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer la commande'}
          </Button>
        </form>
    </Modal>
  );
};
