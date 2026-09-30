// Vocabulaire métier partagé : un seul endroit pour les statuts, les canaux et les valeurs par défaut.
// (api/lib/validate.js garde sa propre copie : le serveur est en CommonJS, sans dossier commun avec le front.)

export const ORDER_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];

export const STATUS_LABELS = {
  pending: 'En attente',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const CHANNEL_IDS = ['kofi', 'reel'];

// Une vente en boutique est remise en main propre : elle n'a rien à expédier.
export const defaultStatusFor = (channel) => (channel === 'reel' ? 'delivered' : 'pending');

// Image et catégorie d'un produit créé sans détails (saisie d'un article inconnu dans une commande).
export const DEFAULT_PRODUCT_IMAGE = '🎁';
export const UNCATEGORIZED = 'Sans catégorie';
