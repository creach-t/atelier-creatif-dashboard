// Modèle de l'espace de travail : fonctions pures, sans React, sans registre. Tout ce que l'utilisateur
// personnalise (pages, widgets, config, disposition par taille d'écran) vit dans cet objet JSON, ce qui
// le rend testable, sérialisable (localStorage / base) et annulable (chaque opération renvoie un nouvel objet).
//
// workspace = { version, updatedAt, pages: [{ id, title, icon, period, monthOffset,
//   widgets: [{ id, type, config }], layouts: { lg: [{ i, x, y, w, h }], md: [...], sm: [...] } }] }

export const WORKSPACE_VERSION = 1;
export const BREAKPOINTS = { lg: 900, md: 560, sm: 0 };
export const COLS = { lg: 12, md: 6, sm: 1 };
export const ROW_HEIGHT = 32;

// Point de rupture actif pour une largeur de conteneur : le plus grand dont le seuil est atteint (même règle que la grille).
export const breakpointFor = (width) =>
  Object.entries(BREAKPOINTS).sort((a, b) => b[1] - a[1]).find(([, min]) => width >= min)[0];
export const MARGIN = 12;
const SM_MAX_H = 16; // une liste très haute sur desktop ne doit pas occuper trois écrans sur mobile

let counter = 0;
export const uid = (prefix = 'w') => {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
};

const clone = (v) => JSON.parse(JSON.stringify(v));
const touch = (ws) => ({ ...ws, updatedAt: Date.now() });

// Range des blocs de gauche à droite, ligne par ligne (comme un texte) dans une grille de `cols` colonnes.
export function flowLayout(items, cols) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const out = [];
  let x = 0;
  let y = 0;
  let rowH = 0;
  sorted.forEach((it) => {
    const w = Math.min(it.w, cols);
    if (x + w > cols) { y += rowH; x = 0; rowH = 0; }
    out.push({ i: it.i, x, y, w, h: it.h });
    x += w;
    rowH = Math.max(rowH, it.h);
    if (x >= cols) { y += rowH; x = 0; rowH = 0; }
  });
  return out;
}

// Dispositions tablette (6 colonnes) et mobile (1 colonne) déduites de la disposition bureau (12 colonnes).
export function deriveLayouts(lg) {
  const md = flowLayout(lg.map((it) => ({ ...it, w: it.w >= 7 ? 6 : 3 })), COLS.md);
  const sm = flowLayout(lg.map((it) => ({ ...it, w: 1, h: Math.min(it.h, SM_MAX_H) })), COLS.sm);
  return { lg, md, sm };
}

const bottomOf = (layout) => layout.reduce((m, it) => Math.max(m, it.y + it.h), 0);

export function createPage({ id, title, icon = 'layout', period = 'month', widgets = [] }) {
  const instances = [];
  const lg = [];
  widgets.forEach((w) => {
    const wid = w.id || uid('w');
    instances.push({ id: wid, type: w.type, config: w.config || {} });
    lg.push({ i: wid, x: w.x, y: w.y, w: w.w, h: w.h });
  });
  return { id: id || uid('p'), title, icon, period, monthOffset: 0, yearOffset: 0, widgets: instances, layouts: deriveLayouts(lg) };
}

export const findPage = (ws, pageId) => ws.pages.find((p) => p.id === pageId);

const mapPage = (ws, pageId, fn) => touch({ ...ws, pages: ws.pages.map((p) => (p.id === pageId ? fn(p) : p)) });

// ---------- widgets ----------

// size = { w, h } en colonnes/lignes du grand écran ; ajouté en bas de chaque disposition.
export function addWidget(ws, pageId, { type, config = {}, size, id }) {
  const wid = id || uid('w');
  return mapPage(ws, pageId, (p) => {
    const layouts = {
      lg: [...p.layouts.lg, { i: wid, x: 0, y: bottomOf(p.layouts.lg), w: size.w, h: size.h }],
      md: [...p.layouts.md, { i: wid, x: 0, y: bottomOf(p.layouts.md), w: size.w >= 7 ? 6 : 3, h: size.h }],
      sm: [...p.layouts.sm, { i: wid, x: 0, y: bottomOf(p.layouts.sm), w: 1, h: Math.min(size.h, SM_MAX_H) }],
    };
    return { ...p, widgets: [...p.widgets, { id: wid, type, config }], layouts };
  });
}

export function removeWidget(ws, pageId, widgetId) {
  return mapPage(ws, pageId, (p) => ({
    ...p,
    widgets: p.widgets.filter((w) => w.id !== widgetId),
    layouts: Object.fromEntries(Object.entries(p.layouts).map(([bp, items]) => [bp, items.filter((it) => it.i !== widgetId)])),
  }));
}

