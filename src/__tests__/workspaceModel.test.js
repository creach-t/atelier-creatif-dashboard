import * as m from '../core/workspace/model';
import { defaultWorkspace } from '../core/workspace/defaults';

const page = () => m.createPage({
  id: 'p', title: 'P',
  widgets: [
    { id: 'a', type: 'metric', x: 0, y: 0, w: 3, h: 4 },
    { id: 'b', type: 'chart', x: 3, y: 0, w: 9, h: 8 },
    { id: 'c', type: 'note', x: 0, y: 8, w: 12, h: 20 },
  ],
});
const ws = () => ({ version: 1, updatedAt: 0, pages: [page()] });

describe('dispositions dérivées', () => {
  test('mobile : une colonne, hauteur plafonnée, ordre de lecture conservé', () => {
    const { sm } = page().layouts;
    expect(sm.map((i) => i.i)).toEqual(['a', 'b', 'c']);
    expect(sm.every((i) => i.w === 1 && i.x === 0)).toBe(true);
    expect(sm.find((i) => i.i === 'c').h).toBe(16);
    expect(sm[1].y).toBeGreaterThanOrEqual(sm[0].y + sm[0].h);
  });

  test('tablette : 6 colonnes, sans dépassement', () => {
    page().layouts.md.forEach((i) => expect(i.x + i.w).toBeLessThanOrEqual(6));
  });
});

describe('opérations', () => {
  test('addWidget ajoute aux trois dispositions, en bas', () => {
    const next = m.addWidget(ws(), 'p', { type: 'note', size: { w: 4, h: 6 }, id: 'n' });
    const p = next.pages[0];
    expect(p.widgets.map((w) => w.id)).toContain('n');
    ['lg', 'md', 'sm'].forEach((bp) => expect(p.layouts[bp].some((i) => i.i === 'n')).toBe(true));
    expect(p.layouts.lg.find((i) => i.i === 'n').y).toBe(28);
    expect(next.updatedAt).toBeGreaterThan(0);
  });

  test('removeWidget nettoie widgets et dispositions', () => {
    const p = m.removeWidget(ws(), 'p', 'b').pages[0];
    expect(p.widgets.map((w) => w.id)).toEqual(['a', 'c']);
    Object.values(p.layouts).forEach((l) => expect(l.some((i) => i.i === 'b')).toBe(false));
  });

  test('duplicateWidget copie la config sans partager la référence', () => {
    const base = m.updateWidgetConfig(ws(), 'p', 'a', { metric: 'orders', nested: { x: 1 } });
    const p = m.duplicateWidget(base, 'p', 'a').pages[0];
    const copy = p.widgets[p.widgets.length - 1];
    expect(copy.id).not.toBe('a');
    expect(copy.config).toEqual(base.pages[0].widgets[0].config);
    expect(copy.config.nested).not.toBe(base.pages[0].widgets[0].config.nested);
  });

  test('applyLayouts ne garde que i,x,y,w,h et ignore les widgets inconnus', () => {
    const layouts = { lg: [{ i: 'a', x: 2, y: 1, w: 3, h: 4, minW: 2, moved: true }, { i: 'ghost', x: 0, y: 0, w: 1, h: 1 }] };
    const lg = m.applyLayouts(ws(), 'p', layouts).pages[0].layouts.lg;
    expect(lg).toEqual([{ i: 'a', x: 2, y: 1, w: 3, h: 4 }]);
  });

  test('resizeWidget agit sur un seul point de rupture', () => {
    const p = m.resizeWidget(ws(), 'p', 'a', 'sm', { h: 9 }).pages[0];
    expect(p.layouts.sm.find((i) => i.i === 'a').h).toBe(9);
    expect(p.layouts.lg.find((i) => i.i === 'a').h).toBe(4);
  });

  test('on ne supprime jamais la dernière page', () => {
    const w = ws();
    expect(m.removePage(w, 'p')).toBe(w);
  });

  test('movePage réordonne et respecte les bornes', () => {
    const w = m.addPage(ws(), m.createPage({ id: 'q', title: 'Q' }));
    expect(m.movePage(w, 'q', -1).pages.map((p) => p.id)).toEqual(['q', 'p']);
    expect(m.movePage(w, 'p', -1)).toBe(w);
  });

  test('immutabilité : l\'objet d\'origine n\'est jamais modifié', () => {
    const w = ws();
    const snapshot = JSON.stringify(w);
    m.addWidget(w, 'p', { type: 'note', size: { w: 4, h: 6 } });
    m.removeWidget(w, 'p', 'a');
    m.updateWidgetConfig(w, 'p', 'a', { x: 1 });
    expect(JSON.stringify(w)).toBe(snapshot);
  });
});

describe('normalizeWorkspace', () => {
  test('rejette les données inexploitables', () => {
    expect(m.normalizeWorkspace(null)).toBeNull();
    expect(m.normalizeWorkspace({ pages: [] })).toBeNull();
    expect(m.normalizeWorkspace('x', { fallback: 'fb' })).toBe('fb');
  });

  test('retire les widgets dont le type n\'existe plus', () => {
    const out = m.normalizeWorkspace(ws(), { isKnownType: (t) => t !== 'chart' });
    expect(out.pages[0].widgets.map((w) => w.id)).toEqual(['a', 'c']);
    expect(out.pages[0].layouts.lg.some((i) => i.i === 'b')).toBe(false);
  });

  test('pose un widget sans position plutôt que de le perdre, et complète md/sm manquants', () => {
    const raw = { pages: [{ id: 'p', title: 'P', widgets: [{ id: 'z', type: 'note' }], layouts: {} }] };
    const p = m.normalizeWorkspace(raw).pages[0];
    expect(p.layouts.lg).toHaveLength(1);
    expect(p.layouts.md).toHaveLength(1);
    expect(p.layouts.sm).toHaveLength(1);
  });

  test('l\'espace par défaut survit à la normalisation sans perte', () => {
    const d = defaultWorkspace();
    const out = m.normalizeWorkspace(JSON.parse(JSON.stringify(d)));
    expect(out.pages.map((p) => p.widgets.length)).toEqual(d.pages.map((p) => p.widgets.length));
  });
});

describe('breakpointFor', () => {
  test('choisit le point de rupture selon la largeur mesurée', () => {
    expect(m.breakpointFor(1200)).toBe('lg');
    expect(m.breakpointFor(900)).toBe('lg');
    expect(m.breakpointFor(700)).toBe('md');
    expect(m.breakpointFor(345)).toBe('sm');
    expect(m.breakpointFor(0)).toBe('sm');
  });
});
