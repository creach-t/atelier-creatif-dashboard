import { heatmapCellSize } from '../features/orders/heatmapLayout';
import { GAP } from '../features/orders/OrdersHeatmap';

const base = { measured: true, weeks: 26, showStats: false, dayOpen: false };
const gridW = (cellW, weeks) => weeks * cellW + (weeks - 1) * GAP;
const gridH = (cellH) => 7 * cellH + 6 * GAP;

describe('heatmapCellSize', () => {
  test('avant mesure : taille par défaut', () => {
    expect(heatmapCellSize({ ...base, measured: false, width: 0, height: 0 })).toEqual({ cellW: 16, cellH: 16 });
  });

  test('un widget plus grand donne de plus grandes cases (plus de plafond à 26 px)', () => {
    const small = heatmapCellSize({ ...base, width: 700, height: 300, weeks: 12 });
    const big = heatmapCellSize({ ...base, width: 1100, height: 520, weeks: 12 });
    expect(big.cellW).toBeGreaterThan(small.cellW);
    expect(big.cellW).toBeGreaterThan(26);
  });

  test('la grille tient dans la largeur et la hauteur disponibles', () => {
    [[900, 400], [500, 260], [1200, 700], [320, 220]].forEach(([width, height]) => {
      const { cellW, cellH } = heatmapCellSize({ ...base, width, height });
      expect(gridW(cellW, 26)).toBeLessThanOrEqual(Math.max(width - 62, gridW(5, 26)));
      expect(gridH(cellH)).toBeLessThanOrEqual(Math.max(height - 30, gridH(5)));
    });
  });

  test('la case ne devient jamais démesurément allongée', () => {
    const { cellW, cellH } = heatmapCellSize({ ...base, width: 1400, height: 200, weeks: 12 });
    expect(cellW).toBeLessThanOrEqual(cellH * 2 + 1);
    const tallCase = heatmapCellSize({ ...base, width: 300, height: 900, weeks: 12 });
    expect(tallCase.cellH).toBeLessThanOrEqual(tallCase.cellW * 2 + 1);
  });

  test('ouvrir le détail du jour ou afficher les chiffres réduit la hauteur des cases', () => {
    const closed = heatmapCellSize({ ...base, width: 1400, height: 600, weeks: 12 });
    const open = heatmapCellSize({ ...base, width: 1400, height: 600, weeks: 12, dayOpen: true });
    expect(open.cellH).toBeLessThan(closed.cellH);
  });

  test('jamais sous 5 px', () => {
    expect(heatmapCellSize({ ...base, width: 100, height: 60, weeks: 52 })).toEqual({ cellW: 5, cellH: 5 });
  });
});
