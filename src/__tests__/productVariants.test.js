import { parseVariantName, groupProducts, findGroup } from '../utils/productVariants';

const p = (id, name, extra = {}) => ({ id, name, category: 'Ko-fi', price: 0, image: '🎁', ...extra });

describe('parseVariantName', () => {
  test('marqueur explicite « - variant : X »', () => {
    expect(parseVariantName('Marque-page - variant : Rouge')).toEqual({ base: 'Marque-page', variant: 'Rouge', explicit: true });
    expect(parseVariantName('Sticker – Variante : Chat Ninja').variant).toBe('Chat Ninja');
  });

  test('parenthèses explicites', () => {
    expect(parseVariantName('Sticker (variant : Bleu)')).toEqual({ base: 'Sticker', variant: 'Bleu', explicit: true });
  });

  test("un tiret sans espaces dans un nom n'est pas un séparateur", () => {
    expect(parseVariantName('Marque-page').variant).toBeNull();
  });
});

describe('groupProducts', () => {
  test('regroupe les variantes explicites en une seule famille', () => {
    const groups = groupProducts([p(1, 'Marque-page - variant : Rouge'), p(2, 'Marque-page - variant : Bleu'), p(3, 'Figurine')]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ name: 'Marque-page', isFamily: true });
    expect(groups[0].variants.map((v) => v.label)).toEqual(['Rouge', 'Bleu']);
    expect(groups[1].isFamily).toBe(false);
  });

  test('un seul « A - B » isolé ne fusionne rien, deux avec le même début oui', () => {
    expect(groupProducts([p(1, 'Carte - Noël'), p(2, 'Autre chose')])).toHaveLength(2);
    const groups = groupProducts([p(1, 'Carte - Noël'), p(2, 'Carte - Pâques')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Carte');
  });

  test('un produit de base du même nom rejoint la famille (« Standard »)', () => {
    const groups = groupProducts([p(1, 'Sticker'), p(2, 'Sticker - variant : Chat')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].variants.map((v) => v.label)).toEqual(['Standard', 'Chat']);
  });

  test('retrouve le groupe depuis le nom d\'une variante', () => {
    const groups = groupProducts([p(1, 'Sticker - variant : Chat'), p(2, 'Sticker - variant : Chien')]);
    expect(findGroup(groups, 'Sticker - variant : Chien').name).toBe('Sticker');
  });
});