export function duplicateWidget(ws, pageId, widgetId) {
  const page = findPage(ws, pageId);
  const src = page && page.widgets.find((w) => w.id === widgetId);
  if (!src) return ws;
  const copyId = uid('w');
  return mapPage(ws, pageId, (p) => {
    const layouts = {};
    Object.entries(p.layouts).forEach(([bp, items]) => {
      const at = items.find((it) => it.i === widgetId);
      layouts[bp] = at ? [...items, { ...at, i: copyId, y: bottomOf(items) }] : items;
    });
    return { ...p, widgets: [...p.widgets, { id: copyId, type: src.type, config: clone(src.config) }], layouts };
  });
}

export function updateWidgetConfig(ws, pageId, widgetId, patch) {
  return mapPage(ws, pageId, (p) => ({
    ...p,
    widgets: p.widgets.map((w) => (w.id === widgetId ? { ...w, config: { ...w.config, ...patch } } : w)),
  }));
}

// Disposition renvoyée par la grille (glisser / redimensionner). On ne garde que { i, x, y, w, h }.
export function applyLayouts(ws, pageId, layouts) {
  const clean = (items) => items.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
  return mapPage(ws, pageId, (p) => {
    const ids = new Set(p.widgets.map((w) => w.id));
    const next = { ...p.layouts };
    Object.keys(COLS).forEach((bp) => {
      if (layouts[bp]) next[bp] = clean(layouts[bp]).filter((it) => ids.has(it.i));
    });
    return { ...p, layouts: next };
  });
}

// Taille d'un widget sur un point de rupture donné (utilisé par les réglages de taille).
export function resizeWidget(ws, pageId, widgetId, breakpoint, size) {
  return mapPage(ws, pageId, (p) => ({
    ...p,
    layouts: {
      ...p.layouts,
      [breakpoint]: p.layouts[breakpoint].map((it) => (it.i === widgetId ? { ...it, ...size } : it)),
    },
  }));
}

// ---------- pages ----------

export function addPage(ws, page) {
  return touch({ ...ws, pages: [...ws.pages, page] });
}

export function updatePage(ws, pageId, patch) {
  return mapPage(ws, pageId, (p) => ({ ...p, ...patch }));
}

export function removePage(ws, pageId) {
  if (ws.pages.length <= 1) return ws;
  return touch({ ...ws, pages: ws.pages.filter((p) => p.id !== pageId) });
}

export function movePage(ws, pageId, delta) {
  const idx = ws.pages.findIndex((p) => p.id === pageId);
  const to = idx + delta;
  if (idx < 0 || to < 0 || to >= ws.pages.length) return ws;
  const pages = [...ws.pages];
  const [moved] = pages.splice(idx, 1);
  pages.splice(to, 0, moved);
  return touch({ ...ws, pages });
}

export function replacePage(ws, pageId, page) {
  return mapPage(ws, pageId, () => ({ ...page, id: pageId }));
}

// ---------- santé des données ----------

// Répare un espace de travail lu depuis le stockage : version, widgets inconnus (type retiré du code),
// dispositions manquantes ou orphelines. Ne lève jamais : une donnée corrompue ne doit pas bloquer l'app.
export function normalizeWorkspace(raw, { isKnownType = () => true, fallback } = {}) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.pages) || raw.pages.length === 0) return fallback || null;
  const pages = raw.pages
    .filter((p) => p && typeof p === 'object' && p.id)
    .map((p) => {
      const widgets = (Array.isArray(p.widgets) ? p.widgets : [])
        .filter((w) => w && w.id && isKnownType(w.type))
        .map((w) => ({ id: w.id, type: w.type, config: w.config && typeof w.config === 'object' ? w.config : {} }));
      const ids = new Set(widgets.map((w) => w.id));
      const layouts = p.layouts && typeof p.layouts === 'object' ? p.layouts : {};
      const lg = (layouts.lg || []).filter((it) => ids.has(it.i));
      // Un widget sans position (donnée partielle) est posé en bas plutôt que perdu.
      widgets.forEach((w) => {
        if (!lg.some((it) => it.i === w.id)) lg.push({ i: w.id, x: 0, y: bottomOf(lg), w: 6, h: 8 });
      });
      const derived = deriveLayouts(lg);
      const complete = (bp) => {
        const items = (layouts[bp] || []).filter((it) => ids.has(it.i));
        return widgets.every((w) => items.some((it) => it.i === w.id)) ? items : derived[bp];
      };
      return {
        id: p.id,
        title: typeof p.title === 'string' && p.title.trim() ? p.title : 'Page',
        icon: p.icon || 'layout',
        period: p.period || 'month',
        monthOffset: Number(p.monthOffset) || 0,
        yearOffset: Number(p.yearOffset) || 0,
        rangeFrom: typeof p.rangeFrom === 'string' ? p.rangeFrom : undefined,
        rangeTo: typeof p.rangeTo === 'string' ? p.rangeTo : undefined,
        widgets,
        layouts: { lg, md: complete('md'), sm: complete('sm') },
      };
    });
  if (pages.length === 0) return fallback || null;
  return { version: WORKSPACE_VERSION, updatedAt: Number(raw.updatedAt) || 0, pages };
}
