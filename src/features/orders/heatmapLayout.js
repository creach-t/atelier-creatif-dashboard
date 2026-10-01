import { GAP } from './OrdersHeatmap';

const MIN_CELL = 5;
const MAX_CELL = 64;
const MAX_WEEKS = 104; // 2 ans
const FALLBACK = { cell: 16 };

const LABELS_W = 38 + 24; // étiquettes des jours + marge pour la dernière étiquette de mois
const MONTHS_H = 18 + 12; // ligne des mois + marge
const STATS_H = 70; // chiffres et légende, affichés dans un widget assez haut

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Cases toujours carrées. Leur côté est limité par la hauteur du widget (7 jours) et par la largeur nécessaire pour
// afficher au moins `minWeeks` semaines ; ensuite on ajoute autant de semaines que la largeur en accepte.
export function heatmapGrid({ width, height, measured, minWeeks, showStats }) {
  if (!measured) return { ...FALLBACK, weeks: minWeeks };
  const availW = width - LABELS_W;
  const availH = height - MONTHS_H - (showStats ? STATS_H : 0);
  const fitH = (availH - 6 * GAP) / 7;
  const fitW = (availW - (minWeeks - 1) * GAP) / minWeeks;
  const cell = clamp(Math.floor(Math.min(fitH, fitW)), MIN_CELL, MAX_CELL);
  const weeks = clamp(Math.floor((availW + GAP) / (cell + GAP)), minWeeks, MAX_WEEKS);
  return { cell, weeks };
}
