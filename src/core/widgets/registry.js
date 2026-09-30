// Registre des widgets : la seule chose à faire pour ajouter un widget à l'application est d'appeler
// `defineWidget` (voir src/widgets/). Le catalogue, les réglages, la grille et la sauvegarde s'en déduisent.
//
// defineWidget({
//   type, title, description, icon, category,
//   size: { w, h, minW, minH, maxW?, maxH? },   // unités de la grille bureau (12 colonnes)
//   defaultConfig,                              // valeurs par défaut de la config
//   schema: [ { key, label, type, options?, help?, when?, min?, max?, step?, placeholder? } ],
//   presets: [ { label, description?, config, size? } ],  // raccourcis proposés dans le catalogue
//   getTitle: (config) => string,               // titre dynamique
//   component,                                  // ({ config, updateConfig, size, widget }) => JSX
// })
const widgets = new Map();

export function defineWidget(def) {
  if (!def || !def.type || !def.component) throw new Error('defineWidget : type et component requis');
  const full = {
    category: 'Général',
    schema: [],
    defaultConfig: {},
    presets: [],
    ...def,
    size: { minW: 2, minH: 3, maxW: 12, maxH: 40, ...def.size },
  };
  widgets.set(def.type, full);
  return full;
}

export const getWidget = (type) => widgets.get(type);
export const isKnownWidget = (type) => widgets.has(type);
export const listWidgets = () => [...widgets.values()];

export const CATEGORIES = ['Ventes', 'Produits', 'Clients', 'Rapports', 'Outils'];

// Config effective : valeurs par défaut du widget + ce que l'utilisateur a changé.
export const resolveConfig = (def, config) => ({ ...def.defaultConfig, ...(config || {}) });

// Entrées du catalogue : un widget + ses préréglages (chacun est un point d'entrée distinct, pré-configuré).
export function catalogEntries() {
  const entries = [];
  widgets.forEach((def) => {
    entries.push({ key: def.type, def, label: def.title, description: def.description, config: {}, size: def.size, primary: true });
    def.presets.forEach((p, i) => {
      entries.push({
        key: `${def.type}:${i}`, def, label: p.label, description: p.description || def.description,
        config: p.config, size: { ...def.size, ...(p.size || {}) }, primary: false,
      });
    });
  });
  return entries;
}
