import { planKofiSync, defaultSelection, applyChanges, describeKofiError } from '../features/products/kofiSyncPlan';

const PHOTO = 'https://storage.ko-fi.com/cdn/useruploads/post/old.jpeg';
const NEW_PHOTO = 'https://storage.ko-fi.com/cdn/useruploads/post/new.jpeg';
const preview = (extra = {}) => ({ name: 'Sticker Renard', price: 4, currency: 'EUR', imageUrl: NEW_PHOTO, ...extra });
const byField = (changes, field) => changes.find((c) => c.field === field);

describe('règles de non-écrasement (resynchronisation Ko-fi)', () => {
  test('produit vide (emoji par défaut, prix 0) : tout est proposé, rien ne demande confirmation', () => {
    const changes = planKofiSync({ name: 'Sticker Renard', price: 0, image: '🎁' }, preview());
    expect(changes.map((c) => c.field)).toEqual(['image', 'price']);
    expect(changes.every((c) => !c.needsConfirm)).toBe(true);
    expect([...defaultSelection(changes)]).toEqual(['image', 'price']);
  });

  test('un prix non nul différent n’est JAMAIS appliqué d’office', () => {
    const changes = planKofiSync({ price: 3.5, image: '🎁' }, preview());
    expect(byField(changes, 'price')).toMatchObject({ before: 3.5, after: 4, needsConfirm: true });
    expect(defaultSelection(changes).has('price')).toBe(false);
    expect(applyChanges(changes, defaultSelection(changes), {})).not.toHaveProperty('price');
  });

  test('un prix estimé non nul demande aussi confirmation, avec une note dédiée', () => {
    const c = byField(planKofiSync({ price: 3, price_estimated: true, image: '🎁' }, preview()), 'price');
    expect(c.needsConfirm).toBe(true);
    expect(c.note).toMatch(/estimé/);
  });

  test('prix identique : aucune modification proposée', () => {
    expect(byField(planKofiSync({ price: 4, image: '🎁' }, preview()), 'price')).toBeUndefined();
  });

  test('produit marqué gratuit : le 0 est voulu, confirmation requise ; l’appliquer lève le drapeau', () => {
    const current = { price: 0, is_free: true, image: '🎁' };
    const changes = planKofiSync(current, preview());
    expect(byField(changes, 'price')).toMatchObject({ needsConfirm: true });
    expect(applyChanges(changes, new Set(['price']), current)).toEqual({ price: 4, is_free: false });
  });

  test('prix dans une autre devise : jamais appliqué d’office, avertissement', () => {
    const c = byField(planKofiSync({ price: 0, image: '🎁' }, preview({ currency: 'USD' })), 'price');
    expect(c).toMatchObject({ needsConfirm: true });
    expect(c.note).toMatch(/USD/);
  });

  test('prix absent de la page : on ne touche pas au prix', () => {
    expect(byField(planKofiSync({ price: 5, image: '🎁' }, preview({ price: null })), 'price')).toBeUndefined();
  });

  test('une photo déjà présente n’est remplacée que sur confirmation ; un emoji, librement', () => {
    expect(byField(planKofiSync({ price: 4, image: PHOTO }, preview()), 'image')).toMatchObject({ before: PHOTO, after: NEW_PHOTO, needsConfirm: true });
    expect(byField(planKofiSync({ price: 4, image: '🎨' }, preview()), 'image')).toMatchObject({ needsConfirm: false });
  });

  test('même image : rien à proposer ; aucune image trouvée : l’image actuelle reste', () => {
    expect(byField(planKofiSync({ price: 4, image: NEW_PHOTO }, preview()), 'image')).toBeUndefined();
    expect(byField(planKofiSync({ price: 4, image: PHOTO }, preview({ imageUrl: null })), 'image')).toBeUndefined();
  });

  test('un produit existant n’est jamais renommé ; à la création, le nom saisi demande confirmation', () => {
    expect(byField(planKofiSync({ name: 'Autre nom', price: 4, image: '🎁' }, preview()), 'name')).toBeUndefined();
    expect(byField(planKofiSync({ name: '', price: 4, image: '🎁' }, preview(), { renameable: true }), 'name')).toMatchObject({ needsConfirm: false });
    expect(byField(planKofiSync({ name: 'Mon nom', price: 4, image: '🎁' }, preview(), { renameable: true }), 'name')).toMatchObject({ needsConfirm: true });
  });

  test('applyChanges n’écrit que les champs cochés', () => {
    const changes = planKofiSync({ price: 0, image: PHOTO }, preview());
    expect(applyChanges(changes, new Set(['price']), {})).toEqual({ price: 4 });
    expect(applyChanges(changes, new Set(), {})).toEqual({});
  });

  test('aperçu absent : rien', () => {
    expect(planKofiSync({ price: 1, image: '🎁' }, null)).toEqual([]);
  });
});

test('messages d’erreur lisibles pour les codes de l’API', () => {
  expect(describeKofiError(new Error('kofi_blocked'))).toMatch(/anti-robots/);
  expect(describeKofiError(new Error('kofi_not_found'))).toMatch(/introuvable/);
  expect(describeKofiError(new Error('storage_unsupported'))).toMatch(/0013/);
  expect(describeKofiError(new Error('Too many requests'))).toMatch(/Trop de requêtes/);
  expect(describeKofiError(new Error('Erreur 500'))).toBe('Erreur 500');
});
