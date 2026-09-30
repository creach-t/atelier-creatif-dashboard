import { PERIOD_OPTIONS } from '../metrics/periods';
import { metricOptions } from '../metrics/metrics';
import { TINT_OPTIONS } from '../config/ConfigForm';

// Champs de schéma réutilisables : les widgets les assemblent au lieu de les réécrire.
export const periodField = (extra = {}) => ({
  key: 'period',
  label: 'Période',
  type: 'select',
  display: 'select',
  help: '« Suivre la page » reprend la période choisie en haut de la page.',
  options: [{ value: 'page', label: 'Suivre la page' }, ...PERIOD_OPTIONS.map((p) => ({ value: p.id, label: p.label }))],
  ...extra,
});

export const metricField = (ids, extra = {}) => ({
  key: 'metric', label: 'Indicateur', type: 'select', display: 'select', options: metricOptions(ids), ...extra,
});

export const tintField = (extra = {}) => ({ key: 'tint', label: 'Couleur', type: 'color', options: TINT_OPTIONS, ...extra });

export const countField = (extra = {}) => ({ key: 'count', label: 'Nombre de lignes', type: 'number', min: 1, max: 20, ...extra });

export const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Tous les canaux' },
  { value: 'kofi', label: 'Ko-fi' },
  { value: 'reel', label: 'Point de vente' },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
];

// Champs communs à tous les widgets, ajoutés automatiquement en tête des réglages.
export const UNIVERSAL_SCHEMA = [
  { key: 'title', label: 'Titre personnalisé', type: 'text', placeholder: 'Laisser vide pour le titre par défaut', maxLength: 60 },
  { key: 'showTitle', label: 'Afficher le titre', type: 'toggle' },
];
export const UNIVERSAL_DEFAULTS = { title: '', showTitle: true };
