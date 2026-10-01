import { heatmapGrid } from '../features/orders/heatmapLayout';
import { GAP } from '../features/orders/OrdersHeatmap';

const base = { measured: true, minWeeks: 26, showStats: false, dayOpen: false };
const gridW = ({ cell, weeks }) => weeks * cell + (weeks - 1) * GAP;

describe('heatmapGrid', () => {
  test('avant mesure : taille par défaut, durée minimale', () => {
    expect(heatmapGrid({ ...base, measured: false, width: 0, height: 0 })).toEqual({ cell: 16, weeks: 26 });
  });

  test('un widget plus large affiche plus de semaines, avec des cases de même taille', () => {
    const narrow = heatmapGrid({ ...base, width: 700, height: 220, minWeeks: 12 });
    const wide = heatmapGrid({ ...base, width: 1400, height: 220, minWeeks: 12 });
    expect(wide.cell).toBe(narrow.cell);
    expect(wide.weeks).toBeGreaterThan(narrow.weeks);
  });

  test('la grille remplit la largeur disponible (à une case près) sans la dépasser', () => {
    [[900, 400], [1200, 700], [1600, 300]].forEach(([width, height]) => {
      const grid = heatmapGrid({ ...base, width, height, minWeeks: 12 });
      const avail = width - 62;
      expect(gridW(grid)).toBeLessThanOrEqual(avail);
      expect(avail - gridW(grid)).toBeLessThan(grid.cell + GAP);
    });
  });

  test('la durée choisie est un minimum : les cases rétrécissent plutôt que de la tronquer', () => {
    const grid = heatmapGrid({ ...base, width: 400, height: 600, minWeeks: 26 });
    expect(grid.weeks).toBe(26);
    expect(gridW(grid)).toBeLessThanOrEqual(400 - 62);
  });

  test('la hauteur limite la taille des cases', () => {
    const short = heatmapGrid({ ...base, width: 1400, height: 160, minWeeks: 12 });
    const tall = heatmapGrid({ ...base, width: 1400, height: 400, minWeeks: 12 });
    expect(tall.cell).toBeGreaterThan(short.cell);
  });

  test('ouvrir le détail du jour ou afficher les chiffres réduit les cases', () => {
    const closed = heatmapGrid({ ...base, width: 1400, height: 330, minWeeks: 12 });
    expect(heatmapGrid({ ...base, width: 1400, height: 330, minWeeks: 12, dayOpen: true }).cell).toBeLessThan(closed.cell);
    expect(heatmapGrid({ ...base, width: 1400, height: 330, minWeeks: 12, showStats: true }).cell).toBeLessThan(closed.cell);
  });

  test('bornes : cases de 5 px minimum, 104 semaines maximum', () => {
    expect(heatmapGrid({ ...base, width: 100, height: 60, minWeeks: 52 })).toEqual({ cell: 5, weeks: 52 });
    expect(heatmapGrid({ ...base, width: 5000, height: 160, minWeeks: 12 }).weeks).toBe(104);
  });
});
