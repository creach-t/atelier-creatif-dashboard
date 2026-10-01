// Vocabulaire métier partagé : un seul endroit pour les statuts, les canaux et les valeurs par défaut.
// (api/lib/validate.js garde sa propre copie : le serveur est en CommonJS, sans dossier commun avec le front.)

export const ORDER_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];

export const STATUS_LABELS = {
  pending: 'En attente',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

// Les canaux vivent dans le registre de sources (domain/sources.js) ; ré-exportés ici pour les anciens imports.
export { SOURCE_IDS as CHANNEL_IDS, defaultStatusFor } from './sources';

// Image et catégorie d'un produit créé sans détails (saisie d'un article inconnu dans une commande).
export const DEFAULT_PRODUCT_IMAGE = '🎁';
export const UNCATEGORIZED = 'Sans catégorie';
