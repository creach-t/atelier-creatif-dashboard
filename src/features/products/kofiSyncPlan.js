// Règles de resynchronisation d'un produit avec sa page Ko-fi : fonctions pures (aucun React), donc testables seules.
// Principe : RIEN n'est jamais écrasé en silence. Chaque différence devient une « modification proposée » ; celles qui
// écraseraient une valeur déjà saisie sont marquées `needsConfirm` (décochées par défaut, à cocher explicitement).
import { isPhoto } from '../../utils/productImage';

const sameImage = (a, b) => String(a || '') === String(b || '');

// current : { name, price, image, is_free, price_estimated } (le produit enregistré, ou les valeurs en cours de saisie)
// preview : { name, price, currency, imageUrl } (réponse de /products/kofi-preview ; chaque champ peut être null)
// options.renameable : true à la création (un produit existant n'est jamais renommé : ses commandes le retrouvent par son nom)
export function planKofiSync(current, preview, { renameable = false } = {}) {
  const changes = [];
  if (!preview) return changes;

  // Image : une photo déjà présente n'est remplacée que sur confirmation ; un emoji / placeholder, librement.
  if (preview.imageUrl && !sameImage(current.image, preview.imageUrl)) {
    changes.push({
      field: 'image', label: 'Image', before: current.image || '', after: preview.imageUrl,
      needsConfirm: isPhoto(current.image),
      note: isPhoto(current.image) ? 'Remplace la photo actuelle' : null,
    });
  }

  // Prix : on ne remplace jamais un prix non nul différent sans demander. Un prix à 0 est « manquant »… sauf produit
  // marqué gratuit (0 voulu). Un prix dans une autre devise que l'euro n'est jamais appliqué d'office.
  if (typeof preview.price === 'number' && Number.isFinite(preview.price)) {
    const before = Number(current.price) || 0;
    const foreign = Boolean(preview.currency) && preview.currency !== 'EUR';
    if (preview.price !== before) {
      const existing = before > 0 || Boolean(current.is_free);
      changes.push({
        field: 'price', label: 'Prix', before, after: preview.price, currency: preview.currency || null,
        needsConfirm: existing || foreign,
        note: foreign
          ? `Prix affiché en ${preview.currency} par Ko-fi : à vérifier avant de l'appliquer`
          : current.is_free ? 'Le produit est marqué gratuit'
          : before > 0 ? (current.price_estimated ? 'Remplace un prix estimé' : 'Remplace le prix actuel') : null,
      });
    }
  }

  // Nom : proposé seulement à la création.
  if (renameable && preview.name && preview.name !== (current.name || '').trim()) {
    const typed = Boolean((current.name || '').trim());
    changes.push({ field: 'name', label: 'Nom', before: current.name || '', after: preview.name, needsConfirm: typed, note: typed ? 'Remplace le nom saisi' : null });
  }

  return changes;
}

// Cases cochées au départ : tout ce qui n'écrase rien.
export const defaultSelection = (changes) => new Set(changes.filter((c) => !c.needsConfirm).map((c) => c.field));

// Modifications retenues -> champs à écrire. Un prix > 0 appliqué sur un produit « gratuit » lève ce drapeau.
export function applyChanges(changes, selected, current = {}) {
  const patch = {};
  changes.forEach((c) => {
    if (!selected.has(c.field)) return;
    patch[c.field] = c.after;
    if (c.field === 'price' && c.after > 0 && current.is_free) patch.is_free = false;
  });
  return patch;
}

// Message affichable pour une erreur de l'API (codes stables renvoyés par /products/kofi-preview et /products/image).
export function describeKofiError(err) {
  const code = (err && err.message) || '';
  const messages = {
    invalid_kofi_url: 'Lien invalide : colle une adresse de la forme https://ko-fi.com/s/…',
    kofi_blocked: "Ko-fi bloque la récupération automatique depuis le serveur (protection anti-robots). Colle plutôt l'adresse de l'image à la main.",
    kofi_not_found: 'Produit introuvable sur Ko-fi : vérifie le lien.',
    kofi_unavailable: 'Ko-fi ne répond pas pour le moment, réessaie dans un instant.',
    kofi_unparseable: 'La page Ko-fi a été lue, mais sans nom ni image exploitables.',
    storage_unsupported: "L'envoi de fichiers n'est pas encore activé (migration 0013) : colle plutôt l'adresse de l'image.",
    'Too many requests': 'Trop de requêtes : patiente une minute puis réessaie.',
  };
  return messages[code] || code || 'Erreur inattendue.';
}
