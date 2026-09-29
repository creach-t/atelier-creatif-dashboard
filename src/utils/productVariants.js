// Regroupe les variantes d'un même produit pour l'affichage. Rien n'est fusionné en base : chaque
// variante reste un produit à son prix, ses ventes et ses commandes ; on les présente ensemble.
//
// Reconnu dans le nom : "Produit - variant : Rouge" (ou "variante"), "Produit (variant : Rouge)".
// Sans marqueur explicite, "Produit - Rouge" n'est regroupé que si au moins deux produits partagent
// le même début — un simple tiret dans un nom ne fusionne donc jamais rien tout seul.
const EXPLICIT_DASH = /\s*[-–—]\s*variant(?:es?)?\s*:\s*/i;
const EXPLICIT_PAREN = /\s*\(\s*variant(?:es?)?\s*:\s*(.+?)\s*\)\s*$/i;
const GENERIC_DASH = /^(.*\S)\s+[-–—]\s+(\S.*)$/;

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

export function parseVariantName(name) {
  const full = (name || '').trim();

  const dash = EXPLICIT_DASH.exec(full);
  if (dash && dash.index > 0) {
    const base = full.slice(0, dash.index).trim();
    const variant = full.slice(dash.index + dash[0].length).trim();
    if (base && variant) return { base, variant, explicit: true };
  }
  const paren = EXPLICIT_PAREN.exec(full);
  if (paren && paren.index > 0) {
    const base = full.slice(0, paren.index).trim();
    if (base && paren[1]) return { base, variant: paren[1].trim(), explicit: true };
  }
  const generic = GENERIC_DASH.exec(full);
  if (generic) return { base: generic[1].trim(), variant: generic[2].trim(), explicit: false };
  return { base: full, variant: null, explicit: false };
}

// -> [{ key, name, category, image, isFamily, variants: [{ product, label }] }], dans l'ordre d'apparition.
export function groupProducts(products) {
  const list = products || [];
  const parsed = list.map((product) => ({ product, ...parseVariantName(product.name) }));

  const baseCount = {};
  parsed.forEach((p) => {
    if (p.variant) baseCount[norm(p.base)] = (baseCount[norm(p.base)] || 0) + 1;
  });

  const groups = [];
  const byKey = new Map();
  const add = (key, name, product, label) => {
    let group = byKey.get(key);
    if (!group) {
      group = { key, name, category: product.category, image: product.image, isFamily: false, variants: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.variants.push({ product, label });
    return group;
  };

  parsed.forEach(({ product, base, variant, explicit }) => {
    const inFamily = variant && (explicit || baseCount[norm(base)] >= 2);
    if (inFamily) {
      add(`family:${norm(base)}`, base, product, variant).isFamily = true;
    } else {
      add(`single:${product.id || norm(product.name)}`, product.name, product, null);
    }
  });

  // Un produit "de base" au même nom que la famille (ex. "Marque-page" + "Marque-page - variant : Rouge")
  // rejoint la famille sous l'étiquette "Standard".
  const merged = [];
  groups.forEach((group) => {
    if (group.isFamily || group.variants.length !== 1) { merged.push(group); return; }
    const family = byKey.get(`family:${norm(group.name)}`);
    if (family) family.variants.unshift({ product: group.variants[0].product, label: 'Standard' });
    else merged.push(group);
  });

  // Photo de la famille : la première variante qui en a une vraie.
  merged.forEach((group) => {
    const withPhoto = group.variants.find((v) => typeof v.product.image === 'string' && v.product.image.startsWith('http'));
    if (withPhoto) group.image = withPhoto.product.image;
  });
  return merged;
}

// Retrouve le groupe d'un produit à partir du nom d'une de ses variantes (ou du nom du groupe).
export function findGroup(groups, name) {
  return (groups || []).find((g) => g.name === name || g.variants.some((v) => v.product.name === name)) || null;
}

// nom de produit -> groupe, pour agréger des chiffres par famille.
export function groupIndex(groups) {
  const index = new Map();
  (groups || []).forEach((g) => g.variants.forEach((v) => index.set(v.product.name, g)));
  return index;
}

export const KIND_LABELS = { physical: 'Physique', digital: 'Numérique', both: 'Physique + numérique' };

// Type d'un groupe : celui de ses variantes ('both' si elles diffèrent), ou null si aucun n'est précisé.
export function groupKind(group) {
  const kinds = new Set(group.variants.map((v) => v.product.kind).filter(Boolean));
  if (kinds.size === 0) return null;
  if (kinds.size > 1 || kinds.has('both')) return 'both';
  return [...kinds][0];
}

export const isFreeProduct = (product) => Boolean(product.is_free) || (Boolean(product.price_estimated) && Number(product.price) === 0);

// Fourchette de prix connus d'un groupe (prix > 0). estimated = au moins un prix deviné ou inconnu.
export function priceRange(group) {
  const known = group.variants.map((v) => Number(v.product.price)).filter((p) => p > 0);
  return {
    min: known.length ? Math.min(...known) : null,
    max: known.length ? Math.max(...known) : null,
    free: group.variants.some((v) => isFreeProduct(v.product)),
    allFree: group.variants.every((v) => isFreeProduct(v.product)),
    manualFree: group.variants.every((v) => v.product.is_free),
    unknown: group.variants.some((v) => !(Number(v.product.price) > 0) && !isFreeProduct(v.product)),
    estimated: group.variants.some((v) => v.product.price_estimated || Number(v.product.price_guess) > 0),
  };
}
