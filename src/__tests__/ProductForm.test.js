/* eslint-disable no-script-url */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { ProductForm } from '../features/products/ProductForm';
import { CatalogRefreshCard } from '../features/settings/CatalogRefreshCard';
import { fetchKofiPreview, uploadProductImage } from '../services/productService';
import { useData } from '../data/DataProvider';

// Comme les autres tests de formulaires : fireEvent (enveloppé dans act par Testing Library), pas userEvent.
const userEvent = {
  click: (el) => fireEvent.click(el),
  type: (el, text) => fireEvent.change(el, { target: { value: `${el.value}${text}` } }),
  clear: (el) => fireEvent.change(el, { target: { value: '' } }),
  upload: (el, file) => fireEvent.change(el, { target: { files: [file] } }),
};

jest.mock('../services/productService', () => ({ fetchKofiPreview: jest.fn(), uploadProductImage: jest.fn() }));
jest.mock('../data/DataProvider', () => ({ useData: jest.fn() }));

const LINK = 'https://ko-fi.com/s/58d678ea42';
const NEW_PHOTO = 'https://storage.ko-fi.com/cdn/useruploads/post/new.jpeg';
const OLD_PHOTO = 'https://storage.ko-fi.com/cdn/useruploads/post/old.jpeg';
const PREVIEW = { name: 'Sticker Renard', price: 4, currency: 'EUR', imageUrl: NEW_PHOTO, kofi_url: LINK };

const setup = (props = {}) => {
  const onSave = jest.fn().mockResolvedValue({});
  const onClose = jest.fn();
  render(<ProductForm onSave={onSave} onClose={onClose} {...props} />);
  return { onSave, onClose };
};
const fetchFromKofiTab = async (link = LINK) => {
  userEvent.type(screen.getByLabelText('Lien du produit Ko-fi'), link);
  userEvent.click(screen.getByRole('button', { name: /Récupérer/ }));
};

beforeEach(() => jest.clearAllMocks());

describe('ProductForm : image depuis un lien Ko-fi (création)', () => {
  test('pré-remplit nom, prix, image et lien après lecture, et affiche l’aperçu', async () => {
    fetchKofiPreview.mockResolvedValue(PREVIEW);
    const { onSave } = setup();
    await fetchFromKofiTab();

    const panel = await screen.findByRole('region', { name: /Données trouvées sur Ko-fi/ });
    expect(within(panel).getByText(/Trouvé sur Ko-fi/)).toHaveTextContent('« Sticker Renard »');
    expect(fetchKofiPreview).toHaveBeenCalledWith(LINK);

    userEvent.click(within(panel).getByRole('button', { name: /Appliquer la sélection/ }));
    expect(screen.getByPlaceholderText('Nom du produit')).toHaveValue('Sticker Renard');
    expect(screen.getByRole('spinbutton')).toHaveValue(4);
    expect(screen.getByAltText("Aperçu de l'image")).toHaveAttribute('src', NEW_PHOTO);

    userEvent.type(screen.getByPlaceholderText(/Stickers/), 'Stickers');
    userEvent.click(screen.getByRole('button', { name: /Créer le produit/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ name: 'Sticker Renard', price: 4, image: NEW_PHOTO, kofi_url: LINK, category: 'Stickers' });
  });

  test('rien n’est appliqué tant que l’utilisatrice ne valide pas', async () => {
    fetchKofiPreview.mockResolvedValue(PREVIEW);
    setup();
    await fetchFromKofiTab();
    await screen.findByRole('region', { name: /Données trouvées/ });
    expect(screen.getByPlaceholderText('Nom du produit')).toHaveValue('');
    userEvent.click(screen.getByRole('button', { name: 'Ignorer' }));
    expect(screen.queryByRole('region', { name: /Données trouvées/ })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nom du produit')).toHaveValue('');
  });

  test('Cloudflare : message clair, formulaire intact, suggestion de coller l’URL de l’image', async () => {
    fetchKofiPreview.mockRejectedValue(new Error('kofi_blocked'));
    setup();
    await fetchFromKofiTab();
    expect(await screen.findByRole('alert')).toHaveTextContent(/anti-robots.*adresse de l'image/);
    expect(screen.getByPlaceholderText('Nom du produit')).toHaveValue('');
  });

  test('lien invalide : refusé côté navigateur, aucun appel réseau', async () => {
    setup();
    await fetchFromKofiTab('https://ko-fi.com.evil.fr/s/58d678ea42');
    expect(await screen.findByRole('alert')).toHaveTextContent(/Lien invalide/);
    expect(fetchKofiPreview).not.toHaveBeenCalled();
  });

  test('état de chargement pendant la lecture', async () => {
    let release;
    fetchKofiPreview.mockReturnValue(new Promise((r) => { release = r; }));
    setup();
    await fetchFromKofiTab();
    expect(await screen.findByRole('button', { name: /Lecture/ })).toBeDisabled();
    release(PREVIEW);
    await screen.findByRole('region', { name: /Données trouvées/ });
  });
});

describe('ProductForm : image par URL, emoji, fichier', () => {
  test('URL https acceptée, aperçu immédiat ; http:// et javascript: refusés', async () => {
    const { onSave } = setup({ product: { name: 'Print', category: 'Art', price: 5, image: '🎨' } });
    userEvent.click(screen.getByRole('tab', { name: /URL/ }));
    const input = screen.getByLabelText("Adresse de l'image");

    userEvent.type(input, 'javascript:alert(1)');
    expect(screen.getByRole('alert')).toHaveTextContent(/https/);
    userEvent.clear(input);
    userEvent.type(input, 'http://exemple.fr/a.png');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    userEvent.clear(input);
    userEvent.type(input, 'https://exemple.fr/a.png');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByAltText("Aperçu de l'image")).toHaveAttribute('src', 'https://exemple.fr/a.png');

    userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].image).toBe('https://exemple.fr/a.png');
  });

  test('emoji : un emoji passe, un lien ou une balise sont refusés', () => {
    setup();
    userEvent.click(screen.getByRole('tab', { name: /Emoji/ }));
    userEvent.click(screen.getByRole('button', { name: 'Emoji ✨' }));
    expect(screen.getByLabelText("Aperçu de l'image")).toHaveTextContent('✨');
    userEvent.type(screen.getByLabelText('Emoji'), '<b>');
    expect(screen.getByRole('alert')).toHaveTextContent(/emoji uniquement/i);
  });

  test('fichier : un format non pris en charge est refusé avec un message', async () => {
    setup();
    userEvent.click(screen.getByRole('tab', { name: /Fichier/ }));
    const file = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' });
    userEvent.upload(screen.getByLabelText('Fichier image'), file, { applyAccept: false });
    expect(await screen.findByRole('alert')).toHaveTextContent(/Format non pris en charge/);
    expect(uploadProductImage).not.toHaveBeenCalled();
  });
});

