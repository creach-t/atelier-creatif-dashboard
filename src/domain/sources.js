// Registre des sources de vente : l'unique endroit qui décrit un canal (Ko-fi, point de vente, Etsy…).
// Ajouter une source = une entrée ici (+ la même dans api/lib/sources.js, vérifiée par un test) et, si elle
// s'importe depuis un export CSV, un adaptateur dans src/sources/. Voir docs/SOURCES.md.
//
//   kind        'webhook' (Ko-fi pousse les ventes) | 'import' (export CSV officiel) | 'manual' (saisie)
//   color       clé de teinte (voir ui/ChannelBadge : les classes Tailwind y sont écrites en toutes lettres)
//   icon        clé de logo (voir ui/ChannelBadge)
//   commission  mode 'rate' : la source prélève un % (commission_rate de la commande, déduit du net) ;
//               'none' : pas de frais. defaultRate : taux proposé (modifiable dans Réglages).
//   importAdapter  id de l'adaptateur CSV dans src/sources/ (absent : pas d'import)

export const SOURCES = [
  { id: 'kofi', label: 'Ko-fi', kind: 'webhook', color: 'purple', icon: 'kofi', defaultStatus: 'pending', enabledByDefault: true,
    commission: { mode: 'none', defaultRate: 0 }, importAdapter: 'kofi' },
  // Une vente en boutique est remise en main propre : rien à expédier.
  { id: 'reel', label: 'Point de vente', kind: 'manual', color: 'pink', icon: 'store', defaultStatus: 'delivered', enabledByDefault: true,
    commission: { mode: 'rate', defaultRate: 0, label: 'Commission de la boutique' } },
  // Taux indicatif (frais de transaction + paiement) : à ajuster dans Réglages selon la boutique.
  { id: 'etsy', label: 'Etsy', kind: 'import', color: 'orange', icon: 'bag', defaultStatus: 'pending', enabledByDefault: true,
    commission: { mode: 'rate', defaultRate: 11, label: 'Frais Etsy' }, importAdapter: 'etsy' },
  // Vinted : pas d'API publique ni d'export de ventes officiel → saisie manuelle. Aucun frais pour le vendeur.
  { id: 'vinted', label: 'Vinted', kind: 'manual', color: 'teal', icon: 'shirt', defaultStatus: 'pending', enabledByDefault: true,
    commission: { mode: 'none', defaultRate: 0 } },
  { id: 'depop', label: 'Depop', kind: 'manual', color: 'rose', icon: 'tag', defaultStatus: 'pending', enabledByDefault: false,
    commission: { mode: 'rate', defaultRate: 0, label: 'Frais Depop' } },
  { id: 'leboncoin', label: 'Leboncoin', kind: 'manual', color: 'sky', icon: 'tag', defaultStatus: 'pending', enabledByDefault: false,
    commission: { mode: 'none', defaultRate: 0 } },
  { id: 'marche', label: 'Marché / salon', kind: 'manual', color: 'emerald', icon: 'users', defaultStatus: 'delivered', enabledByDefault: false,
    commission: { mode: 'none', defaultRate: 0 } },
];

export const SOURCE_IDS = SOURCES.map((s) => s.id);

const BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

export const getSource = (id) => BY_ID[id] || null;
export const sourceLabel = (id) => (BY_ID[id] ? BY_ID[id].label : id);
export const hasCommission = (id) => Boolean(BY_ID[id]) && BY_ID[id].commission.mode === 'rate';
export const defaultStatusFor = (id) => (BY_ID[id] ? BY_ID[id].defaultStatus : 'pending');
