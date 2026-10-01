import { GAP } from './OrdersHeatmap';

const MIN_CELL = 5;
const MAX_CELL = 72;
const MAX_STRETCH = 2; // une case n'est jamais plus de 2 fois plus large que haute (ou l'inverse)
const FALLBACK_CELL = 16; // avant la première mesure du widget

const LABELS_W = 38 + 24; // étiquettes des jours + marge pour la dernière étiquette de mois
const MONTHS_H = 18 + 12; // ligne des mois + marge
const STATS_H = 70; // chiffres et légende, affichés dans un widget assez haut
const DAY_PANEL_H = 180; // détail du jour choisi

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Taille des cases du calendrier pour que les `weeks` colonnes x 7 lignes remplissent la largeur ET la hauteur
// disponibles, sans défilement et sans cases démesurément allongées.
export function heatmapCellSize({ width, height, measured, weeks, showStats, dayOpen }) {
  if (!measured) return { cellW: FALLBACK_CELL, cellH: FALLBACK_CELL };
  const availW = width - LABELS_W;
  const availH = height - MONTHS_H - (showStats ? STATS_H : 0) - (dayOpen ? DAY_PANEL_H : 0);
  const fitW = (availW - (weeks - 1) * GAP) / weeks;
  const fitH = (availH - 6 * GAP) / 7;
  return {
    cellW: clamp(Math.floor(Math.min(fitW, fitH * MAX_STRETCH)), MIN_CELL, MAX_CELL),
    cellH: clamp(Math.floor(Math.min(fitH, fitW * MAX_STRETCH)), MIN_CELL, MAX_CELL),
  };
}