describe('ProductForm : modification et resynchronisation', () => {
  const product = { id: 'p1', name: 'Sticker Renard', category: 'Stickers', price: 3.5, image: OLD_PHOTO, kofi_url: LINK };

  test('« Resynchroniser » propose un comparatif ; prix et photo existants décochés par défaut', async () => {
    fetchKofiPreview.mockResolvedValue(PREVIEW);
    const { onSave } = setup({ product });
    userEvent.click(screen.getByRole('button', { name: /Resynchroniser depuis Ko-fi/ }));

    const panel = await screen.findByRole('region', { name: /Données trouvées/ });
    expect(within(panel).getByLabelText('Appliquer : Prix')).not.toBeChecked();
    expect(within(panel).getByLabelText('Appliquer : Image')).not.toBeChecked();
    expect(within(panel).getByText(/Remplace le prix actuel/)).toBeInTheDocument();
    expect(within(panel).getByText(/Remplace la photo actuelle/)).toBeInTheDocument();

    // « Appliquer » sans rien cocher est impossible : rien n'est écrasé.
    expect(within(panel).getByRole('button', { name: /Appliquer la sélection/ })).toBeDisabled();
    userEvent.click(screen.getByRole('button', { name: 'Ignorer' }));
    userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ price: 3.5 });
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('image'); // inchangée : non renvoyée
  });

  test('le prix n’est remplacé qu’une fois coché puis appliqué', async () => {
    fetchKofiPreview.mockResolvedValue(PREVIEW);
    const { onSave } = setup({ product });
    userEvent.click(screen.getByRole('button', { name: /Resynchroniser/ }));
    const panel = await screen.findByRole('region', { name: /Données trouvées/ });
    userEvent.click(within(panel).getByLabelText('Appliquer : Prix'));
    userEvent.click(within(panel).getByRole('button', { name: /Appliquer la sélection/ }));
    expect(screen.getByRole('spinbutton')).toHaveValue(4);
    userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ price: 4 });
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('image');
  });

  test('« Déjà à jour » quand rien ne diffère', async () => {
    fetchKofiPreview.mockResolvedValue({ ...PREVIEW, price: 3.5, imageUrl: OLD_PHOTO });
    setup({ product });
    userEvent.click(screen.getByRole('button', { name: /Resynchroniser/ }));
    expect(await screen.findByText(/déjà à jour/)).toBeInTheDocument();
  });

  test('pas de bouton de resynchronisation sans lien Ko-fi valide', () => {
    setup({ product: { ...product, kofi_url: '' } });
    expect(screen.queryByRole('button', { name: /Resynchroniser/ })).not.toBeInTheDocument();
  });

  test("refuse d'enregistrer un lien Ko-fi qui n'est pas en https", async () => {
    const { onSave } = setup({ product: { ...product, kofi_url: 'javascript:alert(1)' } });
    userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText(/https/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('Rafraîchissement en masse du catalogue', () => {
  const products = [
    { id: 'a', name: 'Sticker A', price: 0, image: '🎁', kofi_url: LINK },
    { id: 'b', name: 'Sticker B', price: 5, image: OLD_PHOTO, kofi_url: 'https://ko-fi.com/s/bbbbbbbbbb' },
    { id: 'c', name: 'Sticker C', price: 2, image: '🎁', kofi_url: 'https://ko-fi.com/s/cccccccccc' },
    { id: 'd', name: 'Sans lien', price: 2, image: '🎁', kofi_url: null },
    { id: 'e', name: 'Lien suspect', price: 2, image: '🎁', kofi_url: 'https://evil.fr/s/eeeeeeeeee' },
  ];
  let updateProduct;
  beforeEach(() => {
    updateProduct = jest.fn().mockResolvedValue({});
    useData.mockReturnValue({ products, updateProduct });
  });

  test('propose les changements, applique seulement le coché, et fait le bilan', async () => {
    fetchKofiPreview.mockImplementation(async (url) => {
      if (url === LINK) return { ...PREVIEW };                              // A : vide -> tout proposé
      if (url.endsWith('bbbbbbbbbb')) return { ...PREVIEW, price: 6 };       // B : prix et photo existants -> confirmation
      throw new Error('kofi_not_found');                                     // C : échec
    });
    render(<CatalogRefreshCard />);
    expect(screen.getByText(/3 produits/)).toBeInTheDocument(); // sans lien et lien suspect exclus

    userEvent.click(screen.getByRole('button', { name: /Vérifier les produits/ }));
    expect(await screen.findByText(/produits avec des différences/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(fetchKofiPreview).toHaveBeenCalledTimes(3);
    expect(fetchKofiPreview).not.toHaveBeenCalledWith('https://evil.fr/s/eeeeeeeeee');

    // A : tout est pré-coché (rien n'est écrasé) ; B : prix / photo existants décochés.
    expect(screen.getAllByLabelText('Appliquer : Prix')[0]).toBeChecked();
    expect(screen.getAllByLabelText('Appliquer : Prix')[1]).not.toBeChecked();
    expect(screen.getAllByLabelText('Appliquer : Image')[1]).not.toBeChecked();

    userEvent.click(screen.getByRole('button', { name: /Appliquer 2 modifications/ }));
    expect(await screen.findByLabelText('Bilan')).toBeInTheDocument();
    expect(updateProduct).toHaveBeenCalledTimes(1);
    expect(updateProduct).toHaveBeenCalledWith('a', { image: NEW_PHOTO, price: 4 });

    const bilan = screen.getByLabelText('Bilan');
    expect(bilan).toHaveTextContent('1 produit(s) mis à jour');
    expect(bilan).toHaveTextContent('1 ignoré(s) ou déjà à jour'); // B laissé tel quel
    expect(bilan).toHaveTextContent('1 en échec');                  // C
  });

  test('Cloudflare : on s’arrête au premier refus au lieu d’insister sur chaque produit', async () => {
    fetchKofiPreview.mockRejectedValue(new Error('kofi_blocked'));
    render(<CatalogRefreshCard />);
    userEvent.click(screen.getByRole('button', { name: /Vérifier les produits/ }));
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(/anti-robots/);
    expect(fetchKofiPreview).toHaveBeenCalledTimes(1);
    expect(updateProduct).not.toHaveBeenCalled();
  });

  test('un échec de mise à jour est compté, pas masqué', async () => {
    fetchKofiPreview.mockResolvedValue(PREVIEW);
    updateProduct.mockRejectedValue(new Error('Un produit porte déjà ce nom.'));
    useData.mockReturnValue({ products: [products[0]], updateProduct });
    render(<CatalogRefreshCard />);
    userEvent.click(screen.getByRole('button', { name: /Vérifier les produits/ }));
    userEvent.click(await screen.findByRole('button', { name: /Appliquer 2 modifications/ }, { timeout: 5000 }));
    expect(await screen.findByLabelText('Bilan')).toHaveTextContent('1 en échec');
  });
});
